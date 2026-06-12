'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AppSidebarProps {
  userId: string
  displayName: string
  driveConnected: boolean
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/catalog',    label: 'Minerales', description: 'Enciclopedia completa' },
  { href: '/collection', label: 'Mi Colección', description: 'Mis ejemplares' },
  { href: '/settings',   label: 'Ajustes', description: 'Perfil y conexión' },
]

export default function AppSidebar({ userId, displayName, driveConnected, isOpen, onClose }: AppSidebarProps) {
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
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo & Close (Mobile) */}
      <div style={{ padding: '2rem 1.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/catalog" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', textDecoration: 'none' }}>
          <div style={{
            width: '38px', height: '38px', flexShrink: 0,
            background: 'var(--bg-void)',
            border: '1.5px solid var(--accent-gold)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            color: 'var(--accent-gold)',
          }}>
            ◆
          </div>
          <div>
            <div style={{
              fontFamily: 'Fraunces, serif', fontWeight: 500,
              fontSize: '1.3rem', letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}>
              Minerales de la Tierra
            </div>
            <div style={{ 
              fontSize: '0.6rem', color: 'var(--text-muted)', 
              textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '-2px' 
            }}>
              Arqueología Mineral
            </div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ width: '32px', height: '32px' }}>
            ✕
          </button>
        )}
      </div>

      <hr className="divider" style={{ margin: '0 1.5rem' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-xs)',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <div style={{ minWidth: 0, paddingLeft: '0.25rem' }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.description}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Google Drive status */}
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '0.75rem' }}>{driveConnected ? '●' : '○'}</span>
            <div>
              <div style={{ 
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: driveConnected ? 'var(--accent-emerald)' : 'var(--accent-gold)' 
              }}>
                Respaldo en la Nube
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                {driveConnected ? 'Google Drive Conectado' : 'Sincronización Inactiva'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* User section */}
      <div style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          padding: '0.75rem',
          background: 'var(--bg-void)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
        }}>
          {/* Avatar */}
          <div style={{
            width: '34px', height: '34px', flexShrink: 0,
            background: 'var(--accent-gold)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontWeight: 600,
            fontSize: '0.9rem', color: 'var(--bg-void)',
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8rem',
              color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '0.02em'
            }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coleccionista</div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Cerrar sesión"
            className="btn btn-ghost btn-icon"
            style={{ width: '48px', height: '28px', flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-rose)' }}>
            {signingOut ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Salir'}
          </button>
        </div>
      </div>
    </aside>
  )
}
