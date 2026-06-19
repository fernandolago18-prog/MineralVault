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
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        specimen_label: specimenLabel.trim(),
        acquired_at: acquiredAt || null,
        origin: origin.trim(),
        notes: notes.trim(),
        quality,
        dimensions: dimensions.trim(),
        weight_g: weightG ? parseFloat(weightG) : null,
        price_eur: priceEur ? parseFloat(priceEur) : null,
      })
      onClose()
    } catch (err) {
      console.error(err)
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
