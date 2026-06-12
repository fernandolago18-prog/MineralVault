'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/catalog'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado'
      setError(message)
      console.error('[Auth Error]:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          width: '56px', height: '56px', margin: '0 auto 1.5rem',
          background: 'var(--bg-void)',
          border: '2px solid var(--accent-gold)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px',
          color: 'var(--accent-gold)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          ◆
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 400 }}>
          Minerales de la Tierra
        </h1>
        <div style={{ 
          fontSize: '0.75rem', color: 'var(--accent-gold)', 
          textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem'
        }}>
          Arqueología Mineral
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
          Un compendio científico para el coleccionista moderno
        </p>
      </div>

      {/* Card */}
      <div className="glass-strong" style={{ borderRadius: 'var(--radius-sm)', padding: '2.5rem', border: '1px solid var(--border-strong)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Acceso al Archivo
          </h2>
          <div style={{ width: '40px', height: '1px', background: 'var(--accent-gold)', margin: '0 auto' }} />
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="email">Identificador (Email)</label>
            <input id="email" type="email" className="input"
              placeholder="curador@Minerales de la Tierra.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Clave de Acceso</label>
            <input id="password" type="password" className="input"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div className="toast toast-error" style={{ fontSize: '0.8rem', borderRadius: 'var(--radius-xs)', background: 'rgba(163,59,59,0.1)', color: '#fca5a5', border: '1px solid rgba(163,59,59,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg"
            style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.85rem' }}
            disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> Validando...</>
            ) : 'Ingresar al Catálogo'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.02em' }}>
        DATOS CIENTÍFICOS PROPORCIONADOS POR{' '}
        <a href="https://www.mindat.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>MINDAT.ORG</a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 50%, #16161c 0%, var(--bg-void) 100%)',
    }}>
      {/* Subtle architectural lines */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: 0.1,
      }}>
        <div style={{ position: 'absolute', top: '0', left: '25%', width: '1px', height: '100%', background: 'var(--accent-gold)' }} />
        <div style={{ position: 'absolute', top: '0', right: '25%', width: '1px', height: '100%', background: 'var(--accent-gold)' }} />
        <div style={{ position: 'absolute', top: '25%', left: '0', width: '100%', height: '1px', background: 'var(--accent-gold)' }} />
        <div style={{ position: 'absolute', bottom: '25%', left: '0', width: '100%', height: '1px', background: 'var(--accent-gold)' }} />
      </div>

      <Suspense fallback={<div className="spinner" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
