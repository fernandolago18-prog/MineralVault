'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/catalog'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
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
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirectTo)
        router.refresh()
      } else {
        // Validación básica client-side
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
        if (!displayName.trim()) throw new Error('El nombre es obligatorio.')

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setSuccessMsg('¡Cuenta creada! Revisa tu email para confirmar el registro.')
      }
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
        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg-void)',
          borderRadius: 'var(--radius-md)', padding: '4px',
          marginBottom: '1.75rem',
        }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccessMsg(null); }}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                fontWeight: 600, fontSize: '0.875rem', transition: 'all var(--transition-fast)',
                background: mode === m ? 'var(--bg-elevated)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}>
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="displayName">Nombre del coleccionista</label>
              <input id="displayName" type="text" className="input"
                placeholder="Tu nombre" value={displayName}
                onChange={e => setDisplayName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" className="input"
              placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="input"
              placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div className="toast toast-error" style={{ fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="toast toast-success" style={{ fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg"
            style={{ marginTop: '0.5rem', width: '100%' }}
            disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16 }} /> Cargando...</>
            ) : mode === 'login' ? 'Entrar a mi colección' : 'Crear cuenta'}
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
