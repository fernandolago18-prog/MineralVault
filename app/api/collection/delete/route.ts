/**
 * app/api/collection/delete/route.ts
 * Borra un ejemplar por completo: borra todas sus fotos en Google Drive y su registro en Supabase.
 *
 * Body JSON: { collectionId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { refreshAccessToken }        from '@/lib/google/auth'
import { deleteFileFromDrive }       from '@/lib/google/drive'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verificar sesión
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Parsear body
    const { collectionId } = await req.json() as { collectionId?: string }

    if (!collectionId) {
      return NextResponse.json({ error: 'Falta parámetro: collectionId' }, { status: 400 })
    }

    // 3. Verificar propiedad del ejemplar
    const { data: specimen, error: specError } = await (supabase
      .from('user_collection') as any)
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (specError || !specimen) {
      return NextResponse.json({ error: 'Ejemplar no encontrado o sin permisos' }, { status: 404 })
    }

    // 4. Obtener todas las fotos asociadas
    const { data: photos } = await (supabase
      .from('specimen_photos') as any)
      .select('id, drive_file_id')
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)

    // 5. Si hay fotos, borrarlas de Google Drive
    if (photos && photos.length > 0) {
      const { data: profile } = await (supabase
        .from('user_profiles') as any)
        .select('google_refresh_token')
        .eq('id', user.id)
        .single()

      if (profile?.google_refresh_token) {
        try {
          const accessToken = await refreshAccessToken(profile.google_refresh_token)
          for (const photo of photos) {
            try {
              await deleteFileFromDrive(accessToken, photo.drive_file_id)
            } catch (driveErr) {
              console.warn(`[Drive Bulk Delete] Falló borrar archivo ${photo.drive_file_id}:`, driveErr)
            }
          }
        } catch (authErr) {
          console.warn('[Drive Bulk Delete] Falló refrescar access token para borrado:', authErr)
        }
      }
    }

    // 6. Eliminar ejemplar de la colección (el cascade borra automáticamente los registros en specimen_photos)
    const { error: deleteError } = await (supabase
      .from('user_collection') as any)
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error(`Error al eliminar ejemplar de la base de datos: ${deleteError.message}`)
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Delete Specimen API Error]:', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
