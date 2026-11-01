'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MineralSearchResult, Mineral } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, mergeMineralWithParent, getStreakColors, normalizeText, matchesSearch, sanitizeChemicalFormula } from '@/types/database'
import { Star, Camera } from 'lucide-react'

interface MineralCardProps {
  mineral: MineralSearchResult
  varieties?: Mineral[]
  collectionMap: Record<string, string>
  collectionCounts: Record<string, number>
  collectionPhotos?: Record<string, string>
  onToggleCollection: (mineralId: string, status: 'owned' | 'wanted' | 'remove_all') => void
  searchQuery?: string
}

/** Genera un color de fondo sutil basado en el sistema cristalino */
function getSystemGradient(system: string | null): string {
  const map: Record<string, string> = {
    Cubic:         'rgba(155,89,182,0.08)',
    Hexagonal:     'rgba(26,188,156,0.08)',
    Tetragonal:    'rgba(52,152,219,0.08)',
    Orthorhombic:  'rgba(230,126,34,0.08)',
    Monoclinic:    'rgba(233,30,99,0.08)',
    Triclinic:     'rgba(243,156,18,0.08)',
    Trigonal:      'rgba(0,188,212,0.08)',
  }
  return map[system ?? ''] ?? 'rgba(255,255,255,0.03)'
}

