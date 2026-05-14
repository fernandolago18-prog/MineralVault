'use client'

import Link from 'next/link'
import type { MineralSearchResult } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, MINERAL_CLASS_LABELS } from '@/types/database'

interface MineralCardProps {
  mineral: MineralSearchResult
  status?: 'owned' | 'wanted'
  onToggleCollection: (mineralId: string, status: 'owned' | 'wanted') => void
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

export default function MineralCard({ mineral, status, onToggleCollection }: MineralCardProps) {
  const isOwned = status === 'owned'
  const isWanted = status === 'wanted'
  
  const hardnessLabel = mineral.hardness_min != null
    ? mineral.hardness_min === mineral.hardness_max
      ? `${mineral.hardness_min}`
      : `${mineral.hardness_min}–${mineral.hardness_max}`
    : '—'

  return (
    <div
      className={`mineral-card ${isOwned ? 'in-collection' : ''}`}
      style={{ background: isOwned ? 'rgba(45,138,103,0.02)' : 'var(--bg-surface)' }}>

      {/* Top section: image or crystal preview */}
      <Link href={`/mineral/${mineral.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          height: '140px', position: 'relative',
          background: 'var(--bg-void)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-default)',
        }}>
          {mineral.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mineral.thumbnail_url}
              alt={`Foto de ${mineral.name}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isOwned ? 1 : 0.7 }}
            />
          ) : (
            <div style={{ textAlign: 'center', opacity: isOwned ? 1 : 0.5 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>
                {getClassEmoji(mineral.mineral_class)}
              </div>
              {mineral.crystal_system && (
                <span className="badge" style={{ fontSize: '0.6rem' }}>
                  {CRYSTAL_SYSTEM_LABELS[mineral.crystal_system] ?? mineral.crystal_system}
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
              COLLECTED
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
              Wishlist
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        <Link href={`/mineral/${mineral.id}`} style={{ textDecoration: 'none' }}>
          <h5 style={{
            fontFamily: 'Fraunces, serif', fontWeight: 500,
            fontSize: '1.1rem', color: isOwned ? 'var(--text-primary)' : 'var(--text-primary)',
            textTransform: 'none', letterSpacing: 'normal',
            marginBottom: '0.25rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {mineral.name}
          </h5>
          {mineral.name_es && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--text-muted)',
              marginBottom: '0.75rem', fontStyle: 'italic',
            }}>
              {mineral.name_es}
            </p>
          )}
        </Link>

        {/* Chemical formula */}
        {mineral.chemical_formula && (
          <div style={{ marginBottom: '1rem' }}>
            <code className="scientific-mono" style={{
              fontSize: '0.7rem', color: 'var(--accent-primary)',
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {mineral.chemical_formula}
            </code>
          </div>
        )}

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            title={isOwned ? 'Quitar de mi colección' : 'Añadir a mi colección'}
            className={`btn btn-sm ${isOwned ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: 1 }}
            onClick={(e) => { e.preventDefault(); onToggleCollection(mineral.id, 'owned') }}>
            {isOwned ? 'Remove' : '+ Collection'}
          </button>
          
          <button
            title={isWanted ? 'Quitar de deseados' : 'Añadir a deseados'}
            className={`btn btn-sm ${isWanted ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '0 0.75rem' }}
            onClick={(e) => { e.preventDefault(); onToggleCollection(mineral.id, 'wanted') }}>
            {isWanted ? '★' : '☆'}
          </button>
        </div>
      </div>
    </div>
  )
}
