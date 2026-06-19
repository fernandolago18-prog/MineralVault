/**
 * app/api/auth/google/disconnect/route.ts
 * Desconecta la cuenta de Google Drive de manera segura.
 * 1. Verifica que el usuario tenga una sesión de Supabase activa.
 * 2. Actualiza `google_drive_connected = false` en `user_profiles` utilizando el cliente de usuario.
 * 3. Elimina de forma segura la fila en `user_google_tokens` usando `createAdminClient()`.
 */

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(): Promise<NextResponse> {
  try {
    // 1. Verificar sesión activa
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Actualizar user_profiles
    const { error: profileError } = await (supabase
      .from('user_profiles') as any)
      .update({
        google_drive_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('[Disconnect API] Profile update error:', profileError)
      return NextResponse.json({ error: 'Error al desconectar el perfil' }, { status: 500 })
    }

    // 3. Eliminar de forma segura el token con privilegios de administrador
    const adminSupabase = createAdminClient()
    const { error: tokenError } = await (adminSupabase
      .from('user_google_tokens') as any)
      .delete()
      .eq('user_id', user.id)

    if (tokenError) {
      console.error('[Disconnect API] Token delete error:', tokenError)
      // No lanzamos error fatal, ya que el perfil ya se marcó como desconectado,
      // pero se registra en logs para auditoría.
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Disconnect API Error]:', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
