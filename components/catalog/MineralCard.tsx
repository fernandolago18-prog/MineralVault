'use client'

import Link from 'next/link'
import type { MineralSearchResult } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, MINERAL_CLASS_LABELS } from '@/types/database'

interface MineralCardProps {
  mineral: MineralSearchResult
  isOwned: boolean
  onToggleCollection: (mineralId: string) => void
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

export default function MineralCard({ mineral, isOwned, onToggleCollection }: MineralCardProps) {
  const hardnessLabel = mineral.hardness_min != null
    ? mineral.hardness_min === mineral.hardness_max
      ? `${mineral.hardness_min}`
      : `${mineral.hardness_min}–${mineral.hardness_max}`
    : '—'

  return (
    <div
      className={`mineral-card ${isOwned ? 'in-collection' : ''}`}
      style={{ background: `${getSystemGradient(mineral.crystal_system)}, var(--bg-surface)` }}>

      {/* Top section: image or crystal preview */}
      <Link href={`/mineral/${mineral.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          height: '130px', position: 'relative',
          background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-overlay))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {mineral.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mineral.thumbnail_url}
              alt={`Foto de ${mineral.name}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>
                {getClassEmoji(mineral.mineral_class)}
              </div>
              {mineral.crystal_system && (
                <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>
                  {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system] ?? mineral.crystal_system}
                </span>
              )}
            </div>
          )}

          {/* Owned indicator */}
          {isOwned && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'var(--accent-emerald)',
              color: 'white', borderRadius: 'full',
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 900,
              boxShadow: '0 0 15px rgba(16,185,129,0.5)',
              border: '2px solid white',
              zIndex: 2,
            }}>
              ✓
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: '1rem', position: 'relative' }}>
        {isOwned && (
          <div style={{
            position: 'absolute', inset: 0, 
            background: 'rgba(16,185,129,0.03)', 
            pointerEvents: 'none',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
          }} />
        )}
        <Link href={`/mineral/${mineral.id}`} style={{ textDecoration: 'none' }}>
          <h5 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            fontSize: '1rem', color: isOwned ? 'var(--accent-emerald)' : 'var(--text-primary)',
            marginBottom: '0.125rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {mineral.name}
          </h5>
          {mineral.name_es && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--text-muted)',
              marginBottom: '0.5rem', fontStyle: 'italic',
            }}>
              {mineral.name_es}
            </p>
          )}
        </Link>

        {/* Chemical formula */}
        {mineral.chemical_formula && (
          <code style={{
            display: 'block',
            fontSize: '0.75rem', color: 'var(--accent-cyan)',
            marginBottom: '0.625rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {mineral.chemical_formula}
          </code>
        )}

        {/* Properties mini-row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {hardnessLabel !== '—' && (
            <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
              ⬡ Mohs {hardnessLabel}
            </span>
          )}
          {mineral.mineral_class && (
            <span className="badge badge-violet" style={{ fontSize: '0.68rem' }}>
              {MINERAL_CLASS_LABELS[mineral.mineral_class] ?? mineral.mineral_class}
            </span>
          )}
        </div>

        {/* Mohs hardness visual bar */}
        {mineral.hardness_min != null && (
          <div className="hardness-bar" style={{ marginBottom: '0.75rem' }}>
            {[...Array(10)].map((_, i) => {
              const pip = i + 1
              const filled = pip >= (mineral.hardness_min ?? 0) && pip <= (mineral.hardness_max ?? mineral.hardness_min ?? 0)
              return (
                <div
                  key={i}
                  className={`hardness-pip ${filled ? 'active' : ''}`}
                  title={`Mohs ${pip}`}
                />
              )
            })}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Mohs</span>
          </div>
        )}

        {/* Action button */}
        <button
          id={`toggle-collection-${mineral.id}`}
          className={`btn btn-sm ${isOwned ? 'btn-danger' : 'btn-primary'}`}
          style={{ width: '100%' }}
          onClick={(e) => { e.preventDefault(); onToggleCollection(mineral.id) }}>
          {isOwned ? '✕ Quitar de colección' : '+ Añadir a colección'}
        </button>
      </div>
    </div>
  )
}
