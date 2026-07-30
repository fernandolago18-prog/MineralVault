import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('[Recovery Callback Error]:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Code Exchange Error]:', exchangeError.message)
      return NextResponse.redirect(`${origin}/auth/login?error=Enlace+inválido+o+expirado`)
    }
  }

  // Redirigir siempre a la página de actualización de contraseña
  return NextResponse.redirect(`${origin}/auth/update-password`)
}
