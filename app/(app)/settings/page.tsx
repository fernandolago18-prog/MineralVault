/**
 * app/(app)/settings/page.tsx
 * Página de ajustes del usuario — Server Component.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import SettingsClient from './SettingsClient'

export const metadata: Metadata = {
  title: 'Ajustes de Cuenta',
  description: 'Gestiona tu perfil y las conexiones externas de Minerales de la Tierra.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await (supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single() as any)

  return (
    <div style={{ minHeight: '100dvh', padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.375rem' }}>Ajustes</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configura tu perfil y preferencias de almacenamiento.</p>
      </header>

      <SettingsClient 
        profile={profile} 
        userEmail={user.email ?? ''} 
      />
    </div>
  )
}
