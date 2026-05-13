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
  
  const supabase = createClient()
  const router = useRouter()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // @ts-ignore
      const { error } = await supabase
        .from('user_profiles')
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
      // @ts-ignore
      const { error } = await supabase
        .from('user_profiles')
        .update({
          google_drive_connected: false,
          google_refresh_token: null, // Limpiamos el token
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error
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
      <section className="card-elevated" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>👤 Perfil del Coleccionista</h3>
        
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
            style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>
      </section>

      {/* Cloud Section */}
      <section className="card-elevated" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>☁️ Almacenamiento en la Nube</h3>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '1rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              background: profile?.google_drive_connected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
            }}>
              {profile?.google_drive_connected ? '✅' : '🔗'}
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem' }}>Google Drive</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {profile?.google_drive_connected 
                  ? 'Tus fotos se sincronizan automáticamente.' 
                  : 'Conecta tu cuenta para respaldar fotos.'}
              </p>
            </div>
          </div>

          {profile?.google_drive_connected ? (
            <button className="btn btn-danger btn-sm" onClick={handleDisconnectDrive}>Desconectar</button>
          ) : (
            <a href="/api/auth/google/connect">
              <button className="btn btn-secondary btn-sm">Conectar Drive</button>
            </a>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section style={{ marginTop: '1rem', padding: '1rem', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-md)', background: 'rgba(244,63,94,0.02)' }}>
        <h4 style={{ color: 'var(--accent-rose)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Zona de Peligro</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Si deseas eliminar tu cuenta permanentemente, contacta con soporte. No hay vuelta atrás.
        </p>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} disabled>Eliminar Cuenta</button>
      </section>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}
