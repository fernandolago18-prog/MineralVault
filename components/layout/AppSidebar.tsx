'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AppSidebarProps {
  userId: string
  displayName: string
  driveConnected: boolean
}

const navItems = [
  { href: '/catalog',    icon: '🔍', label: 'Catálogo', description: 'Todos los minerales' },
  { href: '/collection', icon: '💎', label: 'Mi Colección', description: 'Mis ejemplares' },
  { href: '/settings',   icon: '⚙️', label: 'Ajustes', description: 'Perfil y conexión' },
]

export default function AppSidebar({ userId, displayName, driveConnected }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      console.error('[SignOut Error]:', err)
      setSigningOut(false)
    }
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem 1rem' }}>
        <Link href="/catalog" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '40px', height: '40px', flexShrink: 0,
            background: 'var(--gradient-gem)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: 'var(--shadow-gem)',
          }}>
            💎
          </div>
          <div>
            <div style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.1rem', letterSpacing: '-0.02em',
              background: 'var(--gradient-gem)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              MineralVault
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Colección privada
            </div>
          </div>
        </Link>
      </div>

      <hr className="divider" style={{ margin: '0 1.25rem' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.9rem',
                    color: isActive ? 'var(--accent-purple)' : 'var(--text-primary)',
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.description}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Separator */}
        <div style={{ margin: '0.5rem 0' }}>
          <hr className="divider" />
        </div>

        {/* Google Drive status */}
        <div style={{
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius-md)',
          background: driveConnected ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${driveConnected ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem' }}>{driveConnected ? '🟢' : '🟡'}</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: driveConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                Google Drive
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {driveConnected ? 'Conectado' : 'Sin conectar'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* User section */}
      <div style={{ padding: '0.75rem' }}>
        <hr className="divider" style={{ marginBottom: '0.75rem' }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.625rem 0.5rem',
        }}>
          {/* Avatar */}
          <div style={{
            width: '36px', height: '36px', flexShrink: 0,
            background: 'var(--gradient-gem)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            fontSize: '1rem', color: 'white',
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.875rem',
              color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Coleccionista</div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Cerrar sesión"
            className="btn btn-ghost btn-icon"
            style={{ width: '32px', height: '32px', flexShrink: 0 }}>
            {signingOut ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↩'}
          </button>
        </div>
      </div>
    </aside>
  )
}
