'use client'

import { useState } from 'react'
import type { CollectionItem } from '@/types/database'

interface AddSpecimenModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    specimen_label: string
    acquired_at: string | null
    origin: string
    notes: string
    quality: number
    dimensions: string
    weight_g: number | null
    price_eur: number | null
    files: File[]
  }) => Promise<void>
  mineralName: string
}

export default function AddSpecimenModal({ isOpen, onClose, onSave, mineralName }: AddSpecimenModalProps) {
  const [specimenLabel, setSpecimenLabel] = useState('')
  const [acquiredAt, setAcquiredAt] = useState('')
  const [origin, setOrigin] = useState('')
  const [notes, setNotes] = useState('')
  const [quality, setQuality] = useState(0)
  const [dimensions, setDimensions] = useState('')
  const [weightG, setWeightG] = useState('')
  const [priceEur, setPriceEur] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [compressingProgress, setCompressingProgress] = useState(false)

  // ── Image compression (client-side) ──
  const compressImage = async (file: File): Promise<File> => {
    const MAX_BYTES = 4 * 1024 * 1024   // 4 MB target
    const MAX_DIM   = 2000              // max width or height in px

    if (file.type === 'image/heic' || file.type === 'image/heif') return file
    if (file.size <= MAX_BYTES) return file

    return new Promise<File>((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        let { naturalWidth: w, naturalHeight: h } = img

        if (w > MAX_DIM || h > MAX_DIM) {
          if (w >= h) { h = Math.round((h / w) * MAX_DIM); w = MAX_DIM }
          else        { w = Math.round((w / h) * MAX_DIM); h = MAX_DIM }
        }

        canvas.width  = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)

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
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setCompressingProgress(true)
    try {
      const compressedFiles: File[] = []
      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = await compressImage(selectedFiles[i])
          compressedFiles.push(file)
        }
      }
      setCompressingProgress(false)

      await onSave({
        specimen_label: specimenLabel.trim(),
        acquired_at: acquiredAt || null,
        origin: origin.trim(),
        notes: notes.trim(),
        quality,
        dimensions: dimensions.trim(),
        weight_g: weightG ? parseFloat(weightG) : null,
        price_eur: priceEur ? parseFloat(priceEur) : null,
        files: compressedFiles,
      })
      onClose()
    } catch (err) {
      console.error(err)
      setCompressingProgress(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
    }}>
      <div className="card-elevated" style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 700 }}>
              Añadir Ejemplar
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Registrar espécimen de <strong>{mineralName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Label */}
          <div className="form-group">
            <label htmlFor="specimen_label">Etiqueta del Ejemplar</label>
            <input
              id="specimen_label"
              className="input"
              placeholder="Ej. Cuarzo drusa brillante, Ejemplar #1"
              value={specimenLabel}
              onChange={e => setSpecimenLabel(e.target.value)}
            />
          </div>

          {/* Quality */}
          <div className="form-group">
            <label>Calidad</label>
            <div className="star-rating" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <span
                  key={n}
                  className={`star ${n <= quality ? 'active' : ''}`}
                  onClick={() => setQuality(n === quality ? 0 : n)}
                  style={{ fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  {n <= quality ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>

          {/* Origin & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="origin">Procedencia</label>
              <input
                id="origin"
                className="input"
                placeholder="Yacimiento, Mina..."
                value={origin}
                onChange={e => setOrigin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="acquired_at">Fecha Adquisición</label>
              <input
                id="acquired_at"
                className="input"
                type="date"
                value={acquiredAt}
                onChange={e => setAcquiredAt(e.target.value)}
              />
            </div>
          </div>

          {/* Price & Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="price_eur">Precio (€)</label>
              <input
                id="price_eur"
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={priceEur}
                onChange={e => setPriceEur(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="weight_g">Peso (g)</label>
              <input
                id="weight_g"
                className="input"
                type="number"
                min="0"
                step="0.1"
                placeholder="0.0"
                value={weightG}
                onChange={e => setWeightG(e.target.value)}
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="form-group">
            <label htmlFor="dimensions">Dimensiones</label>
            <input
              id="dimensions"
              className="input"
              placeholder="Ej. 10x8x6 cm"
              value={dimensions}
              onChange={e => setDimensions(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notas y Observaciones</label>
            <textarea
              id="notes"
              className="input"
              rows={3}
              placeholder="Detalles sobre su brillo, asociación, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Photos */}
          <div className="form-group">
            <label htmlFor="photos">Fotos del Ejemplar (Opcional)</label>
            <input
              id="photos"
              className="input"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={e => setSelectedFiles(e.target.files)}
              style={{ padding: '0.375rem' }}
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', marginTop: '0.25rem', fontWeight: 600 }}>
                ✓ {selectedFiles.length} foto{selectedFiles.length > 1 ? 's' : ''} seleccionada{selectedFiles.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Ejemplar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
