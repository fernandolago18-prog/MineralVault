/**
 * app/api/drive/upload/route.ts
 * Sube una foto de espécimen a Google Drive y registra el metadato en Supabase.
 *
 * Flujo:
 * 1. Valida sesión Supabase y que el collectionItem pertenece al usuario (RLS implícito).
 * 2. Recupera el refresh_token del usuario desde user_profiles.
 * 3. Obtiene un access_token fresco con el refresh_token.
 * 4. Busca o crea la carpeta raíz "MineralVault" y la subcarpeta del mineral.
 * 5. Sube el archivo a Drive (server-side multipart).
 * 6. Inserta el registro en specimen_photos.
 * 7. Si es la primera foto, actualiza primary_photo_url en user_collection.
 *
 * SEGURIDAD:
 * - Solo authenticated (Supabase JWT verificado).
 * - El refresh_token y client_secret nunca llegan al cliente.
 * - Límite de tamaño: 10 MB por foto.
 * - Tipos MIME permitidos: image/jpeg, image/png, image/webp, image/heic.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { refreshAccessToken }        from '@/lib/google/auth'
import {
  getOrCreateRootFolder,
  getOrCreateMineralFolder,
  uploadFileToDrive,
  buildThumbnailUrl,
} from '@/lib/google/drive'

export const dynamic = 'force-dynamic'

// Límites
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Verificar sesión ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // ── 2. Parsear FormData ──────────────────────────────────────────────────
    const formData     = await req.formData()
    const file         = formData.get('file')         as File | null
    const collectionId = formData.get('collectionId') as string | null
    const mineralName  = formData.get('mineralName')  as string | null
    const caption      = formData.get('caption')      as string | null

    if (!file || !collectionId || !mineralName) {
      return NextResponse.json(
        { error: 'Faltan parámetros: file, collectionId, mineralName' },
        { status: 400 },
      )
    }

    // ── 3. Validar archivo ───────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Usa JPEG, PNG, WebP o HEIC.` },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB.` },
        { status: 400 },
      )
    }

    // ── 4. Verificar que el collectionItem pertenece al usuario ──────────────
    // (La política RLS lo haría igualmente, pero verificamos explícitamente
    //  para devolver un error más descriptivo al cliente.)
    const { data: collectionItem, error: collectionError } = await supabase
      .from('user_collection')
      .select('id, user_id, primary_photo_url')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (collectionError || !collectionItem) {
      return NextResponse.json(
        { error: 'Espécimen no encontrado o no tienes permiso.' },
        { status: 403 },
      )
    }

    // ── 5. Obtener refresh_token del usuario ─────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('google_refresh_token, google_drive_connected')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.google_refresh_token) {
      return NextResponse.json(
        { error: 'Google Drive no conectado. Ve a Ajustes para conectar tu cuenta.' },
        { status: 400 },
      )
    }

    // ── 6. Obtener access_token fresco ───────────────────────────────────────
    const accessToken = await refreshAccessToken(profile.google_refresh_token)

    // ── 7. Buscar / crear estructura de carpetas en Drive ────────────────────
    const rootFolderId    = await getOrCreateRootFolder(accessToken)
    const mineralFolderId = await getOrCreateMineralFolder(accessToken, rootFolderId, mineralName)

    // ── 8. Subir archivo a Drive ─────────────────────────────────────────────
    const fileBuffer = await file.arrayBuffer()
    const filename   = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const driveFile = await uploadFileToDrive(
      accessToken,
      mineralFolderId,
      fileBuffer,
      file.type,
      filename,
    )

    // ── 9. Contar fotos existentes (¿es la primera?) ─────────────────────────
    const { count: existingPhotosCount } = await supabase
      .from('specimen_photos')
      .select('id', { count: 'exact', head: true })
      .eq('collection_id', collectionId)

    const isPrimary = (existingPhotosCount ?? 0) === 0

    // ── 10. Insertar registro en specimen_photos ──────────────────────────────
    const thumbUrl = buildThumbnailUrl(driveFile.id)
    const viewUrl  = driveFile.webViewLink ?? `https://drive.google.com/file/d/${driveFile.id}/view`

    const { data: photo, error: photoInsertError } = await supabase
      .from('specimen_photos')
      .insert({
        collection_id:  collectionId,
        user_id:        user.id,
        drive_file_id:  driveFile.id,
        drive_view_url: viewUrl,
        drive_thumb_url: thumbUrl,
        filename:       file.name,
        caption:        caption?.trim() || null,
        is_primary:     isPrimary,
      })
      .select()
      .single()

    if (photoInsertError) {
      throw new Error(`Error al guardar foto en BD: ${photoInsertError.message}`)
    }

    // ── 11. Si es la primera foto → actualizar primary_photo_url ─────────────
    if (isPrimary) {
      await supabase
        .from('user_collection')
        .update({ primary_photo_url: thumbUrl, updated_at: new Date().toISOString() })
        .eq('id', collectionId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ photo }, { status: 201 })

  } catch (err) {
    console.error('[Drive Upload Error]:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
