/**
 * lib/google/drive.ts
 * Helpers para interactuar con la API REST de Google Drive v3.
 * Todo se ejecuta en el servidor — el access_token nunca llega al cliente.
 */

const DRIVE_API    = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

/** Nombre de la carpeta raíz en el Drive del usuario */
const ROOT_FOLDER_NAME = 'MineralVault'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface DriveFile {
  id:              string
  name:            string
  mimeType:        string
  webViewLink?:    string
  webContentLink?: string
  thumbnailLink?:  string
  size?:           string
}

// ─── Gestión de carpetas ──────────────────────────────────────────────────────

/**
 * Busca la carpeta raíz "MineralVault" en el Drive del usuario.
 * Si no existe, la crea. Devuelve el folderId.
 */
export async function getOrCreateRootFolder(
  accessToken: string,
): Promise<string> {
  // Buscar carpeta existente
  const searchRes = await fetch(
    `${DRIVE_API}/files?` + new URLSearchParams({
      q:      `name='${ROOT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
    }),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  const searchData = await searchRes.json() as { files: DriveFile[] }

  if (searchData.files.length > 0) {
    return searchData.files[0].id
  }

  // Crear carpeta raíz
  const createRes = await fetch(`${DRIVE_API}/files`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:     ROOT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })

  const folder = await createRes.json() as DriveFile
  return folder.id
}

/**
 * Busca o crea una subcarpeta con el nombre del mineral dentro de la raíz.
 */
export async function getOrCreateMineralFolder(
  accessToken:   string,
  parentFolderId: string,
  mineralName:   string,
): Promise<string> {
  // Sanear el nombre para evitar caracteres inválidos en Drive
  const safeName = mineralName.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 100)

  const searchRes = await fetch(
    `${DRIVE_API}/files?` + new URLSearchParams({
      q:      `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
    }),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  const searchData = await searchRes.json() as { files: DriveFile[] }

  if (searchData.files.length > 0) {
    return searchData.files[0].id
  }

  const createRes = await fetch(`${DRIVE_API}/files`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:     safeName,
      mimeType: 'application/vnd.google-apps.folder',
      parents:  [parentFolderId],
    }),
  })

  const folder = await createRes.json() as DriveFile
  return folder.id
}

// ─── Subida de archivo ────────────────────────────────────────────────────────

/**
 * Sube un archivo a Google Drive usando multipart upload.
 * @param accessToken   Token de acceso válido.
 * @param folderId      ID de la carpeta destino.
 * @param fileBuffer    Buffer del archivo a subir.
 * @param mimeType      Tipo MIME del archivo (ej. 'image/jpeg').
 * @param filename      Nombre del archivo en Drive.
 */
export async function uploadFileToDrive(
  accessToken:  string,
  folderId:     string,
  fileBuffer:   ArrayBuffer,
  mimeType:     string,
  filename:     string,
): Promise<DriveFile> {
  const metadata = JSON.stringify({
    name:    filename,
    parents: [folderId],
  })

  // Construir multipart/related body manualmente
  const boundary  = '-------MineralVaultBoundary'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metaPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    metadata

  const filePart =
    `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`

  const metaBytes  = new TextEncoder().encode(metaPart)
  const fileHeader = new TextEncoder().encode(filePart)
  const closeBytes = new TextEncoder().encode(closeDelimiter)

  const bodyBuffer = new Uint8Array(
    metaBytes.byteLength + fileHeader.byteLength + fileBuffer.byteLength + closeBytes.byteLength,
  )
  let offset = 0
  bodyBuffer.set(metaBytes,  offset); offset += metaBytes.byteLength
  bodyBuffer.set(fileHeader, offset); offset += fileHeader.byteLength
  bodyBuffer.set(new Uint8Array(fileBuffer), offset); offset += fileBuffer.byteLength
  bodyBuffer.set(closeBytes, offset)

  const uploadRes = await fetch(
    `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: bodyBuffer,
    },
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.json()
    throw new Error(`Drive upload failed: ${JSON.stringify(err)}`)
  }

  return uploadRes.json() as Promise<DriveFile>
}

// ─── Eliminación de archivo ───────────────────────────────────────────────────

/**
 * Mueve un archivo de Drive a la papelera (no lo elimina permanentemente).
 */
export async function deleteFileFromDrive(
  accessToken: string,
  fileId:      string,
): Promise<void> {
  await fetch(`${DRIVE_API}/files/${fileId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/**
 * Hace un archivo de Drive visible para cualquiera con el enlace (role=reader).
 * Necesario para que las URLs de thumbnail carguen directamente en <img> sin
 * necesitar autenticación de Google en el navegador del usuario.
 */
export async function makeFilePublic(
  accessToken: string,
  fileId:      string,
): Promise<void> {
  await fetch(`${DRIVE_API}/files/${fileId}/permissions`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
}

// ─── Thumbnails ───────────────────────────────────────────────────────────────

/**
 * Google Drive no genera thumbnails inmediatamente.
 * Construimos una URL de visualización pública embebible.
 * Para imágenes propias (drive.file scope), usamos el webViewLink.
 */
export function buildEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function buildThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
}
