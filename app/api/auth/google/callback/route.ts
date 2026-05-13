/**
 * app/api/auth/google/callback/route.ts
 * Callback OAuth 2.0 de Google.
 * 1. Verifica el token CSRF (state).
 * 2. Intercambia el código de autorización por refresh_token.
 * 3. Guarda el refresh_token en user_profiles (campo google_refresh_token).
 * 4. Marca google_drive_connected = true.
 * 5. Redirige al usuario de vuelta a la app.
 *
 * SEGURIDAD:
 * - Se verifica el state contra la cookie HttpOnly para prevenir CSRF.
 * - El refresh_token se guarda solo en la tabla del servidor (RLS: solo el propietario).
 * - El client_secret nunca sale del servidor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { exchangeCodeForTokens }     from '@/lib/google/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

  // — El usuario rechazó el consentimiento —
  if (errorParam) {
    console.warn('[Google Callback] User denied consent:', errorParam)
    return NextResponse.redirect(`${APP_URL}/catalog?error=google_denied`)
  }

  // — Parámetros obligatorios —
  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/catalog?error=google_invalid_callback`)
  }

  // — Verificar CSRF state —
  const savedState = req.cookies.get('google_oauth_state')?.value
  if (!savedState || savedState !== state) {
    console.error('[Google Callback] CSRF mismatch — possible attack')
    return NextResponse.redirect(`${APP_URL}/catalog?error=google_csrf`)
  }

  try {
    // — Verificar sesión Supabase —
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(`${APP_URL}/auth/login`)
    }

    // — Intercambiar code por tokens —
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.refresh_token) {
      // Esto puede ocurrir si el usuario ya autorizó la app en el pasado
      // y Google no devuelve un nuevo refresh_token. La solución es
      // revocar y reconectar, o usar el token existente.
      console.warn('[Google Callback] No refresh_token received — may already be connected')
      // Aún así marcamos como conectado (puede que ya tenga token)
    }

    // — Guardar refresh_token en Supabase —
    const updateData: Record<string, unknown> = {
      google_drive_connected: true,
      updated_at: new Date().toISOString(),
    }
    if (tokens.refresh_token) {
      updateData.google_refresh_token = tokens.refresh_token
    }

    const { error: updateError } = await (supabase
      .from('user_profiles') as any)
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Failed to save Google token: ${updateError.message}`)
    }

    // — Limpiar cookie de state —
    const response = NextResponse.redirect(`${APP_URL}/catalog?success=google_connected`)
    response.cookies.delete('google_oauth_state')
    return response

  } catch (err) {
    console.error('[Google Callback Error]:', err)
    const response = NextResponse.redirect(`${APP_URL}/catalog?error=google_token_exchange`)
    response.cookies.delete('google_oauth_state')
    return response
  }
}
