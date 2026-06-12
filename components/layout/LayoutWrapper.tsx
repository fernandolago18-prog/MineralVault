'use client'

import { useState } from 'react'
import AppSidebar from './AppSidebar'

interface LayoutWrapperProps {
  children: React.ReactNode
  userId: string
  displayName: string
  driveConnected: boolean
}

export default function LayoutWrapper({ children, userId, displayName, driveConnected }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
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
            style={{ width: '40px', height: '40px', color: 'var(--accent-gold)' }}
          >
            ☰
          </button>
          
          <div style={{ 
            fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: '1.2rem',
            color: 'var(--text-primary)',
          }}>
            Minerales de la Tierra
          </div>

          <div style={{ width: '40px' }} /> {/* Spacer to center title */}
        </header>

        <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
