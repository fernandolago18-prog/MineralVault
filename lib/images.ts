/**
 * lib/images.ts
 * Utilidades para manejo, formateo y visualización de imágenes de minerales
 * almacenadas en Google Drive u orígenes externos.
 */

/**
 * Convierte un File ID de Google Drive o una URL existente de Drive (thumbnail o view)
 * a una URL directa de alta velocidad en el CDN de Google (lh3.googleusercontent.com)
 * optimizada para previsualizaciones o visualización en alta definición.
 *
 * @param urlOrId ID del archivo en Drive o URL existente
 * @param size Ancho deseado en px (ej. 400, 800, 1600) o 's0' para resolución original
 */
export function getDriveImageUrl(
  urlOrId: string | null | undefined,
  size: number | string = 400
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

  // 2. Extraer el file ID de Google Drive
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

  // 3. Formatear parámetro de tamaño
  // Si size es 's0' o 'original' -> =s0 (tamaño original de alta fidelidad)
  // De lo contrario -> =w400, =w800, etc.
  const sizeParam =
    typeof size === 'string' && (size === 's0' || size === 'original')
      ? '=s0'
      : `=w${size}`

  return `https://lh3.googleusercontent.com/d/${fileId}${sizeParam}`
}
