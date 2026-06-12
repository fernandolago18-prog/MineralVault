import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'var(--bg-void)',
            border: '1.5px solid var(--accent-gold)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--accent-gold)',
            boxShadow: 'var(--shadow-gem)',
          }}>
            ◆
          </div>
          <span style={{ 
            fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', 
            background: 'var(--gradient-gem)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Minerales de la Tierra
          </span>
        </div>
        <div>
          {user ? (
            <Link href="/catalog">
              <button className="btn btn-secondary">Ir al Catálogo</button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <button className="btn btn-ghost">Iniciar Sesión</button>
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
        padding: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
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
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          lineHeight: 1.05,
          marginBottom: '1.5rem'
        }}>
          Documenta tu pasión <br/>
          <span className="gradient-text">cristal por cristal.</span>
        </h1>

        <p style={{ 
          maxWidth: '600px', 
          fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
          color: 'var(--text-secondary)',
          marginBottom: '2.5rem',
          lineHeight: 1.6
        }}>
          Gestiona tu colección privada con datos científicos, modelos 3D y 
          respaldo automático de tus fotografías en Google Drive.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href={user ? "/catalog" : "/auth/login"}>
            <button className="btn btn-primary btn-lg" style={{ minWidth: '200px' }}>
              {user ? 'Explorar mi colección' : 'Empezar ahora gratis'}
            </button>
          </Link>
          {!user && (
             <Link href="/catalog">
              <button className="btn btn-secondary btn-lg" style={{ minWidth: '200px' }}>
                Ver el Catálogo
              </button>
            </Link>
          )}
        </div>

        {/* Feature cards */}
        <div style={{ 
          marginTop: '5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          maxWidth: '900px',
          width: '100%',
          opacity: 0.8
        }}>
          {[
            { title: 'Base de Datos', desc: '+10k especies de Mindat.org' },
            { title: 'Visor 3D', desc: 'Hábitos y sistemas cristalinos' },
            { title: 'Google Drive', desc: 'Tus fotos siempre seguras' },
          ].map((feat, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem', textAlign: 'left' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{feat.title}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: 'var(--text-muted)', 
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto'
      }}>
        &copy; 2026 Minerales de la Tierra — Desarrollado para geólogos y entusiastas.
      </footer>
    </div>
  )
}
