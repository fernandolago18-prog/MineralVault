/**
 * app/api/auth/google/connect/route.ts
 * Inicia el flujo OAuth 2.0 con Google.
 * 1. Genera un token CSRF (state) y lo guarda en una cookie firmada.
 * 2. Redirige al usuario a la pantalla de consentimiento de Google.
 *
 * SEGURIDAD:
 * - Se verifica que el usuario tiene sesión Supabase activa.
 * - El state previene ataques CSRF en el callback.
 */

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { buildGoogleAuthUrl } from '@/lib/google/auth'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  try {
    // 1. Verificar sesión activa
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.redirect(
        new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL!),
      )
    }

    // 2. Generar token CSRF aleatorio (state)
    const state = crypto.randomUUID()

    // 3. Construir URL de autorización
    const authUrl = buildGoogleAuthUrl(state)

    // 4. Guardar state en cookie HttpOnly para verificarlo en el callback
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('google_oauth_state', state, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   600, // 10 minutos
      path:     '/',
    })

    return response
  } catch (err) {
    console.error('[Google Connect Error]:', err)
    return NextResponse.redirect(
      new URL('/catalog?error=google_connect_failed', process.env.NEXT_PUBLIC_APP_URL!),
    )
  }
}