export default function MineralCard({
  mineral,
  varieties = [],
  collectionMap,
  collectionCounts = {},
  collectionPhotos = {},
  onToggleCollection,
  searchQuery,
}: MineralCardProps) {
  const [manualVarietyId, setManualVarietyId] = useState<string | null>(null)

  // Derivación directa y reactiva en render (evita renders en cascada y warnings en React 19)
  let selectedMineral: MineralSearchResult | Mineral = mineral

  if (manualVarietyId) {
    if (manualVarietyId === mineral.id) {
      selectedMineral = mineral
    } else {
      const manualFound = varieties.find(v => v.id === manualVarietyId)
      if (manualFound) {
        selectedMineral = manualFound
      }
    }
  } else if (searchQuery && varieties.length > 0) {
    const q = normalizeText(searchQuery)

    // 1. ¿Alguna variedad coincide EXACTAMENTE con la búsqueda?
    const exactVariety = varieties.find(v => 
      normalizeText(v.name) === q || 
      normalizeText(v.name_es) === q
    )
    if (exactVariety) {
      selectedMineral = exactVariety
    } else {
      // 2. ¿El padre coincide con la búsqueda (parcial o exacta)? -> Preferimos el padre
      const parentMatches = matchesSearch(q, mineral.name, mineral.name_es)
      if (!parentMatches) {
        // 3. ¿Alguna variedad incluye la búsqueda parcialmente?
        const partialVariety = varieties.find(v => 
          matchesSearch(q, v.name, v.name_es)
        )
        if (partialVariety) {
          selectedMineral = partialVariety
        }
      }
    }
  }

  const mergedMineral = mergeMineralWithParent(selectedMineral, selectedMineral.parent_mindat_id ? mineral : null)

  const ownedCount = collectionCounts[selectedMineral.id] ?? 0
  const isOwned = ownedCount > 0
  const isWanted = collectionMap[selectedMineral.id] === 'wanted'
  
  const hardnessLabel = mergedMineral.hardness_min != null
    ? mergedMineral.hardness_min === mergedMineral.hardness_max
      ? `${mergedMineral.hardness_min}`
      : `${mergedMineral.hardness_min}–${mergedMineral.hardness_max}`
    : '—'

  const streakColors = getStreakColors(mergedMineral.streak)

  const userPhoto = collectionPhotos?.[selectedMineral.id] 
    || collectionPhotos?.[mineral.id] 
    || null

  const displayImage = userPhoto || mergedMineral.thumbnail_url

  return (
    <div
      className={`mineral-card ${isOwned ? 'in-collection' : ''} ${mergedMineral.is_rock ? 'is-rock-card' : ''}`}
      style={{ 
        position: 'relative'
      }}>
      
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
          title={`Color de raya: ${mergedMineral.streak}`}
        />
      )}


      {/* Top section: image or crystal preview */}
      <Link href={`/mineral/${selectedMineral.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          height: '135px', position: 'relative',
          background: 'var(--bg-void)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-default)',
        }}>
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={`Foto de ${mergedMineral.name_es || mergedMineral.name}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                if (userPhoto && mergedMineral.thumbnail_url && (e.currentTarget as HTMLImageElement).src !== mergedMineral.thumbnail_url) {
                  (e.currentTarget as HTMLImageElement).src = mergedMineral.thumbnail_url
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', imageOrientation: 'from-image', opacity: isOwned ? 1 : 0.75 }}
            />
          ) : (
            <div style={{ textAlign: 'center', opacity: isOwned ? 1 : 0.5 }}>
              {mergedMineral.is_rock ? (
                <span className="badge badge-rock" style={{ fontSize: '0.65rem' }}>
                  ROCA
                </span>
              ) : (
                mergedMineral.crystal_system && (
                  <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>
                    {CRYSTAL_SYSTEM_LABELS[mergedMineral.crystal_system] ?? mergedMineral.crystal_system}
                  </span>
                )
              )}
            </div>
          )}

          {/* Owned indicator */}
          {isOwned && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'var(--accent-emerald)',
              color: 'white', borderRadius: 'var(--radius-xs)',
              padding: '2px 7px',
              fontSize: '0.62rem', fontWeight: 800,
              letterSpacing: '0.04em',
              zIndex: 2,
            }}>
              COLECCIONADO ({ownedCount})
            </div>
          )}
          
          {/* Wanted indicator */}
          {isWanted && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'var(--bg-void)',
              color: 'var(--accent-gold)',
              border: '1px solid var(--accent-gold)',
              borderRadius: 'var(--radius-xs)',
              padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              zIndex: 2,
            }}>
              DESEADOS
            </div>
          )}

          {/* Badge de Foto propia del coleccionista */}
          {userPhoto && (
            <div style={{
              position: 'absolute', bottom: '8px', right: '8px',
              background: 'rgba(14, 14, 18, 0.88)',
              backdropFilter: 'blur(4px)',
              color: 'var(--accent-gold)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs)',
              padding: '2px 5px',
              display: 'flex', alignItems: 'center', gap: '3px',
              fontSize: '0.58rem', fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              zIndex: 2,
            }}>
              <Camera size={10} /> Tu foto
            </div>
          )}

          {/* Rock indicator */}
          {mergedMineral.is_rock && !userPhoto && (
            <div style={{
              position: 'absolute', bottom: '10px', left: '10px',
              zIndex: 2,
            }}>
              <span className="badge badge-rock" style={{ fontSize: '0.62rem', background: 'rgba(22, 22, 28, 0.95)', backdropFilter: 'blur(4px)' }}>
                Roca
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: '0.85rem' }}>
        <Link href={`/mineral/${selectedMineral.id}`} style={{ textDecoration: 'none' }}>
          <h5 style={{
            fontFamily: 'Fraunces, serif', fontWeight: 500,
            fontSize: '1.05rem', color: 'var(--text-primary)',
            textTransform: 'none', letterSpacing: 'normal',
            marginBottom: '0.25rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {mergedMineral.name_es || mergedMineral.name}
          </h5>
          {mergedMineral.name_es && mergedMineral.name_es !== mergedMineral.name && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--text-muted)',
              marginBottom: '0.75rem', fontStyle: 'italic',
            }}>
              {mergedMineral.name}
            </p>
          )}
        </Link>

        {/* Chemical formula */}
        {mergedMineral.chemical_formula && (
          <div style={{ marginBottom: '1rem' }}>
            <code 
              className="scientific-mono" 
              style={{
                fontSize: '0.7rem', color: 'var(--accent-primary)',
                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeChemicalFormula(mergedMineral.chemical_formula) }}
            />
          </div>
        )}

        {/* Selector de Variedades */}
        {varieties && varieties.length > 0 && (
          <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', 
              letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem',
              fontWeight: 600
            }}>
              Variedad ({varieties.length + 1})
            </label>
            <select
              style={{
                width: '100%',
                background: 'var(--bg-void)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              value={selectedMineral.id}
              onChange={(e) => {
                setManualVarietyId(e.target.value)
              }}
            >
              <option value={mineral.id}>{mineral.name_es || mineral.name} (General)</option>
              {varieties.map(v => {
                const count = collectionCounts[v.id] ?? 0
                return (
                  <option key={v.id} value={v.id}>
                    {v.name_es || v.name} {count > 0 ? ` (Coleccionado: ${count})` : ''}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem', alignItems: 'center' }}>
          <button
            title={isOwned ? 'Registrar otro ejemplar' : 'Añadir a mi colección'}
            className="btn btn-sm btn-primary"
            style={{ flex: 1, minWidth: 0, padding: '0.35rem 0.3rem', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis' }}
            onClick={(e) => { e.preventDefault(); onToggleCollection(selectedMineral.id, 'owned') }}>
            {isOwned ? '+ Ejemplar' : '+ Colección'}
          </button>

          {isOwned && (
            <button
              title="Quitar mineral de mi colección"
              className="btn btn-sm btn-danger"
              style={{ padding: '0 0.35rem', flexShrink: 0, fontSize: '0.7rem' }}
              onClick={(e) => {
                e.preventDefault()
                if (confirm(`¿Seguro que quieres quitar el mineral "${mergedMineral.name_es || mergedMineral.name}" por completo de tu colección? Se eliminarán todos sus ejemplares y fotos asociadas.`)) {
                  onToggleCollection(selectedMineral.id, 'remove_all')
                }
              }}
            >
              Quitar
            </button>
          )}
          
          <button
            title={isWanted ? 'Quitar de deseados' : 'Añadir a deseados'}
            className={`btn btn-sm ${isWanted ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '0 0.35rem', width: '30px', height: '30px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => { e.preventDefault(); onToggleCollection(selectedMineral.id, 'wanted') }}>
            <Star size={13} fill={isWanted ? 'currentColor' : 'none'} stroke="currentColor" />
          </button>
        </div>
      </div>
    </div>
  )
}
