'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getStreakColors, MINERAL_CLASS_LABELS, CRYSTAL_SYSTEM_LABELS, VALID_3D_SYSTEMS } from '@/types/database'

interface CollectionClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  driveConnected: boolean
}

export default function CollectionClient({ items, driveConnected }: CollectionClientProps) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('') // '' | 'mineral' | 'rock'
  const [filterStreak, setFilterStreak] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSystem, setFilterSystem] = useState('')
  const [hardnessMin, setHardnessMin] = useState<number | ''>('')
  const [hardnessMax, setHardnessMax] = useState<number | ''>('')

  // Filtrado en memoria
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const mineral = item.mineral
      if (!mineral) return false

      // Texto
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchName = mineral.name?.toLowerCase().includes(q)
        const matchNameEs = mineral.name_es?.toLowerCase().includes(q)
        const matchFormula = mineral.chemical_formula?.toLowerCase().includes(q)
        if (!matchName && !matchNameEs && !matchFormula) return false
      }

      // Tipo
      if (filterType === 'rock' && !mineral.is_rock) return false
      if (filterType === 'mineral' && mineral.is_rock) return false

      // Raya
      if (filterStreak) {
        const streakStr = mineral.streak?.toLowerCase() || ''
        if (!streakStr.includes(filterStreak.toLowerCase())) return false
      }

      // Clase
      if (filterClass && mineral.mineral_class !== filterClass) return false

      // Sistema
      if (filterSystem && mineral.crystal_system !== filterSystem) return false

      // Dureza Mohs
      if (hardnessMin !== '') {
        // Asumimos que si no tiene hardness, lo filtramos o lo mostramos? En el catálogo original, si hMin está definido, mineral.hardness_max >= hMin
        if (mineral.hardness_max === null || mineral.hardness_max === undefined || mineral.hardness_max < hardnessMin) return false
      }
      if (hardnessMax !== '') {
        if (mineral.hardness_min === null || mineral.hardness_min === undefined || mineral.hardness_min > hardnessMax) return false
      }

      return true
    })
  }, [items, search, filterType, filterStreak, filterClass, filterSystem, hardnessMin, hardnessMax])

  // Estadísticas derivadas de los items FILTRADOS
  const byClass: Record<string, number> = {}
  filteredItems.forEach(i => {
    const cls = i.mineral?.mineral_class ?? 'Sin clase'
    byClass[cls] = (byClass[cls] ?? 0) + 1
  })

  // Extraer clases únicas de TODOS los items para rellenar el selector
  const availableClasses = useMemo(() => {
    const classes = new Set<string>()
    items.forEach(i => {
      if (i.mineral?.mineral_class) classes.add(i.mineral.mineral_class)
    })
    return Array.from(classes).sort()
  }, [items])

  // Agrupar ejemplares por especie mineral/roca
  const groupedItems = useMemo(() => {
    const groups: Record<string, { mineral: any, specimens: any[] }> = {}
    
    filteredItems.forEach(item => {
      const mineralId = item.mineral?.id
      if (!mineralId) return

      if (!groups[mineralId]) {
        groups[mineralId] = {
          mineral: item.mineral,
          specimens: []
        }
      }
      groups[mineralId].specimens.push(item)
    })

    return Object.values(groups).sort((a, b) => {
      const nameA = a.mineral.name_es || a.mineral.name || ''
      const nameB = b.mineral.name_es || b.mineral.name || ''
      return nameA.localeCompare(nameB)
    })
  }, [filteredItems])

  return (
    <div style={{ minHeight: '100dvh', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.375rem' }}>
            Mi <span className="gradient-text">Colección</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Tus minerales catalogados y documentados
          </p>
        </div>
        
        {!driveConnected && (
          <div style={{ 
            padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.06)', 
            border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.1rem' }}>
                Google Drive desconectado
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Conéctalo para respaldar tus fotos automáticamente.
              </p>
            </div>
            <a href="/api/auth/google/connect">
              <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>Conectar</button>
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {[
          { label: 'Total mostrados', value: filteredItems.length, icon: '◆', color: 'var(--accent-purple)' },
          { label: 'Clases distintas', value: Object.keys(byClass).length, icon: '■', color: 'var(--accent-cyan)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: stat.color }}>{stat.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit', color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {items.length > 0 && (
        <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            
            {/* Search & Type (Unified) */}
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
              <label htmlFor="collection-search">Buscar en tu colección</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                  <input
                    id="collection-search"
                    type="search"
                    className="input input-search"
                    placeholder="Nombre o fórmula..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    className={`btn ${filterType === '' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterType('')}
                  >Todos</button>
                  <button 
                    type="button"
                    className={`btn ${filterType === 'mineral' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterType('mineral')}
                  >Minerales</button>
                  <button 
                    type="button"
                    className={`btn ${filterType === 'rock' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterType('rock')}
                  >Rocas</button>
                </div>
              </div>
            </div>
            
            {/* Streak Color */}
            <div className="form-group">
              <label htmlFor="filter-streak">Color de Raya</label>
              <select
                id="filter-streak"
                className="input"
                value={filterStreak}
                onChange={e => setFilterStreak(e.target.value)}>
                <option value="">Todos los colores</option>
                <option value="blanca">Blanca</option>
                <option value="negra">Negra</option>
                <option value="gris">Gris</option>
                <option value="roja">Roja</option>
                <option value="marrón">Marrón / Parda</option>
                <option value="amarilla">Amarilla</option>
                <option value="verde">Verde</option>
                <option value="azul">Azul</option>
                <option value="rosa">Rosa</option>
              </select>
            </div>

            {/* Class */}
            <div className="form-group">
              <label htmlFor="filter-class">Clase Mineral</label>
              <select
                id="filter-class"
                className="input"
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}>
                <option value="">Todas las clases</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {MINERAL_CLASS_LABELS[cls] ?? cls}
                  </option>
                ))}
              </select>
            </div>

            {/* System */}
            <div className="form-group">
              <label htmlFor="filter-system">Sistema Cristalino</label>
              <select
                id="filter-system"
                className="input"
                value={filterSystem}
                onChange={e => setFilterSystem(e.target.value)}>
                <option value="">Todos los sistemas</option>
                {VALID_3D_SYSTEMS.map(sys => (
                  <option key={sys} value={sys}>
                    {CRYSTAL_SYSTEM_LABELS[sys] ?? sys}
                  </option>
                ))}
                <option value="Amorphous">Amorfo</option>
              </select>
            </div>

            {/* Dureza Mohs */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Dureza Mohs</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0" max="10" step="0.5"
                  className="input"
                  placeholder="Mín"
                  value={hardnessMin === '' ? '' : hardnessMin}
                  onChange={e => setHardnessMin(e.target.value ? parseFloat(e.target.value) : '')}
                  style={{ maxWidth: '100px' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <input
                  type="number"
                  min="0" max="10" step="0.5"
                  className="input"
                  placeholder="Máx"
                  value={hardnessMax === '' ? '' : hardnessMax}
                  onChange={e => setHardnessMax(e.target.value ? parseFloat(e.target.value) : '')}
                  style={{ maxWidth: '100px' }}
                />
                {(hardnessMin !== '' || hardnessMax !== '') && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => { setHardnessMin(''); setHardnessMax('') }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection grid */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--border-strong)' }}>◆</div>
          <h3 style={{ marginBottom: '0.75rem' }}>{items.length === 0 ? 'Tu colección está vacía' : 'No hay resultados'}</h3>
          <p style={{ marginBottom: '1.5rem' }}>{items.length === 0 ? 'Visita el catálogo y añade tus primeros minerales.' : 'Prueba a cambiar o borrar los filtros de búsqueda.'}</p>
          {items.length === 0 && (
            <Link href="/catalog">
              <button className="btn btn-primary btn-lg">Explorar el Catálogo</button>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {groupedItems.map(group => {
            const mineral = group.mineral
            const specimens = group.specimens
            const title = mineral.name_es || mineral.name

            return (
              <div key={mineral.id}>
                {/* Header for the group */}
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.5rem'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {specimens.length} ejemplar{specimens.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                {/* Specimens grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '1rem',
                }}>
                  {specimens.map(item => {
                    const streakColors = getStreakColors(mineral.streak)

                    return (
                      <Link key={item.id} href={`/collection/${item.id}`} style={{ textDecoration: 'none' }}>
                        <div className={`mineral-card in-collection ${mineral.is_rock ? 'is-rock-card' : ''}`} style={{ cursor: 'pointer', position: 'relative' }}>
                          {streakColors.length > 0 && (
                            <div 
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: '4px',
                                background: streakColors.length === 1 
                                  ? streakColors[0].hex 
                                  : `linear-gradient(to bottom, ${streakColors.map((c, i) => `${c.hex} ${(i / streakColors.length) * 100}%, ${c.hex} ${((i + 1) / streakColors.length) * 100}%`).join(', ')})`,
                                borderRight: streakColors[0].border || 'none',
                                zIndex: 10,
                              }}
                              title={`Color de raya: ${mineral.streak}`}
                            />
                          )}
                          <div style={{
                            height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: mineral.is_rock 
                              ? 'linear-gradient(135deg, rgba(125,132,145,0.15), rgba(22,22,28,0.5))' 
                              : 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))',
                            position: 'relative'
                          }}>
                            {item.primary_photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.primary_photo_url} alt={item.specimen_label || mineral.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : mineral.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={mineral.thumbnail_url} alt={mineral.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>{mineral.is_rock ? '⬡' : '◆'}</div>
                            )}
                            {mineral.is_rock && (
                              <div style={{
                                position: 'absolute', bottom: '8px', left: '8px',
                                zIndex: 2,
                              }}>
                                <span className="badge badge-rock" style={{ fontSize: '0.6rem', background: 'rgba(22, 22, 28, 0.95)', backdropFilter: 'blur(4px)' }}>
                                  Roca
                                </span>
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '0.875rem' }}>
                            <h5 style={{ marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.specimen_label || title}>
                              {item.specimen_label || title}
                            </h5>
                            {item.specimen_label && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {title}
                              </p>
                            )}
                            {mineral.chemical_formula && (
                              <code 
                                style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}
                                dangerouslySetInnerHTML={{ __html: mineral.chemical_formula }}
                              />
                            )}
                            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {item.quality && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                                  {'★'.repeat(item.quality as number)}{'☆'.repeat(5 - (item.quality as number))}
                                </span>
                              )}
                              {item.acquired_at && (
                                <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>
                                  {new Date(item.acquired_at as string).getFullYear()}
                                </span>
                              )}
                              {item.origin && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }} title={item.origin}>
                                  📍 {item.origin}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
