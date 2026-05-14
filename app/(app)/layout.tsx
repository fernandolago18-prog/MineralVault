import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutWrapper from '@/components/layout/LayoutWrapper'

/**
 * Layout raíz para todas las rutas protegidas de la app.
 * Verifica la sesión server-side — si no existe, redirige al login.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Obtener perfil del usuario
  const { data: profile } = await (supabase
    .from('user_profiles')
    .select('display_name, google_drive_connected')
    .eq('id', user.id)
    .single() as any)

  return (
    <LayoutWrapper
      userId={user.id}
      displayName={profile?.display_name ?? user.email?.split('@')[0] ?? 'Coleccionista'}
      driveConnected={profile?.google_drive_connected ?? false}
    >
      {children}
    </LayoutWrapper>
  )
}
