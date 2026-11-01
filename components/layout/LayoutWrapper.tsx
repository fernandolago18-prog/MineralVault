'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AppSidebar from './AppSidebar'
import { BookOpen, Gem, Settings, Menu } from 'lucide-react'

interface LayoutWrapperProps {
  children: React.ReactNode
  userId: string
  displayName: string
  driveConnected: boolean
}

export default function LayoutWrapper({ children, userId, displayName, driveConnected }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  // Detectar clics en enlaces internos para feedback instantáneo (0ms)
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        target.target !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        href !== pathname
      ) {
        setIsNavigating(true)
      }
    }

    document.addEventListener('click', handleLinkClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true })
    }
  }, [pathname])

  // Desactivar indicador al completarse el cambio de ruta
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

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

  // Temporizador para esconder la barra superior tras 2 segundos sin movimiento
  const resetHideTimer = useCallback(() => {
    setNavVisible(true)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = setTimeout(() => {
      setIsSidebarOpen(currentOpen => {
        // Solo esconder si el menú lateral no está abierto
        if (!currentOpen) {
          setNavVisible(false)
        }
        return currentOpen
      })
    }, 2000)
  }, [])

  // Detectar movimiento e interacción en la pantalla
  useEffect(() => {
    resetHideTimer()

    const events = ['scroll', 'touchstart', 'touchmove', 'touchend', 'mousemove', 'keydown']
    const handleActivity = () => {
      resetHideTimer()
    }

    events.forEach(evt => {
      window.addEventListener(evt, handleActivity, { passive: true })
    })

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      events.forEach(evt => {
        window.removeEventListener(evt, handleActivity)
      })
    }
  }, [resetHideTimer])

  // Reaparecer al cambiar de ruta
  useEffect(() => {
    resetHideTimer()
  }, [pathname, resetHideTimer])

  // Mantener visible si el sidebar está abierto
  useEffect(() => {
    if (isSidebarOpen) {
      setNavVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    } else {
      resetHideTimer()
    }
  }, [isSidebarOpen, resetHideTimer])

  return (
    <div className="app-layout">
      {/* Barra de progreso de veta de oro ultra-rápida al iniciar navegación */}
      {isNavigating && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            zIndex: 99999,
            background: 'rgba(8, 8, 10, 0.6)',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div className="mining-progress-shimmer" style={{ width: '80%', height: '100%' }} />
        </div>
      )}

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
        {/* Barra de menú superior en smartphone con auto-ocultación tras 2s sin movimiento */}
        <header
          className={`mobile-top-bar ${navVisible ? 'visible' : 'hidden'}`}
          onTouchStart={resetHideTimer}
          onMouseEnter={() => {
            setNavVisible(true)
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          }}
          onMouseLeave={resetHideTimer}
        >
          {/* Fila 1: Título y acceso al menú completo */}
          <div className="mobile-top-bar-header">
            <Link href="/catalog" onClick={() => { resetHideTimer(); setIsSidebarOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ color: 'var(--accent-gold)', fontSize: '13px', flexShrink: 0 }}>◆</span>
              <div style={{ 
                fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: '1.05rem',
                color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                Minerales de la Tierra
              </div>
            </Link>

            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="btn btn-ghost btn-icon"
              style={{ width: '36px', height: '36px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Fila 2: Pestañas de navegación rápida */}
          <nav className="mobile-top-nav" aria-label="Navegación móvil superior">
            <Link 
              href="/catalog" 
              onClick={() => { resetHideTimer(); setIsSidebarOpen(false) }}
              className={`mobile-top-nav-item ${pathname.startsWith('/catalog') || pathname.startsWith('/mineral') ? 'active' : ''}`}
            >
              <BookOpen size={14} />
              <span>Minerales</span>
            </Link>

            <Link 
              href="/collection" 
              onClick={() => { resetHideTimer(); setIsSidebarOpen(false) }}
              className={`mobile-top-nav-item ${pathname.startsWith('/collection') ? 'active' : ''}`}
            >
              <Gem size={14} />
              <span>Colección</span>
            </Link>

            <Link 
              href="/settings" 
              onClick={() => { resetHideTimer(); setIsSidebarOpen(false) }}
              className={`mobile-top-nav-item ${pathname.startsWith('/settings') ? 'active' : ''}`}
            >
              <Settings size={14} />
              <span>Ajustes</span>
            </Link>
          </nav>
        </header>

        <main className="main-content" style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
