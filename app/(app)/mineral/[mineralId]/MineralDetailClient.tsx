'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mineral, CollectionItem, SpecimenPhoto } from '@/types/database'
import {
  CRYSTAL_SYSTEM_LABELS,
  CRYSTAL_SYSTEM_DEFINITIONS,
  VALID_3D_SYSTEMS,
  MINERAL_CLASS_LABELS,
  LUSTER_LABELS,
  TRANSPARENCY_LABELS,
  CLEAVAGE_LABELS,
  FRACTURE_LABELS,
  TENACITY_LABELS,
  COLOR_LABELS,
  translateColor,
  translateStreak,
  translateLuster,
  translateCleavage,
  translateFracture,
  translateTenacity,
  translateHabit,
  translateMagnetism,
  translateRadioactivity,
  translateFluorescence,
  getStreakColors
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

const GEOMETRIC_HABITS_KEYWORDS = [
  'cubic', 'cúbic', 'isometr',
  'octahedr', 'octaédr',
  'dodecahedr', 'dodecaédr',
  'tetrahedr', 'tetraédr',
  'tabular',
  'prismatic', 'prismátic',
  'pyramid', 'piramid', 'bipyramid', 'bipiramid',
  'acicular', 'needle', 'aguja',
  'rhombohedr', 'romboédr',
  'scalenohedr', 'escalenoédr',
  'plat', 'platy', 'laminar', 'hojoso', 'hoja'
]

function isGeometricHabit(habit: string): boolean {
  const lowercase = habit.toLowerCase()
  return GEOMETRIC_HABITS_KEYWORDS.some(kw => lowercase.includes(kw))
}

import AddSpecimenModal from '@/components/catalog/AddSpecimenModal'

interface Props {
  mineral: Mineral
  collectionItems: (CollectionItem & { specimen_photos: SpecimenPhoto[] })[]
  userId: string
  varieties?: any[]
  parentMineral?: any
}

export default function MineralDetailClient({ mineral, collectionItems: initialItems = [], userId, varieties = [], parentMineral }: Props) {
  const [collectionItems, setCollectionItems] = useState(initialItems)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const supabase = createClient()
  const isOwned = collectionItems.length > 0

  const geometricHabits = useMemo(() => {
    if (!mineral.crystal_habits) return []
    return mineral.crystal_habits.filter(isGeometricHabit)
  }, [mineral.crystal_habits])

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  const handleSaveSpecimen = async (specimenData: any) => {
    setLoading(true)
    try {
      const { files, ...fields } = specimenData
      const payload = {
        user_id: userId,
        mineral_id: mineral.id,
        status: 'owned',
        ...fields,
      }
      const { data, error } = await (supabase
        .from('user_collection') as any)
        .insert(payload)
        .select()
        .single()
      if (error) throw error

      // Subir fotos a Drive si se adjuntaron
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('collectionId', data.id)
            fd.append('mineralName', mineral.name)

            await fetch('/api/drive/upload', { method: 'POST', body: fd })
          } catch (uploadErr) {
            console.error('[Drive Direct Upload Error]:', uploadErr)
          }
        }
      }

      // Obtener el item final con las fotos registradas
      const { data: finalItem, error: queryError } = await (supabase
        .from('user_collection') as any)
        .select('*, specimen_photos(*)')
        .eq('id', data.id)
        .single()

      if (queryError) throw queryError

      setCollectionItems(prev => [finalItem as (CollectionItem & { specimen_photos: SpecimenPhoto[] }), ...prev])
      showToast('¡Ejemplar añadido a tu colección!')
    } catch (err) {
      console.error('[Add Specimen Error]:', err)
      showToast('Error al añadir el ejemplar')
      throw err
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
              {mineral.is_rock ? (
                <span className="badge badge-rock">ROCA</span>
              ) : (
                <>
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
                </>
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
                      Consultar en Mindat.org
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
                {mineral.streak && (
                  <tr>
                    <td>Color de Raya</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{translateStreak(mineral.streak)}</span>
                        {getStreakColors(mineral.streak).length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {getStreakColors(mineral.streak).map((color, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '12px', height: '12px', borderRadius: '50%',
                                  backgroundColor: color.hex,
                                  border: color.border || '1px solid rgba(255,255,255,0.1)'
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {mineral.luster && mineral.luster.length > 0 && (
                  <tr><td>Brillo</td><td>{translateLuster(mineral.luster)}</td></tr>
                )}
                {mineral.transparency && <tr><td>Transparencia</td><td>{TRANSPARENCY_LABELS[mineral.transparency.toLowerCase().trim()] || mineral.transparency}</td></tr>}
                {mineral.color && mineral.color.length > 0 && (
                  <tr><td>Color</td><td>{translateColor(mineral.color)}</td></tr>
                )}
                {mineral.crystal_habits && mineral.crystal_habits.length > 0 && (
                  <tr><td>Hábito cristalino</td><td>{mineral.crystal_habits.map(h => translateHabit(h)).join(', ')}</td></tr>
                )}
                {mineral.cleavage && <tr><td>Exfoliación</td><td>{translateCleavage(mineral.cleavage)}</td></tr>}
                {mineral.fracture && <tr><td>Fractura</td><td>{translateFracture(mineral.fracture)}</td></tr>}
                {mineral.tenacity && <tr><td>Tenacidad</td><td>{translateTenacity(mineral.tenacity)}</td></tr>}
                {mineral.magnetism && <tr><td>Magnetismo</td><td>{translateMagnetism(mineral.magnetism)}</td></tr>}
                {mineral.radioactivity && <tr><td>Radioactividad</td><td>{translateRadioactivity(mineral.radioactivity)}</td></tr>}
                {mineral.fluorescence && <tr><td>Fluorescencia</td><td>{translateFluorescence(mineral.fluorescence)}</td></tr>}
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
                        <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>◆</div>
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
                              <div style={{ fontSize: '1.0rem', color: 'var(--text-muted)' }}>◆</div>
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
                  <span key={i} className="badge badge-cyan">{loc}</span>
                ))}
              </div>
            </div>
          )}

          {/* Mindat link */}
          {mindatUrl && (
            <a href={mindatUrl} target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
              Ver en Mindat.org
            </a>
          )}
        </div>

        {/* Right column — 3D + collection */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          {/* Visores 3D para todos los hábitos disponibles (Solo para sistemas cristalinos válidos y si NO es roca) */}
          {!mineral.is_rock && mineral.crystal_system && VALID_3D_SYSTEMS.includes(mineral.crystal_system) && (
            geometricHabits && geometricHabits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {geometricHabits.map((habit, idx) => (
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
                      Hábito: {translateHabit(habit)}
                    </p>
                    <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      Sistema {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system ?? ''] ?? mineral.crystal_system ?? 'amorfo'}
                    </p>
                    {mineral.crystal_system && CRYSTAL_SYSTEM_DEFINITIONS[mineral.crystal_system] && (
                      <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.375rem', padding: '0 0.5rem', lineHeight: 1.4, fontStyle: 'italic' }}>
                        {CRYSTAL_SYSTEM_DEFINITIONS[mineral.crystal_system]}
                      </p>
                    )}
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
                {mineral.crystal_system && CRYSTAL_SYSTEM_DEFINITIONS[mineral.crystal_system] && (
                  <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.375rem', padding: '0 0.5rem', lineHeight: 1.4, fontStyle: 'italic' }}>
                    {CRYSTAL_SYSTEM_DEFINITIONS[mineral.crystal_system]}
                  </p>
                )}
              </div>
            )
          )}

          {/* Información específica de rocas en lugar de visor 3D */}
          {mineral.is_rock && (
            <div className="card-elevated" style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px dashed var(--accent-rock-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.75rem', color: 'var(--accent-rock)' }}>⬡</div>
              <h5 style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-rock)', marginBottom: '0.5rem', fontWeight: 700 }}>Agregado Rocoso</h5>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
                Las rocas son agregados cohesivos de uno o más minerales. A diferencia de las especies minerales puras, las rocas no poseen una estructura cristalina única ni una fórmula química homogénea fija.
              </p>
            </div>
          )}

          {/* Collection section */}
          <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mi Colección
            </h5>
            
            {collectionItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tienes {collectionItems.length} ejemplar{collectionItems.length > 1 ? 'es' : ''} de este {mineral.is_rock ? 'agregado' : 'mineral'}:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {collectionItems.map((item, idx) => (
                    <Link key={item.id} href={`/collection/${item.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        background: 'var(--bg-void)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'border-color var(--transition-fast)',
                        cursor: 'pointer'
                      }}
                        onMouseEnter={e => {
                          const target = e.currentTarget as HTMLDivElement;
                          target.style.borderColor = 'var(--accent-purple)';
                        }}
                        onMouseLeave={e => {
                          const target = e.currentTarget as HTMLDivElement;
                          target.style.borderColor = 'var(--border-default)';
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {item.specimen_label || `${mineral.name_es || mineral.name} #${collectionItems.length - idx}`}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                            {item.origin && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                📍 {item.origin}
                              </span>
                            )}
                            {item.quality && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
                                {'★'.repeat(item.quality)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>➜</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                Aún no tienes este {mineral.is_rock ? 'agregado' : 'mineral'} en tu colección.
              </p>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              + Registrar Ejemplar
            </button>
          </div>

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

      {/* Add specimen modal */}
      <AddSpecimenModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveSpecimen}
        mineralName={mineral.name_es || mineral.name}
      />
    </div>
  )
}
