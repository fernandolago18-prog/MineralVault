'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    // Verificar si el usuario tiene una sesión activa o de recuperación
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setHasSession(true)
      } else {
        // Escuchar el evento de autenticación por si el token viene en el hash de la URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
            setHasSession(true)
          }
        })
        return () => subscription.unsubscribe()
      }
      setCheckingSession(false)
    }

    checkUserSession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setSuccess(true)
    } catch (err: unknown) {
      console.error('[Update Password Error]:', err)
      const msg = err instanceof Error ? err.message : 'Error al actualizar la contraseña.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 50%, #16161c 0%, var(--bg-void) 100%)',
    }}>
      {/* Fondo con líneas estilizadas */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: 0.1,
      }}>
        <div style={{ position: 'absolute', top: '0', left: '25%', width: '1px', height: '100%', background: 'var(--accent-gold)' }} />
        <div style={{ position: 'absolute', top: '0', right: '25%', width: '1px', height: '100%', background: 'var(--accent-gold)' }} />
        <div style={{ position: 'absolute', top: '25%', left: '0', width: '100%', height: '1px', background: 'var(--accent-gold)' }} />
        <div style={{ position: 'absolute', bottom: '25%', left: '0', width: '100%', height: '1px', background: 'var(--accent-gold)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 1.25rem',
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
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.35rem', fontWeight: 400 }}>
            Minerales de la Tierra
          </h1>
          <div style={{ 
            fontSize: '0.75rem', color: 'var(--accent-gold)', 
            textTransform: 'uppercase', letterSpacing: '0.2em'
          }}>
            Restablecimiento de Clave
          </div>
        </div>

        {/* Card */}
        <div className="glass-strong" style={{ borderRadius: 'var(--radius-sm)', padding: '2.25rem', border: '1px solid var(--border-strong)' }}>
          {checkingSession ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem', width: 24, height: 24 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Verificando enlace de recuperación...</p>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', fontSize: '1.5rem', color: 'var(--accent-emerald)'
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>¡Contraseña actualizada!</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Tu clave de acceso ha sido modificada correctamente. Ya puedes acceder a la plataforma con tu nueva contraseña.
              </p>
              <Link href="/catalog" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.85rem' }}>
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nueva Contraseña
                </h2>
                <div style={{ width: '40px', height: '1px', background: 'var(--accent-gold)', margin: '0 auto' }} />
              </div>

              {!hasSession && (
                <div style={{ fontSize: '0.8rem', padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  Aviso: Si no ingresaste mediante el enlace enviado a tu correo, es posible que debas solicitar un nuevo enlace desde tu perfil.
                </div>
              )}

              <div className="form-group">
                <label htmlFor="new-password">Nueva Contraseña</label>
                <input
                  id="new-password"
                  type="password"
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirmar Contraseña</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="input"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="toast toast-error" style={{ fontSize: '0.8rem', borderRadius: 'var(--radius-xs)', background: 'rgba(163,59,59,0.1)', color: '#fca5a5', border: '1px solid rgba(163,59,59,0.2)' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.85rem' }}
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 14, height: 14 }} /> Guardando...</>
                ) : 'Actualizar Contraseña'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/settings" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'underline' }}>
            Volver a Ajustes
          </Link>
        </div>
      </div>
    </div>
  )
}
