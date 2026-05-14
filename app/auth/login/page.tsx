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
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: '64px', height: '64px', margin: '0 auto 1rem',
          background: 'var(--gradient-gem)',
          borderRadius: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
          boxShadow: 'var(--shadow-gem)',
          animation: 'glow-pulse 3s ease-in-out infinite',
        }}>
          💎
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <span className="gradient-text">MineralVault</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Tu colección de minerales, catalogada y en 3D
        </p>
      </div>

      {/* Card */}
      <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Bienvenido de nuevo</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Identifícate para acceder a tu colección</p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" className="input"
              placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="input"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div className="toast toast-error" style={{ fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg"
            style={{ marginTop: '0.5rem', width: '100%' }}
            disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16 }} /> Entrando...</>
            ) : 'Entrar a mi colección'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Datos de minerales proporcionados por{' '}
        <a href="https://www.mindat.org" target="_blank" rel="noopener noreferrer">Mindat.org</a>
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
      background: 'radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.08) 0%, transparent 50%), var(--bg-void)',
    }}>
      {/* Background crystal decoration */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${80 + i * 40}px`,
            height: `${80 + i * 40}px`,
            border: '1px solid rgba(124,58,237,0.08)',
            borderRadius: '8px',
            transform: `rotate(${15 + i * 25}deg)`,
            top: `${10 + i * 15}%`,
            left: `${5 + i * 18}%`,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}
      </div>

      <Suspense fallback={<div className="spinner" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
