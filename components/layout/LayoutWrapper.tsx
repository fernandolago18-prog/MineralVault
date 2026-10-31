'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AppSidebar from './AppSidebar'

interface LayoutWrapperProps {
  children: React.ReactNode
  userId: string
  displayName: string
  driveConnected: boolean
}

export default function LayoutWrapper({ children, userId, displayName, driveConnected }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Prevent background scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
        aria-hidden="true"
      />

      <AppSidebar
        userId={userId}
        displayName={displayName}
        driveConnected={driveConnected}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header */}
        <header className="mobile-header">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="btn btn-ghost btn-icon"
            style={{ width: '40px', height: '40px', color: 'var(--accent-gold)', fontSize: '1.25rem' }}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          
          <Link href="/catalog" style={{ textDecoration: 'none', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ 
              fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: '1.05rem',
              color: 'var(--text-primary)', textAlign: 'center',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              Minerales de la Tierra
            </div>
          </Link>

          <Link href="/settings" className="btn btn-ghost btn-icon" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} aria-label="Ajustes">
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>⚙</span>
          </Link>
        </header>

        <main className="main-content" style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
          <Link 
            href="/catalog" 
            className={`mobile-bottom-nav-item ${pathname.startsWith('/catalog') || pathname.startsWith('/mineral') ? 'active' : ''}`}
          >
            <span className="mobile-bottom-nav-icon">◆</span>
            <span>Minerales</span>
          </Link>

          <Link 
            href="/collection" 
            className={`mobile-bottom-nav-item ${pathname.startsWith('/collection') ? 'active' : ''}`}
          >
            <span className="mobile-bottom-nav-icon">🪨</span>
            <span>Colección</span>
          </Link>

          <Link 
            href="/settings" 
            className={`mobile-bottom-nav-item ${pathname.startsWith('/settings') ? 'active' : ''}`}
          >
            <span className="mobile-bottom-nav-icon">⚙</span>
            <span>Ajustes</span>
          </Link>

          <button 
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="mobile-bottom-nav-item"
            aria-label="Más opciones"
          >
            <span className="mobile-bottom-nav-icon">☰</span>
            <span>Menú</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
