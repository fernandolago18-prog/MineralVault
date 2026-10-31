'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Gem, Settings, X, LogOut } from 'lucide-react'

interface AppSidebarProps {
  userId: string
  displayName: string
  driveConnected: boolean
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/catalog',    label: 'Minerales', description: 'Enciclopedia completa', icon: <BookOpen size={18} /> },
  { href: '/collection', label: 'Mi Colección', description: 'Mis ejemplares', icon: <Gem size={18} /> },
  { href: '/settings',   label: 'Ajustes', description: 'Perfil y conexión', icon: <Settings size={18} /> },
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
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        paddingTop: 'max(1.25rem, calc(0.75rem + var(--safe-area-top)))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0
      }}>
        <Link href="/catalog" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '36px', height: '36px', flexShrink: 0,
            background: 'var(--bg-void)',
            border: '1.5px solid var(--accent-gold)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            color: 'var(--accent-gold)',
          }}>
            ◆
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: 'Fraunces, serif', fontWeight: 500,
              fontSize: '1.15rem', letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
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
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-icon sidebar-close-btn" 
            style={{ width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <hr className="divider" style={{ margin: '0 1.25rem' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1.25rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.75rem 0.875rem',
                borderRadius: 'var(--radius-xs)',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)' }}>{item.icon}</span>
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
          padding: '0.75rem 0.875rem',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          marginTop: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '0.75rem', color: driveConnected ? 'var(--accent-emerald)' : 'var(--accent-gold)' }}>
              {driveConnected ? '●' : '○'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ 
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: driveConnected ? 'var(--accent-emerald)' : 'var(--accent-gold)' 
              }}>
                Respaldo en la Nube
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {driveConnected ? 'Google Drive Conectado' : 'Sincronización Inactiva'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* User section */}
      <div style={{
        padding: '1rem',
        paddingBottom: 'max(1rem, calc(0.75rem + var(--safe-area-bottom)))',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
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
            style={{ width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-rose)' }}>
            {signingOut ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <LogOut size={16} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
