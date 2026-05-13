import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback handler — Supabase redirige aquí tras confirmar el email.
 * Intercambia el code por una sesión activa y redirige al catálogo.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/catalog'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('[Auth Callback Error]:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Code Exchange Error]:', exchangeError.message)
      return NextResponse.redirect(`${origin}/auth/login?error=Enlace+inválido`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
