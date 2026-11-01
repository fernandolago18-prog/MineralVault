/**
 * lib/images.ts
 * Utilidades para manejo, formateo, normalización de orientación y compresión
 * de imágenes de minerales almacenadas en Google Drive u orígenes externos.
 */

/**
 * Lee la etiqueta EXIF Orientation de un archivo JPEG.
 * Valores:
 * 1 = Normal (0°)
 * 3 = Invertido (180°)
 * 6 = Rotado 90° horario (fotos verticales típicas de smartphones)
 * 8 = Rotado 270° horario (90° antihorario)
 */
export async function getExifOrientation(file: Blob): Promise<number> {
  try {
    const slice = await file.slice(0, 64 * 1024).arrayBuffer()
    const view = new DataView(slice)

    // Comprobar marcador SOI de JPEG (0xFFD8)
    if (view.getUint16(0, false) !== 0xffd8) return 1

    let offset = 2
    const length = slice.byteLength

    while (offset < length - 2) {
      const marker = view.getUint16(offset, false)
      offset += 2

      // Marcador APP1 (0xFFE1) que contiene EXIF
      if (marker === 0xffe1) {
        const app1Length = view.getUint16(offset, false)
        offset += 2

        // Verificar cabecera "Exif\0\0" (0x45786966)
        if (view.getUint32(offset, false) === 0x45786966) {
          const tiffOffset = offset + 6
          const littleEndian = view.getUint16(tiffOffset, false) === 0x4949 // 'II'
          const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian)
          const numEntries = view.getUint16(tiffOffset + ifdOffset, littleEndian)

          for (let i = 0; i < numEntries; i++) {
            const entryOffset = tiffOffset + ifdOffset + 2 + i * 12
            if (entryOffset + 12 > length) break
            const tag = view.getUint16(entryOffset, littleEndian)
            if (tag === 0x0112) {
              // Etiqueta 0x0112 = Orientation
              return view.getUint16(entryOffset + 8, littleEndian)
            }
          }
        }
        offset += app1Length - 2
      } else if ((marker & 0xff00) === 0xff00 && marker !== 0xffda && marker !== 0xffd9) {
        // Otros marcadores JPEG
        const sectionLength = view.getUint16(offset, false)
        offset += sectionLength
      } else {
        break
      }
    }
  } catch (err) {
    console.warn('[EXIF Parse Error]:', err)
  }
  return 1
}

/**
 * Normaliza la orientación y comprime una imagen seleccionada para subir.
 * 
 * PROBLEMA QUE RESUELVE:
 * Los teléfonos móviles capturan los píxeles físicamente en horizontal (sensor apaisado)
 * y delegan la orientación vertical a una etiqueta de metadatos EXIF (Orientation: 6 u 8).
 * Si la imagen se redimensiona con canvas tradicional o se envía sin procesar,
 * los servicios o visores que descartan EXIF muestran la foto rotada (de vertical a horizontal).
 *
 * Esta función:
 * 1. Corrige la rotación físicamente en la matriz de píxeles (orientación 'from-image').
 * 2. Mantiene el campo de visión vertical nativo (alto > ancho) sin voltearla.
 * 3. Redimensiona proporcionalmente si excede MAX_DIM (2000px).
 * 4. Ajusta la calidad para respetar el límite de 4 MB de Vercel/Drive.
 */
