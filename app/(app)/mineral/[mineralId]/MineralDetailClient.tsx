'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mineral, CollectionItem, SpecimenPhoto } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, MINERAL_CLASS_LABELS } from '@/types/database'

// El visor 3D solo se carga en cliente (WebGL)
const Crystal3DViewer = dynamic(() => import('@/components/Crystal3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="viewer-3d" style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 0.75rem' }} />
        <p style={{ fontSize: '0.8rem' }}>Cargando visor 3D...</p>
      </div>
    </div>
  ),
})

interface Props {
  mineral: Mineral
  collectionItem: (CollectionItem & { specimen_photos: SpecimenPhoto[] }) | null
  userId: string
}

export default function MineralDetailClient({ mineral, collectionItem: initialItem, userId }: Props) {
  const [collectionItem, setCollectionItem] = useState(initialItem)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()
  const isOwned = collectionItem?.status === 'owned'

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (isOwned && collectionItem) {
        await (supabase.from('user_collection') as any).delete().eq('id', collectionItem.id)
        setCollectionItem(null)
        showToast('Eliminado de tu colección')
      } else {
        // Payload tipado explícitamente para evitar inferencia errónea de never[]
        // cuando los tipos de Database son artesanales (sin supabase gen types).
        const payload: Pick<CollectionItem, 'user_id' | 'mineral_id' | 'status'> = {
          user_id: userId,
          mineral_id: mineral.id,
          status: 'owned',
        }
        const { data, error } = await (supabase
          .from('user_collection') as any)
          .upsert(payload, { onConflict: 'user_id,mineral_id' })
          .select('*, specimen_photos(*)')
          .single()
        if (error) throw error
        setCollectionItem(data as (CollectionItem & { specimen_photos: SpecimenPhoto[] }))
        showToast('¡Añadido a tu colección! 💎')
      }
    } catch (err) {
      console.error('[Toggle Error]:', err)
      showToast('Error al actualizar la colección')
    } finally {
      setLoading(false)
    }
  }

  const crystal3DOptions = {
    system: mineral.crystal_system ?? 'Amorphous',
    habit: mineral.crystal_habits?.[0] ?? '',
    axisRatio: (mineral.model_3d_config as { params?: { a?: number; b?: number; c?: number } })?.params,
  }

  return (
    <div style={{ minHeight: '100dvh', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/catalog" style={{ color: 'var(--text-muted)' }}>Catálogo</Link>
        {' '}/{' '}
        <span style={{ color: 'var(--text-primary)' }}>{mineral.name}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        {/* Left column — mineral info */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              {mineral.mineral_class && (
                <span className="badge badge-violet">
                  {MINERAL_CLASS_LABELS[mineral.mineral_class] ?? mineral.mineral_class}
                </span>
              )}
              {mineral.crystal_system && (
                <span className="badge badge-cyan">
                  ◆ {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system] ?? mineral.crystal_system}
                </span>
              )}
              {isOwned && <span className="badge badge-emerald">✓ En tu colección</span>}
            </div>

            <h1 style={{ marginBottom: '0.25rem' }}>{mineral.name}</h1>
            {mineral.name_es && (
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                {mineral.name_es}
              </p>
            )}
            {mineral.chemical_formula && (
              <code style={{
                display: 'inline-block',
                fontSize: '1rem', color: 'var(--accent-cyan)',
                background: 'rgba(6,182,212,0.08)',
                padding: '0.25rem 0.75rem', borderRadius: '6px',
                border: '1px solid rgba(6,182,212,0.2)',
              }}>
                {mineral.chemical_formula}
              </code>
            )}
          </div>

          {/* Description */}
          {mineral.description && (
            <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' }}>Descripción</h4>
              <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                {mineral.description}
              </p>
            </div>
          )}

          {/* Properties table */}
          <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' }}>Propiedades Físicas</h4>
            <table className="prop-table">
              <tbody>
                {mineral.hardness_min != null && (
                  <tr>
                    <td>Dureza (Mohs)</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 600 }}>
                          {mineral.hardness_min === mineral.hardness_max
                            ? mineral.hardness_min
                            : `${mineral.hardness_min}–${mineral.hardness_max}`}
                        </span>
                        <div className="hardness-bar">
                          {[...Array(10)].map((_, i) => {
                            const pip = i + 1
                            const filled = pip >= (mineral.hardness_min ?? 0) && pip <= (mineral.hardness_max ?? mineral.hardness_min ?? 0)
                            return <div key={i} className={`hardness-pip ${filled ? 'active' : ''}`} title={`Mohs ${pip}`} />
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {mineral.density_min != null && (
                  <tr>
                    <td>Densidad (g/cm³)</td>
                    <td>
                      {mineral.density_min === mineral.density_max
                        ? mineral.density_min
                        : `${mineral.density_min}–${mineral.density_max}`}
                    </td>
                  </tr>
                )}
                {mineral.streak && <tr><td>Raya</td><td>{mineral.streak}</td></tr>}
                {mineral.luster && mineral.luster.length > 0 && (
                  <tr><td>Brillo</td><td>{mineral.luster.join(', ')}</td></tr>
                )}
                {mineral.transparency && <tr><td>Transparencia</td><td>{mineral.transparency}</td></tr>}
                {mineral.color && mineral.color.length > 0 && (
                  <tr><td>Color</td><td>{mineral.color.join(', ')}</td></tr>
                )}
                {mineral.crystal_habits && mineral.crystal_habits.length > 0 && (
                  <tr><td>Hábito cristalino</td><td>{mineral.crystal_habits.join(', ')}</td></tr>
                )}
                {mineral.cleavage && <tr><td>Exfoliación</td><td>{mineral.cleavage}</td></tr>}
                {mineral.fracture && <tr><td>Fractura</td><td>{mineral.fracture}</td></tr>}
                {mineral.tenacity && <tr><td>Tenacidad</td><td>{mineral.tenacity}</td></tr>}
                {mineral.magnetism && <tr><td>Magnetismo</td><td>{mineral.magnetism}</td></tr>}
                {mineral.radioactivity && <tr><td>Radioactividad</td><td>{mineral.radioactivity}</td></tr>}
                {mineral.fluorescence && <tr><td>Fluorescencia</td><td>{mineral.fluorescence}</td></tr>}
                {mineral.strunz_number && <tr><td>Número Strunz</td><td><code style={{ fontSize: '0.85em', color: 'var(--accent-cyan)' }}>{mineral.strunz_number}</code></td></tr>}
                {mineral.dana_number && <tr><td>Número Dana</td><td><code style={{ fontSize: '0.85em', color: 'var(--accent-cyan)' }}>{mineral.dana_number}</code></td></tr>}
              </tbody>
            </table>
          </div>

          {/* Localities */}
          {mineral.localities && mineral.localities.length > 0 && (
            <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' }}>Localidades Principales</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {mineral.localities.map((loc, i) => (
                  <span key={i} className="badge badge-cyan">📍 {loc}</span>
                ))}
              </div>
            </div>
          )}

          {/* Mindat link */}
          {mineral.mindat_url && (
            <a href={mineral.mindat_url} target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
              🔗 Ver en Mindat.org
            </a>
          )}
        </div>

        {/* Right column — 3D + collection */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          {/* 3D Viewer */}
          <Crystal3DViewer
            crystalOptions={crystal3DOptions}
            transparency={0.88}
            height="340px"
          />

          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.5rem 0 1.25rem' }}>
            Sistema {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system ?? ''] ?? mineral.crystal_system ?? 'amorfo'}
            {mineral.crystal_habits?.[0] ? ` · ${mineral.crystal_habits[0]}` : ''}
          </p>

          {/* Collection button */}
          <button
            id={`collection-toggle-${mineral.id}`}
            className={`btn btn-lg ${isOwned ? 'btn-danger' : 'btn-primary'}`}
            style={{ width: '100%', marginBottom: '1rem' }}
            onClick={handleToggle}
            disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Actualizando...</>
              : isOwned ? '✕ Quitar de mi colección' : '+ Tengo este mineral'}
          </button>

          {/* Collection detail link */}
          {isOwned && collectionItem && (
            <Link href={`/collection/${collectionItem.id}`}>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                📸 Ver mi ejemplar y fotos
              </button>
            </Link>
          )}

          {/* Associated minerals */}
          {mineral.associated_minerals && mineral.associated_minerals.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit', fontWeight: 600 }}>
                Minerales asociados
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {mineral.associated_minerals.slice(0, 8).map((m, i) => (
                  <span key={i} className="badge badge-violet" style={{ fontSize: '0.68rem' }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
          <div className="toast toast-success">{toast}</div>
        </div>
      )}
    </div>
  )
}
