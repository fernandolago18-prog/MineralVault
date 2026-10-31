/**
 * app/api/collection/delete/route.ts
 * Borra ejemplares de forma segura: elimina las fotos asociadas en Google Drive
 * y posteriormente elimina los registros en Supabase (disparando ON DELETE CASCADE).
 *
 * Admite:
 * - Body JSON: { collectionId: string } -> Elimina un ejemplar específico
 * - Body JSON: { mineralId: string }    -> Elimina todos los ejemplares de un mineral
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
    const { collectionId, mineralId } = await req.json() as {
      collectionId?: string
      mineralId?: string
    }

    if (!collectionId && !mineralId) {
      return NextResponse.json(
        { error: 'Falta parámetro: collectionId o mineralId' },
        { status: 400 }
      )
    }

    let targetCollectionIds: string[] = []

    if (collectionId) {
      // Verificar propiedad del ejemplar individual
      const { data: specimen, error: specError } = await (supabase
        .from('user_collection') as any)
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single()

      if (specError || !specimen) {
        return NextResponse.json(
          { error: 'Ejemplar no encontrado o sin permisos' },
          { status: 404 }
        )
      }
      targetCollectionIds = [specimen.id]
    } else if (mineralId) {
      // Obtener todos los ejemplares del mineral para este usuario
      const { data: specimens, error: specError } = await (supabase
        .from('user_collection') as any)
        .select('id')
        .eq('mineral_id', mineralId)
        .eq('user_id', user.id)

      if (specError) {
        return NextResponse.json({ error: 'Error al buscar ejemplares' }, { status: 500 })
      }
      targetCollectionIds = (specimens || []).map((s: any) => s.id)
    }

    if (targetCollectionIds.length === 0) {
      return NextResponse.json({ success: true, deletedCount: 0 })
    }

    // 3. Obtener todas las fotos asociadas a los ejemplares a eliminar
    const { data: photos } = await (supabase
      .from('specimen_photos') as any)
      .select('id, drive_file_id')
      .in('collection_id', targetCollectionIds)
      .eq('user_id', user.id)

    // 4. Si hay fotos, borrarlas de Google Drive
    if (photos && photos.length > 0) {
      const adminSupabase = createAdminClient()
      const { data: tokenData } = await (adminSupabase
        .from('user_google_tokens') as any)
        .select('refresh_token')
        .eq('user_id', user.id)
        .single()

      if (tokenData?.refresh_token) {
        try {
          const accessToken = await refreshAccessToken(tokenData.refresh_token)
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

    // 5. Eliminar los registros de user_collection (dispara ON DELETE CASCADE en specimen_photos)
    const { error: deleteError } = await (supabase
      .from('user_collection') as any)
      .delete()
      .in('id', targetCollectionIds)
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error(`Error al eliminar ejemplares de la base de datos: ${deleteError.message}`)
    }

    return NextResponse.json({ success: true, deletedCount: targetCollectionIds.length })

  } catch (err) {
    console.error('[Delete Specimen API Error]:', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
