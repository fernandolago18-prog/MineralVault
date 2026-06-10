'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mineral, CollectionItem, SpecimenPhoto } from '@/types/database'
import {
  CRYSTAL_SYSTEM_LABELS,
  MINERAL_CLASS_LABELS,
  LUSTER_LABELS,
  TRANSPARENCY_LABELS,
  CLEAVAGE_LABELS,
  FRACTURE_LABELS,
  TENACITY_LABELS,
  COLOR_LABELS
} from '@/types/database'

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
  varieties?: any[]
  parentMineral?: any
}

export default function MineralDetailClient({ mineral, collectionItem: initialItem, userId, varieties = [], parentMineral }: Props) {
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



  const hasProperties = (
    (mineral.hardness_min != null && mineral.hardness_min > 0) ||
    (mineral.density_min != null && mineral.density_min > 0) ||
    mineral.streak ||
    (mineral.luster && mineral.luster.length > 0) ||
    mineral.transparency ||
    (mineral.color && mineral.color.length > 0) ||
    (mineral.crystal_habits && mineral.crystal_habits.length > 0) ||
    mineral.cleavage ||
    mineral.fracture ||
    mineral.tenacity ||
    mineral.magnetism ||
    mineral.radioactivity ||
    mineral.fluorescence ||
    mineral.strunz_number ||
    mineral.dana_number
  )

  const hasAnyData = hasProperties || mineral.description || mineral.chemical_formula || mineral.crystal_system

  const mindatUrl = mineral.mindat_url || (mineral.mindat_id ? `https://www.mindat.org/min-${mineral.mindat_id}.html` : null)

  // Normalizar dureza/densidad: tratar 0 como null (dato no disponible)
  const hardnessMin = (mineral.hardness_min && mineral.hardness_min > 0) ? mineral.hardness_min : null
  const hardnessMax = (mineral.hardness_max && mineral.hardness_max > 0) ? mineral.hardness_max : null
  const densityMin = (mineral.density_min && mineral.density_min > 0) ? mineral.density_min : null
  const densityMax = (mineral.density_max && mineral.density_max > 0) ? mineral.density_max : null

  return (
    <div style={{ minHeight: '100dvh', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/catalog" style={{ color: 'var(--text-muted)' }}>Catálogo</Link>
        {' '}/{' '}
        <span style={{ color: 'var(--text-primary)' }}>{mineral.name_es || mineral.name}</span>
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

            <h1 style={{ marginBottom: '0.25rem' }}>{mineral.name_es || mineral.name}</h1>
            {mineral.name_es && mineral.name_es !== mineral.name && (
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                {mineral.name}
              </p>
            )}
            {mineral.chemical_formula && (
              <code 
                style={{
                  display: 'inline-block',
                  fontSize: '1rem', color: 'var(--accent-cyan)',
                  background: 'rgba(6,182,212,0.08)',
                  padding: '0.25rem 0.75rem', borderRadius: '6px',
                  border: '1px solid rgba(6,182,212,0.2)',
                }}
                dangerouslySetInnerHTML={{ __html: mineral.chemical_formula }}
              />
            )}
          </div>

          {/* Description */}
          {mineral.description ? (
            <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' }}>Descripción</h4>
              <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                {mineral.description}
              </p>
            </div>
          ) : !hasAnyData && (
            <div className="card-elevated" style={{
              padding: '2rem 1.5rem', marginBottom: '1.5rem',
              borderLeft: '3px solid var(--accent-gold)',
              background: 'rgba(245,158,11,0.04)',
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>🕮</span>
                <div>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                    Ficha en construcción
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                    Los datos detallados de este mineral aún no están disponibles en nuestro sistema.
                    La base de datos de Mindat.org puede tener información completa sobre este mineral.
                  </p>
                  {mindatUrl && (
                    <a href={mindatUrl} target="_blank" rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', marginTop: '1rem' }}>
                      🔗 Consultar en Mindat.org
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Properties table */}
          <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
              textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' }}>Propiedades Físicas</h4>
            {hasProperties ? (
            <table className="prop-table">
              <tbody>
                {hardnessMin != null && (
                  <tr>
                    <td>Dureza (Mohs)</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 600 }}>
                          {hardnessMin === hardnessMax
                            ? hardnessMin
                            : `${hardnessMin}–${hardnessMax ?? hardnessMin}`}
                        </span>
                        <div className="hardness-bar">
                          {[...Array(10)].map((_, i) => {
                            const pip = i + 1
                            const filled = pip >= (hardnessMin ?? 0) && pip <= (hardnessMax ?? hardnessMin ?? 0)
                            return <div key={i} className={`hardness-pip ${filled ? 'active' : ''}`} title={`Mohs ${pip}`} />
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {densityMin != null && (
                  <tr>
                    <td>Densidad (g/cm³)</td>
                    <td>
                      {densityMin === densityMax
                        ? densityMin
                        : `${densityMin}–${densityMax ?? densityMin}`}
                    </td>
                  </tr>
                )}
                {mineral.streak && <tr><td>Raya</td><td>{mineral.streak}</td></tr>}
                {mineral.luster && mineral.luster.length > 0 && (
                  <tr><td>Brillo</td><td>{mineral.luster.map(l => LUSTER_LABELS[l.toLowerCase()] || l).join(', ')}</td></tr>
                )}
                {mineral.transparency && <tr><td>Transparencia</td><td>{TRANSPARENCY_LABELS[mineral.transparency.toLowerCase()] || mineral.transparency}</td></tr>}
                {mineral.color && mineral.color.length > 0 && (
                  <tr><td>Color</td><td>{mineral.color.map(c => COLOR_LABELS[c.toLowerCase()] || c).join(', ')}</td></tr>
                )}
                {mineral.crystal_habits && mineral.crystal_habits.length > 0 && (
                  <tr><td>Hábito cristalino</td><td>{mineral.crystal_habits.join(', ')}</td></tr>
                )}
                {mineral.cleavage && <tr><td>Exfoliación</td><td>{CLEAVAGE_LABELS[mineral.cleavage.toLowerCase()] || mineral.cleavage}</td></tr>}
                {mineral.fracture && <tr><td>Fractura</td><td>{FRACTURE_LABELS[mineral.fracture.toLowerCase()] || mineral.fracture}</td></tr>}
                {mineral.tenacity && <tr><td>Tenacidad</td><td>{TENACITY_LABELS[mineral.tenacity.toLowerCase()] || mineral.tenacity}</td></tr>}
                {mineral.magnetism && <tr><td>Magnetismo</td><td>{mineral.magnetism}</td></tr>}
                {mineral.radioactivity && <tr><td>Radioactividad</td><td>{mineral.radioactivity}</td></tr>}
                {mineral.fluorescence && <tr><td>Fluorescencia</td><td>{mineral.fluorescence}</td></tr>}
                {mineral.strunz_number && <tr><td>Número Strunz</td><td><code style={{ fontSize: '0.85em', color: 'var(--accent-cyan)' }}>{mineral.strunz_number}</code></td></tr>}
                {mineral.dana_number && <tr><td>Número Dana</td><td><code style={{ fontSize: '0.85em', color: 'var(--accent-cyan)' }}>{mineral.dana_number}</code></td></tr>}
              </tbody>
            </table>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                Propiedades físicas no disponibles en la base de datos actual.
              </p>
            )}
          </div>

          {/* Varieties / Related Species Section */}
          {((varieties && varieties.length > 0) || parentMineral) && (
            <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              {parentMineral && (
                <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ 
                    fontSize: '0.68rem', color: 'var(--text-muted)', 
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                  }}>
                    Especie Mineral Principal
                  </span>
                  <Link href={`/mineral/${parentMineral.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.875rem', marginTop: '0.5rem' }}>
                    <div style={{ 
                      width: '42px', height: '42px', borderRadius: 'var(--radius-xs)', 
                      background: 'var(--bg-void)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-subtle)', flexShrink: 0
                    }}>
                      {parentMineral.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={parentMineral.thumbnail_url} alt={parentMineral.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '1.25rem' }}>💎</div>
                      )}
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                        {parentMineral.name_es || parentMineral.name}
                      </h5>
                      {parentMineral.name_es && parentMineral.name_es !== parentMineral.name && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontStyle: 'italic', marginTop: '0.1rem' }}>
                          {parentMineral.name}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {varieties && varieties.length > 0 && (
                <div>
                  <h4 style={{ 
                    marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' 
                  }}>
                    {parentMineral ? 'Otras variedades de esta especie' : 'Variedades de esta especie'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {varieties.map((v) => (
                      <Link key={v.id} href={`/mineral/${v.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--bg-void)', border: '1px solid var(--border-default)', transition: 'all var(--transition-fast)' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-gold)';
                          (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
                          (e.currentTarget as HTMLElement).style.background = 'var(--bg-void)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: 'var(--radius-xs)', 
                            background: 'var(--bg-surface)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid var(--border-subtle)', flexShrink: 0
                          }}>
                            {v.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.thumbnail_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ fontSize: '1rem' }}>✨</div>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h5 style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.name_es || v.name}
                            </h5>
                            {v.chemical_formula && (
                              <code 
                                className="scientific-mono"
                                style={{ fontSize: '0.625rem', color: 'var(--accent-cyan)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}
                                dangerouslySetInnerHTML={{ __html: v.chemical_formula }}
                              />
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', flexShrink: 0 }}>➜</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
          {mindatUrl && (
            <a href={mindatUrl} target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
              🔗 Ver en Mindat.org
            </a>
          )}
        </div>

        {/* Right column — 3D + collection */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          {/* Visores 3D para todos los hábitos disponibles */}
          {mineral.crystal_habits && mineral.crystal_habits.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {mineral.crystal_habits.map((habit, idx) => (
                <div key={idx} className="card-elevated" style={{ padding: '0.875rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <Crystal3DViewer
                    crystalOptions={{
                      system: mineral.crystal_system ?? 'Amorphous',
                      habit: habit,
                      axisRatio: (mineral.model_3d_config as any)?.params,
                    }}
                    transparency={0.88}
                    height="240px"
                  />
                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.625rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                    Hábito: {habit}
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    Sistema {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system ?? ''] ?? mineral.crystal_system ?? 'amorfo'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-elevated" style={{ padding: '0.875rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <Crystal3DViewer
                crystalOptions={{
                  system: mineral.crystal_system ?? 'Amorphous',
                  habit: '',
                  axisRatio: (mineral.model_3d_config as any)?.params,
                }}
                transparency={0.88}
                height="340px"
              />
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.625rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                Sistema {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system ?? ''] ?? mineral.crystal_system ?? 'amorfo'}
              </p>
            </div>
          )}

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
