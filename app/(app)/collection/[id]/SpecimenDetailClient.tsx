'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CollectionItem, Mineral, SpecimenPhoto } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, MINERAL_CLASS_LABELS } from '@/types/database'

interface Props {
  item: CollectionItem & { mineral: Mineral }
  initialPhotos: SpecimenPhoto[]
  driveConnected: boolean
  userId: string
}

type ToastType = 'success' | 'error' | 'info'

export default function SpecimenDetailClient({ item, initialPhotos, driveConnected, userId }: Props) {
  const mineral = item.mineral
  const supabase = createClient()

  // ── State ──────────────────────────────────────────────────────────────────
  const [photos, setPhotos]           = useState<SpecimenPhoto[]>(initialPhotos)
  const [uploading, setUploading]     = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState<string | null>(null)
  const [lightbox, setLightbox]       = useState<SpecimenPhoto | null>(null)
  const [toast, setToast]             = useState<{ msg: string; type: ToastType } | null>(null)
  const [dragOver, setDragOver]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state — editable fields
  const [specimenLabel, setSpecimenLabel] = useState(item.specimen_label ?? '')
  const [quality,     setQuality]     = useState<number>(item.quality ?? 0)
  const [origin,      setOrigin]      = useState(item.origin ?? '')
  const [acquiredAt,  setAcquiredAt]  = useState(item.acquired_at ?? '')
  const [priceEur,    setPriceEur]    = useState<string>(item.price_eur?.toString() ?? '')
  const [weightG,     setWeightG]     = useState<string>(item.weight_g?.toString() ?? '')
  const [dimensions,  setDimensions]  = useState(item.dimensions ?? '')
  const [notes,       setNotes]       = useState(item.notes ?? '')

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // ── Save specimen metadata (forced redeploy) ──────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await (supabase
        .from('user_collection') as any)
        .update({
          specimen_label: specimenLabel.trim() || null,
          quality:     quality || null,
          origin:      origin.trim() || null,
          acquired_at: acquiredAt || null,
          price_eur:   priceEur ? parseFloat(priceEur) : null,
          weight_g:    weightG  ? parseFloat(weightG)  : null,
          dimensions:  dimensions.trim() || null,
          notes:       notes.trim() || null,
          updated_at:  new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('user_id', userId)

      if (error) throw error
      showToast('Datos guardados ✓', 'success')
    } catch (err) {
      console.error('[Save Error]:', err)
      showToast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Image compression (client-side, keeps size under Vercel 4.5 MB limit) ──
  const compressImage = useCallback(async (file: File): Promise<File> => {
    const MAX_BYTES = 4 * 1024 * 1024   // 4 MB target
    const MAX_DIM   = 2000              // max width or height in px

    // HEIC/HEIF cannot be drawn on canvas in most browsers — skip compression
    if (file.type === 'image/heic' || file.type === 'image/heif') return file
    // Already small enough
    if (file.size <= MAX_BYTES) return file

    return new Promise<File>((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        let { naturalWidth: w, naturalHeight: h } = img

        // Downscale if needed
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w >= h) { h = Math.round((h / w) * MAX_DIM); w = MAX_DIM }
          else        { w = Math.round((w / h) * MAX_DIM); h = MAX_DIM }
        }

        canvas.width  = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)

        // Try quality 0.82 first; if still too large drop to 0.65
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return }
          if (blob.size <= MAX_BYTES) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          } else {
            canvas.toBlob((blob2) => {
              resolve(blob2
                ? new File([blob2], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
                : file)
            }, 'image/jpeg', 0.65)
          }
        }, 'image/jpeg', 0.82)
      }

      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }, [])

  // ── Upload photos ──────────────────────────────────────────────────────────
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!driveConnected) {
      showToast('Conecta tu Google Drive primero', 'error'); return
    }

    const fileArray = Array.from(files)
    setUploading(true)
    
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < fileArray.length; i++) {
      const raw  = fileArray[i]
      // Progreso aproximado basado en el archivo actual
      setUploadProgress(Math.round(((i) / fileArray.length) * 100) + 10)

      try {
        // Compress before sending to stay under Vercel's 4.5 MB body limit
        const file = await compressImage(raw)

        const fd = new FormData()
        fd.append('file',         file)
        fd.append('collectionId', item.id)
        fd.append('mineralName',  mineral.name)

        const res  = await fetch('/api/drive/upload', { method: 'POST', body: fd })
        const data = await res.json() as { photo?: SpecimenPhoto; error?: string }

        if (!res.ok || data.error) throw new Error(data.error ?? 'Error al subir')

        setPhotos(prev => {
          if (data.photo!.is_primary) {
            return [data.photo!, ...prev.map(p => ({ ...p, is_primary: false }))]
          }
          return [...prev, data.photo!]
        })
        successCount++
      } catch (err) {
        console.error(`[Upload Error] ${raw.name}:`, err)
        failCount++
      }
    }

    setUploadProgress(100)
    setTimeout(() => {
      setUploading(false)
      setUploadProgress(0)
    }, 500)

    if (successCount > 0) {
      showToast(`¡${successCount} foto${successCount > 1 ? 's' : ''} subida${successCount > 1 ? 's' : ''} a Google Drive!`, 'success')
    }
    if (failCount > 0) {
      showToast(`${failCount} foto${failCount > 1 ? 's' : ''} fallaron al subir`, 'error')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Delete photo ───────────────────────────────────────────────────────────
  const handleDeletePhoto = async (photo: SpecimenPhoto) => {
    if (!confirm(`¿Eliminar esta foto? Se borrará también de Google Drive.`)) return
    setDeleting(photo.id)
    try {
      const res  = await fetch('/api/drive/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error)

      setPhotos(prev => {
        const remaining = prev.filter(p => p.id !== photo.id)
        if (photo.is_primary && remaining.length > 0) {
          return [{ ...remaining[0], is_primary: true }, ...remaining.slice(1)]
        }
        return remaining
      })
      if (lightbox?.id === photo.id) setLightbox(null)
      showToast('Foto eliminada', 'info')
    } catch (err) {
      console.error('[Delete Error]:', err)
      showToast('Error al eliminar la foto', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // ── Set primary photo ──────────────────────────────────────────────────────
  const handleSetPrimary = async (photo: SpecimenPhoto) => {
    if (photo.is_primary) return
    try {
      const res = await fetch('/api/drive/delete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, collectionId: item.id }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setPhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === photo.id })))
      showToast('Foto principal actualizada', 'success')
    } catch (err) {
      console.error('[SetPrimary Error]:', err)
      showToast('Error al actualizar foto principal', 'error')
    }
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  const primaryPhoto = photos.find(p => p.is_primary)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Breadcrumb */}
      <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link href="/collection" style={{ color: 'var(--text-muted)' }}>Mi Colección</Link>
        <span>/</span>
        <Link href={`/mineral/${mineral.id}`} style={{ color: 'var(--text-muted)' }}>{mineral.name_es || mineral.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{specimenLabel || 'Mi ejemplar'}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {mineral.is_rock ? (
              <span className="badge badge-rock">ROCA</span>
            ) : (
              <>
                {mineral.mineral_class && (
                  <span className="badge badge-violet">{MINERAL_CLASS_LABELS[mineral.mineral_class] ?? mineral.mineral_class}</span>
                )}
                {mineral.crystal_system && (
                  <span className="badge badge-cyan">◆ {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system] ?? mineral.crystal_system}</span>
                )}
              </>
            )}
            <span className="badge badge-emerald">✓ En colección</span>
          </div>
          <h1 style={{ marginBottom: '0.25rem' }}>{specimenLabel || mineral.name_es || mineral.name}</h1>
          {specimenLabel && (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              {mineral.name_es || mineral.name}
            </p>
          )}
          {(!specimenLabel && mineral.name_es && mineral.name_es !== mineral.name) && (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{mineral.name}</p>
          )}
          {mineral.chemical_formula && (
            <code 
              style={{ color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.08)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.2)', fontSize: '0.9rem' }}
              dangerouslySetInnerHTML={{ __html: mineral.chemical_formula }}
            />
          )}
        </div>
        <Link href={`/mineral/${mineral.id}`}>
          <button className="btn btn-secondary btn-sm">Ver ficha del mineral</button>
        </Link>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

        {/* ── Left: Photos ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Fotos del ejemplar</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{photos.length} foto{photos.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Upload zone */}
          {driveConnected ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent-violet)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: dragOver ? 'rgba(124,58,237,0.06)' : 'var(--bg-surface)',
                transition: 'all var(--transition-base)',
                marginBottom: '1rem',
              }}
            >
              {uploading ? (
                <div>
                  <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Subiendo a Google Drive...</p>
                  <div style={{ height: '4px', background: 'var(--bg-overlay)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--gradient-gem-h)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    Arrastra una foto o <span style={{ color: 'var(--accent-purple)' }}>haz clic para seleccionar</span>
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>JPEG, PNG, WebP, HEIC — máx. 10 MB</p>
                </>
              )}
            </div>
          ) : (
            <div style={{
              border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-lg)',
              padding: '1.5rem', textAlign: 'center', marginBottom: '1rem',
              background: 'rgba(245,158,11,0.04)',
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                Conecta Google Drive para subir fotos de tus especímenes
              </p>
              <a href="/api/auth/google/connect">
                <button className="btn btn-secondary btn-sm">Conectar Google Drive</button>
              </a>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files)}
          />

          {/* Photo gallery */}
          {photos.length > 0 ? (
            <div className="photo-grid">
              {photos.map(photo => (
                <div key={photo.id} style={{ position: 'relative' }} className="photo-thumb">
                  {/* Primary badge */}
                  {photo.is_primary && (
                    <div style={{
                      position: 'absolute', top: '6px', left: '6px', zIndex: 2,
                      background: 'var(--accent-amber)', color: 'white',
                      borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700,
                      padding: '2px 5px', fontFamily: 'Outfit',
                    }}>
                      ★ PRINCIPAL
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.drive_thumb_url ?? photo.drive_view_url}
                    alt={photo.caption ?? photo.filename ?? 'Foto del mineral'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setLightbox(photo)}
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-mineral.svg' }}
                  />
                  {/* Overlay actions */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', gap: '4px',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
                  >
                    {!photo.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(photo)}
                        title="Establecer como principal"
                        style={{ background: 'rgba(245,158,11,0.9)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}
                      >
                        ★
                      </button>
                    )}
                    <button
                      onClick={() => window.open(photo.drive_view_url, '_blank')}
                      title="Ver en Drive"
                      style={{ background: 'rgba(6,182,212,0.9)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'white', fontSize: '0.7rem', fontWeight: 600 }}
                    >
                      Drive
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      disabled={deleting === photo.id}
                      title="Eliminar foto"
                      style={{ background: 'rgba(244,63,94,0.9)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'white', fontSize: '0.7rem' }}
                    >
                      {deleting === photo.id ? '…' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🪨</div>
              <p style={{ fontSize: '0.875rem' }}>Aún no has subido fotos de este ejemplar</p>
            </div>
          )}
        </div>

        {/* ── Right: Edit form ── */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          {/* Preview */}
          <div style={{
            height: '200px', borderRadius: 'var(--radius-lg)',
            overflow: 'hidden', marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {primaryPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryPhoto.drive_thumb_url ?? primaryPhoto.drive_view_url}
                alt={mineral.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>◆</div>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Sin foto principal</p>
              </div>
            )}
          </div>

          {/* Stars */}
          <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.75rem' }}>Calidad del ejemplar</label>
            <div className="star-rating" style={{ justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <span key={n}
                  className={`star ${n <= quality ? 'active' : ''}`}
                  onClick={() => setQuality(n === quality ? 0 : n)}
                  style={{ fontSize: '1.75rem', cursor: 'pointer' }}
                >
                  {n <= quality ? '★' : '☆'}
                </span>
              ))}
            </div>
            {quality > 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {['', 'Deficiente', 'Regular', 'Bueno', 'Muy bueno', 'Excepcional'][quality]}
              </p>
            )}
          </div>

          {/* Form fields */}
          <div className="card-elevated" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label>Etiqueta / Nombre del ejemplar</label>
              <input className="input" placeholder="Ej: Drusa de Cuarzo rosa, Ejemplar #2" value={specimenLabel}
                onChange={e => setSpecimenLabel(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Procedencia / Yacimiento</label>
              <input className="input" placeholder="Ej: Almería, España" value={origin}
                onChange={e => setOrigin(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fecha de adquisición</label>
              <input className="input" type="date" value={acquiredAt}
                onChange={e => setAcquiredAt(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div className="form-group">
                <label>Precio (€)</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                  value={priceEur} onChange={e => setPriceEur(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Peso (g)</label>
                <input className="input" type="number" min="0" step="0.1" placeholder="0.0"
                  value={weightG} onChange={e => setWeightG(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Dimensiones</label>
              <input className="input" placeholder="Ej: 8×5×4 cm" value={dimensions}
                onChange={e => setDimensions(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Notas personales</label>
              <textarea className="input" rows={3}
                placeholder="Observaciones, historia del especimen..."
                value={notes} onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}
              />
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving}
              style={{ marginTop: '0.25rem' }}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Guardando...</> : 'Guardar cambios'}
            </button>
          </div>

          {/* Drive status pill */}
          <div style={{
            marginTop: '1rem', padding: '0.625rem 1rem',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: driveConnected ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${driveConnected ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
            <span style={{ color: driveConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontSize: '0.9rem', lineHeight: 1 }}>●</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: driveConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                Google Drive {driveConnected ? 'conectado' : 'no conectado'}
              </div>
              {!driveConnected && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Las fotos se guardan en tu Drive personal
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.25rem' }}>
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.drive_thumb_url ?? lightbox.drive_view_url}
            alt={lightbox.caption ?? 'Foto del mineral'}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p style={{ position: 'absolute', bottom: '2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textAlign: 'center' }}>
              {lightbox.caption}
            </p>
          )}
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 300 }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}