export async function processAndOrientImage(file: File): Promise<File> {
  const MAX_BYTES = 4 * 1024 * 1024 // 4 MB objetivo
  const MAX_DIM = 2000 // máximo ancho o alto en px

  // No procesar HEIC en cliente (se envía directo para soporte en Drive o conversión)
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return file
  }

  // 1. Intento primario con createImageBitmap ({ imageOrientation: 'from-image' })
  // Este es el estándar moderno en navegadores (Chrome, Safari 15+, Edge, Firefox)
  // que lee EXIF y rota los píxeles a su orientación vertical real antes de dibujar.
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      let { width: w, height: h } = bitmap

      // Redimensionar proporcionalmente si sobrepasa MAX_DIM
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) {
          h = Math.round((h / w) * MAX_DIM)
          w = MAX_DIM
        } else {
          w = Math.round((w / h) * MAX_DIM)
          h = MAX_DIM
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, w, h)
        bitmap.close()

        const blob = await new Promise<Blob | null>(res => {
          canvas.toBlob(res, 'image/jpeg', 0.88)
        })

        if (blob) {
          if (blob.size <= MAX_BYTES) {
            return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
          }

          // Si aún supera 4 MB, comprimir con menor calidad
          const blobCompressed = await new Promise<Blob | null>(res => {
            canvas.toBlob(res, 'image/jpeg', 0.68)
          })

          if (blobCompressed) {
            return new File([blobCompressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
          }
        }
      }
    } catch (bitmapErr) {
      console.warn('[createImageBitmap fallback to EXIF manual]:', bitmapErr)
    }
  }

  // 2. Fallback manual leyendo etiqueta EXIF con rotación en Canvas
  return new Promise<File>(async resolve => {
    const orientation = await getExifOrientation(file)
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      let w = img.naturalWidth
      let h = img.naturalHeight

      // Si la orientación EXIF es 5, 6, 7 u 8, el ancho y alto visual están invertidos
      const isRotated90 = orientation >= 5 && orientation <= 8
      let visualW = isRotated90 ? h : w
      let visualH = isRotated90 ? w : h

      // Escalar visualmente dentro de MAX_DIM
      if (visualW > MAX_DIM || visualH > MAX_DIM) {
        if (visualW >= visualH) {
          visualH = Math.round((visualH / visualW) * MAX_DIM)
          visualW = MAX_DIM
        } else {
          visualW = Math.round((visualW / visualH) * MAX_DIM)
          visualH = MAX_DIM
        }
      }

      canvas.width = visualW
      canvas.height = visualH

      // Aplicar transformaciones para hornear físicamente la orientación en los píxeles
      ctx.save()
      switch (orientation) {
        case 2:
          // Espejo horizontal
          ctx.translate(visualW, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(img, 0, 0, visualW, visualH)
          break
        case 3:
          // 180° invertido
          ctx.translate(visualW, visualH)
          ctx.rotate(Math.PI)
          ctx.drawImage(img, 0, 0, visualW, visualH)
          break
        case 4:
          // Espejo vertical
          ctx.translate(0, visualH)
          ctx.scale(1, -1)
          ctx.drawImage(img, 0, 0, visualW, visualH)
          break
        case 5:
          // 90° horario + espejo horizontal
          ctx.rotate(0.5 * Math.PI)
          ctx.scale(1, -1)
          ctx.drawImage(img, 0, -visualW, visualH, visualW)
          break
        case 6:
          // 90° horario (típica foto vertical de smartphone)
          ctx.translate(visualW, 0)
          ctx.rotate(0.5 * Math.PI)
          ctx.drawImage(img, 0, 0, visualH, visualW)
          break
        case 7:
          // 270° horario + espejo horizontal
          ctx.rotate(-0.5 * Math.PI)
          ctx.translate(-visualH, visualW)
          ctx.scale(1, -1)
          ctx.drawImage(img, 0, 0, visualH, visualW)
          break
        case 8:
          // 270° horario (o 90° antihorario)
          ctx.translate(0, visualH)
          ctx.rotate(-0.5 * Math.PI)
          ctx.drawImage(img, 0, 0, visualH, visualW)
          break
        default:
          // Normal (1)
          ctx.drawImage(img, 0, 0, visualW, visualH)
          break
      }
      ctx.restore()

      canvas.toBlob(blob => {
        if (!blob) {
          resolve(file)
          return
        }

        if (blob.size <= MAX_BYTES) {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        } else {
          canvas.toBlob(blob2 => {
            resolve(
              blob2
                ? new File([blob2], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
                : file
            )
          }, 'image/jpeg', 0.68)
        }
      }, 'image/jpeg', 0.88)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Convierte un File ID de Google Drive o una URL existente de Drive (thumbnail o view)
 * a una URL directa de alta velocidad en el CDN de Google (lh3.googleusercontent.com)
 * optimizada para previsualizaciones o visualización en alta definición.
 *
 * Preserva o añade parámetros de rotación (ej. -r90, -r180, -r270) si están presentes.
 *
 * @param urlOrId ID del archivo en Drive o URL existente
 * @param size Ancho deseado en px (ej. 400, 800, 1600) o 's0' para resolución original
 * @param rotation Rotación opcional en grados (90, 180, 270)
 */
export function getDriveImageUrl(
  urlOrId: string | null | undefined,
  size: number | string = 400,
  rotation?: number
): string {
  if (!urlOrId) return ''

  const str = urlOrId.trim()
  if (!str) return ''

  // 1. Si no es de Google Drive (ej. thumbnail_url de Mindat u otro host), devolver tal cual
  if (
    str.startsWith('http') &&
    !str.includes('drive.google.com') &&
    !str.includes('googleusercontent.com')
  ) {
    return str
  }

  // 2. Extraer rotación existente si la URL ya tenía parámetro -r90, -r180, -r270
  const existingRotMatch = str.match(/(-r(90|180|270))/)
  const rotSuffix = rotation ? `-r${rotation}` : existingRotMatch ? existingRotMatch[1] : ''

  // 3. Extraer el file ID de Google Drive
  let fileId = str

  // Si es del formato: https://drive.google.com/thumbnail?id=FILE_ID...
  const thumbMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (thumbMatch) {
    fileId = thumbMatch[1]
  } else {
    // Si es del formato: https://drive.google.com/file/d/FILE_ID/...
    const fileMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch) {
      fileId = fileMatch[1]
    } else {
      // Si es del formato: https://lh3.googleusercontent.com/d/FILE_ID...
      const lh3Match = str.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (lh3Match) {
        fileId = lh3Match[1]
      }
    }
  }

  // Limpiar cualquier sufijo de tamaño previo si estuviese concatenado en fileId
  fileId = fileId.split('=')[0].split('?')[0]

  // 4. Formatear parámetro de tamaño
  // Si size es 's0' o 'original' -> =s0 (tamaño original de alta fidelidad)
  // De lo contrario -> =w400, =w800, etc.
  const sizeParam =
    typeof size === 'string' && (size === 's0' || size === 'original')
      ? '=s0'
      : `=w${size}`

  return `https://lh3.googleusercontent.com/d/${fileId}${sizeParam}${rotSuffix}`
}
