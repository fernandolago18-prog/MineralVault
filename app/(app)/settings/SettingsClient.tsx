'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  profile: any
  userEmail: string
}

export default function SettingsClient({ profile, userEmail }: Props) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  
  const [resetSending, setResetSending] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSendPasswordReset = async () => {
    setResetSending(true)
    try {
      const redirectTo = `${window.location.origin}/auth/callback/recovery`
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo })
      if (error) throw error
      setResetSent(true)
      showToast('Correo de recuperación enviado ✓')
    } catch (err) {
      console.error('[Password Reset Error]:', err)
      showToast('Error al enviar el correo de recuperación', 'error')
    } finally {
      setResetSending(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await (supabase
        .from('user_profiles') as any)
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error
      showToast('Perfil actualizado ✓')
      router.refresh()
    } catch (err) {
      console.error('[Settings Save Error]:', err)
      showToast('Error al guardar los cambios', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectDrive = async () => {
    if (!confirm('¿Seguro que quieres desconectar Google Drive? No se borrarán tus fotos actuales, pero no podrás subir nuevas.')) return
    
    try {
      const res = await fetch('/api/auth/google/disconnect', {
        method: 'POST'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect')
      }

      showToast('Google Drive desconectado')
      router.refresh()
    } catch (err) {
      console.error('[Drive Disconnect Error]:', err)
      showToast('Error al desconectar', 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Profile Section */}
      <section className="card-elevated" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Perfil del Coleccionista</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input className="input" value={userEmail} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>El correo no se puede cambiar por ahora.</p>
          </div>

          <div className="form-group">
            <label>Nombre público</label>
            <input 
              className="input" 
              placeholder="Ej: Amante de los Cuarzos" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Biografía corta</label>
            <textarea 
              className="input" 
              rows={3} 
              placeholder="Cuéntanos un poco sobre tu colección..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: 'min(100%, 240px)', marginTop: '0.5rem' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </section>

      {/* Security Section */}
      <section className="card-elevated" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Seguridad y Contraseña</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Solicita un enlace seguro a tu correo electrónico para cambiar o restablecer la contraseña de tu cuenta.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'min(100%, 360px)', whiteSpace: 'normal', height: 'auto', padding: '0.65rem 1rem', lineHeight: 1.4 }}
              onClick={handleSendPasswordReset}
              disabled={resetSending}
            >
              {resetSending ? 'Enviando correo...' : 'Enviar correo para cambiar contraseña'}
            </button>
          </div>

          {resetSent && (
            <div style={{
              fontSize: '0.8rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)',
              lineHeight: 1.5, wordBreak: 'break-word'
            }}>
              ✓ Hemos enviado las instrucciones de restablecimiento a <strong>{userEmail}</strong>. Revisa tu bandeja de entrada o carpeta de spam.
            </div>
          )}
        </div>
      </section>

      {/* Cloud Section */}
      <section className="card-elevated" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Almacenamiento en la Nube</h3>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: '1 1 200px' }}>
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: profile?.google_drive_connected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
            }}>
              {profile?.google_drive_connected ? (
                <span style={{ color: 'var(--accent-emerald)', fontSize: '1.25rem', lineHeight: 1 }}>●</span>
              ) : (
                <span style={{ color: 'var(--accent-amber)', fontSize: '1.25rem', lineHeight: 1 }}>○</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem' }}>Google Drive</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {profile?.google_drive_connected 
                  ? 'Tus fotos se sincronizan automáticamente.' 
                  : 'Conecta tu cuenta para respaldar fotos.'}
              </p>
            </div>
          </div>

          {profile?.google_drive_connected ? (
            <button className="btn btn-danger btn-sm" style={{ width: 'min(100%, 160px)' }} onClick={handleDisconnectDrive}>Desconectar</button>
          ) : (
            <a href="/api/auth/google/connect" style={{ display: 'inline-block', width: 'min(100%, 160px)' }}>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Conectar Drive</button>
            </a>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section style={{ marginTop: '0.5rem', padding: '1rem', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-md)', background: 'rgba(244,63,94,0.02)' }}>
        <h4 style={{ color: 'var(--accent-rose)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Zona de Peligro</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Si deseas eliminar tu cuenta permanentemente, contacta con soporte. No hay vuelta atrás.
        </p>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} disabled>Eliminar Cuenta</button>
      </section>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}
