/**
 * app/api/drive/delete/route.ts
 * Elimina una foto de espécimen: borra el archivo de Drive y el registro de Supabase.
 *
 * Body JSON: { photoId: string }
 *
 * SEGURIDAD:
 * - Solo el propietario puede eliminar (verificado explícitamente + RLS).
 * - Si era la foto principal, promueve la siguiente foto disponible.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { refreshAccessToken }        from '@/lib/google/auth'
import { deleteFileFromDrive }       from '@/lib/google/drive'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Verificar sesión ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // ── 2. Parsear body ──────────────────────────────────────────────────────
    const { photoId } = await req.json() as { photoId?: string }

    if (!photoId) {
      return NextResponse.json({ error: 'Falta parámetro: photoId' }, { status: 400 })
    }

    // ── 3. Obtener la foto y verificar propiedad ─────────────────────────────
    const { data: photo, error: photoError } = await (supabase
      .from('specimen_photos') as any)
      .select('id, drive_file_id, collection_id, is_primary, user_id')
      .eq('id', photoId)
      .eq('user_id', user.id)  // Verificación explícita de propiedad
      .single()

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'Foto no encontrada o sin permiso.' },
        { status: 403 },
      )
    }

    // ── 4. Obtener refresh_token y borrar de Drive ───────────────────────────
    const { data: profile } = await (supabase
      .from('user_profiles') as any)
      .select('google_refresh_token')
      .eq('id', user.id)
      .single()

    if (profile?.google_refresh_token) {
      try {
        const accessToken = await refreshAccessToken(profile.google_refresh_token)
        await deleteFileFromDrive(accessToken, photo.drive_file_id)
      } catch (driveErr) {
        // Si falla el borrado en Drive (ej. archivo ya no existe),
        // continuamos igualmente con el borrado del registro en BD.
        console.warn('[Drive Delete] Failed to delete from Drive:', driveErr)
      }
    }

    // ── 5. Eliminar registro de specimen_photos ──────────────────────────────
    const { error: deleteError } = await (supabase
      .from('specimen_photos') as any)
      .delete()
      .eq('id', photoId)
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error(`Error al eliminar foto de BD: ${deleteError.message}`)
    }

    // ── 6. Si era la foto principal → promover la siguiente ──────────────────
    if (photo.is_primary) {
      const { data: remainingPhotos } = await (supabase
        .from('specimen_photos') as any)
        .select('id, drive_thumb_url')
        .eq('collection_id', photo.collection_id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (remainingPhotos && remainingPhotos.length > 0) {
        const nextPhoto = remainingPhotos[0]
        // Marcar la siguiente como principal
        await (supabase
          .from('specimen_photos') as any)
          .update({ is_primary: true })
          .eq('id', nextPhoto.id)

        // Actualizar thumbnail en user_collection
        await (supabase
          .from('user_collection') as any)
          .update({ primary_photo_url: nextPhoto.drive_thumb_url })
          .eq('id', photo.collection_id)
          .eq('user_id', user.id)
      } else {
        // Sin fotos restantes — limpiar primary_photo_url
        await (supabase
          .from('user_collection') as any)
          .update({ primary_photo_url: null })
          .eq('id', photo.collection_id)
          .eq('user_id', user.id)
      }
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Drive Delete Error]:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── Marcar como foto principal ───────────────────────────────────────────────
// PATCH /api/drive/delete  (body: { photoId, collectionId })
// Reutilizamos esta ruta para el set-as-primary para no crear otro endpoint.

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { photoId, collectionId } = await req.json() as {
      photoId?: string; collectionId?: string
    }

    if (!photoId || !collectionId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verificar propiedad
    const { data: photo } = await (supabase
      .from('specimen_photos') as any)
      .select('drive_thumb_url')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .single()

    if (!photo) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 403 })
    }

    // Desmarcar todas las fotos del especimen
    await (supabase
      .from('specimen_photos') as any)
      .update({ is_primary: false })
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)

    // Marcar la nueva principal
    await (supabase
      .from('specimen_photos') as any)
      .update({ is_primary: true })
      .eq('id', photoId)
      .eq('user_id', user.id)

    // Actualizar thumbnail en user_collection
    await (supabase
      .from('user_collection') as any)
      .update({ primary_photo_url: photo.drive_thumb_url })
      .eq('id', collectionId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Set Primary Error]:', err)
    return NextResponse.json({ error: 'Error al actualizar foto principal' }, { status: 500 })
  }
}
