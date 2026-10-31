import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Database, Box, Cloud } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ 
      minHeight: '100dvh', 
      background: 'var(--bg-void)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{ 
        position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%',
        background: 'var(--gradient-glow)', zIndex: 0, opacity: 0.5
      }} />
      <div style={{ 
        position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.1) 0%, transparent 70%)', zIndex: 0, opacity: 0.4
      }} />

      {/* Header / Nav */}
      <header style={{ 
        padding: '1.25rem max(1rem, env(safe-area-inset-right, 0px)) 1.25rem max(1rem, env(safe-area-inset-left, 0px))', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          <div style={{
            width: '38px', height: '38px', flexShrink: 0,
            background: 'var(--bg-void)',
            border: '1.5px solid var(--accent-gold)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            color: 'var(--accent-gold)',
            boxShadow: 'var(--shadow-gem)',
          }}>
            ◆
          </div>
          <span style={{ 
            fontFamily: 'Outfit', fontWeight: 800, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', 
            background: 'var(--gradient-gem)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            Minerales de la Tierra
          </span>
        </div>
        <div>
          {user ? (
            <Link href="/catalog">
              <button className="btn btn-secondary btn-sm">Ir al Catálogo</button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <button className="btn btn-ghost btn-sm">Iniciar Sesión</button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.25rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          marginBottom: '1rem',
          padding: '0.4rem 0.875rem',
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          color: 'var(--accent-purple)',
          fontWeight: 600,
          fontFamily: 'Outfit',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          La app definitiva para coleccionistas
        </div>
        
        <h1 style={{ 
          maxWidth: '800px', 
          fontSize: 'clamp(2.2rem, 7vw, 4.5rem)',
          lineHeight: 1.1,
          marginBottom: '1.25rem'
        }}>
          Documenta tu pasión <br/>
          <span className="gradient-text">cristal por cristal.</span>
        </h1>

        <p style={{ 
          maxWidth: '600px', 
          fontSize: 'clamp(0.95rem, 2vw, 1.2rem)', 
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
          lineHeight: 1.6
        }}>
          Gestiona tu colección privada con datos científicos, modelos 3D y 
          respaldo automático de tus fotografías en Google Drive.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '440px' }}>
          <Link href={user ? "/catalog" : "/auth/login"} style={{ flex: '1 1 200px' }}>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {user ? 'Explorar mi colección' : 'Empezar ahora gratis'}
            </button>
          </Link>
          {!user && (
            <Link href="/catalog" style={{ flex: '1 1 200px' }}>
              <button className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                Ver el Catálogo
              </button>
            </Link>
          )}
        </div>

        {/* Feature cards */}
        <div style={{ 
          marginTop: '3.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '1rem',
          maxWidth: '900px',
          width: '100%',
          opacity: 0.9
        }}>
          {[
            { title: 'Base de Datos', desc: '+10k especies de Mindat.org', icon: <Database size={22} /> },
            { title: 'Visor 3D', desc: 'Hábitos y sistemas cristalinos', icon: <Box size={22} /> },
            { title: 'Google Drive', desc: 'Tus fotos siempre seguras', icon: <Cloud size={22} /> },
          ].map((feat, i) => (
            <div key={i} className="card" style={{ padding: '1.25rem', textAlign: 'left' }}>
              <div style={{ marginBottom: '0.5rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center' }}>{feat.icon}</div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{feat.title}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '1.5rem 1rem', 
        textAlign: 'center', 
        color: 'var(--text-muted)', 
        fontSize: '0.75rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto'
      }}>
        &copy; 2026 Minerales de la Tierra — Desarrollado para geólogos y entusiastas.
      </footer>
    </div>
  )
}
