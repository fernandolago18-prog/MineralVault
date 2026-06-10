'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { MineralSearchResult, Mineral } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, MINERAL_CLASS_LABELS, mergeMineralWithParent } from '@/types/database'

interface MineralCardProps {
  mineral: MineralSearchResult
  varieties?: Mineral[]
  collectionMap: Record<string, string>
  onToggleCollection: (mineralId: string, status: 'owned' | 'wanted') => void
  searchQuery?: string
}

/** Devuelve un emoji representativo de la clase mineral */
function getClassEmoji(cls: string | null): string {
  const map: Record<string, string> = {
    'Native Elements': '⚡', 'Sulfides': '🪨', 'Oxides': '🔴',
    'Halides': '💠', 'Carbonates': '🌊', 'Phosphates': '💚',
    'Silicates': '💎', 'Sulfates': '🤍', 'Borates': '🔵',
    'Arsenates': '☢️', 'Vanadates': '🟢', 'Tungstates': '⬛',
  }
  return map[cls ?? ''] ?? '🪨'
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
  onToggleCollection,
  searchQuery,
}: MineralCardProps) {
  const [selectedMineral, setSelectedMineral] = useState<MineralSearchResult | Mineral>(mineral)

  useEffect(() => {
    // Si hay una búsqueda activa y coincide con el nombre de alguna variedad, la seleccionamos por defecto
    if (searchQuery && varieties.length > 0) {
      const queryLower = searchQuery.toLowerCase().trim()
      const matchingVariety = varieties.find(v => 
        v.name.toLowerCase().includes(queryLower) || 
        (v.name_es && v.name_es.toLowerCase().includes(queryLower))
      )
      if (matchingVariety) {
        setSelectedMineral(matchingVariety)
        return
      }
    }
    // Si no, o si cambia el mineral prop, resetear al mineral padre original
    setSelectedMineral(mineral)
  }, [mineral, searchQuery, varieties])

  const mergedMineral = mergeMineralWithParent(selectedMineral, selectedMineral.parent_mindat_id ? mineral : null)

  const isOwned = collectionMap[selectedMineral.id] === 'owned'
  const isWanted = collectionMap[selectedMineral.id] === 'wanted'
  
  const hardnessLabel = mergedMineral.hardness_min != null
    ? mergedMineral.hardness_min === mergedMineral.hardness_max
      ? `${mergedMineral.hardness_min}`
      : `${mergedMineral.hardness_min}–${mergedMineral.hardness_max}`
    : '—'

  return (
    <div
      className={`mineral-card ${isOwned ? 'in-collection' : ''}`}
      style={{ background: isOwned ? 'rgba(45,138,103,0.02)' : 'var(--bg-surface)' }}>

      {/* Top section: image or crystal preview */}
      <Link href={`/mineral/${selectedMineral.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          height: '140px', position: 'relative',
          background: 'var(--bg-void)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-default)',
        }}>
          {mergedMineral.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mergedMineral.thumbnail_url}
              alt={`Foto de ${mergedMineral.name_es || mergedMineral.name}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isOwned ? 1 : 0.7 }}
            />
          ) : (
            <div style={{ textAlign: 'center', opacity: isOwned ? 1 : 0.5 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>
                {getClassEmoji(mergedMineral.mineral_class)}
              </div>
              {mergedMineral.crystal_system && (
                <span className="badge" style={{ fontSize: '0.6rem' }}>
                  {CRYSTAL_SYSTEM_LABELS[mergedMineral.crystal_system] ?? mergedMineral.crystal_system}
                </span>
              )}
            </div>
          )}

          {/* Owned indicator */}
          {isOwned && (
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              background: 'var(--accent-emerald)',
              color: 'white', borderRadius: 'var(--radius-xs)',
              padding: '2px 8px',
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.05em',
              zIndex: 2,
            }}>
              COLECCIONADO
            </div>
          )}
          
          {/* Wanted indicator */}
          {isWanted && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
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
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        <Link href={`/mineral/${selectedMineral.id}`} style={{ textDecoration: 'none' }}>
          <h5 style={{
            fontFamily: 'Fraunces, serif', fontWeight: 500,
            fontSize: '1.1rem', color: 'var(--text-primary)',
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
              dangerouslySetInnerHTML={{ __html: mergedMineral.chemical_formula }}
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
                const val = e.target.value
                if (val === mineral.id) {
                  setSelectedMineral(mineral)
                } else {
                  const found = varieties.find(v => v.id === val)
                  if (found) setSelectedMineral(found)
                }
              }}
            >
              <option value={mineral.id}>{mineral.name_es || mineral.name} (General)</option>
              {varieties.map(v => (
                <option key={v.id} value={v.id}>
                  ✨ {v.name_es || v.name} {collectionMap[v.id] === 'owned' ? ' (Coleccionado)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            title={isOwned ? 'Quitar de mi colección' : 'Añadir a mi colección'}
            className={`btn btn-sm ${isOwned ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: 1 }}
            onClick={(e) => { e.preventDefault(); onToggleCollection(selectedMineral.id, 'owned') }}>
            {isOwned ? 'Quitar' : '+ Colección'}
          </button>
          
          <button
            title={isWanted ? 'Quitar de deseados' : 'Añadir a deseados'}
            className={`btn btn-sm ${isWanted ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '0 0.75rem' }}
            onClick={(e) => { e.preventDefault(); onToggleCollection(selectedMineral.id, 'wanted') }}>
            {isWanted ? '★' : '☆'}
          </button>
        </div>
      </div>
    </div>
  )
}
