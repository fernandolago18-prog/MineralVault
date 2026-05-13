'use client'

import { useState, useCallback, useRef, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { MineralSearchResult } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, MINERAL_CLASS_LABELS } from '@/types/database'
import MineralCard from '@/components/catalog/MineralCard'

interface CatalogClientProps {
  initialMinerals: MineralSearchResult[]
  collectionMap: Record<string, string>
  totalInDb: number
  userId: string
}

const CRYSTAL_SYSTEMS = ['Cubic', 'Hexagonal', 'Tetragonal', 'Orthorhombic', 'Monoclinic', 'Triclinic', 'Trigonal']
const MINERAL_CLASSES = Object.keys(MINERAL_CLASS_LABELS)
const PAGE_SIZE = 24

export default function CatalogClient({
  initialMinerals,
  collectionMap: initialCollectionMap,
  totalInDb,
  userId,
}: CatalogClientProps) {
  const [minerals, setMinerals] = useState<MineralSearchResult[]>(initialMinerals)
  const [collectionMap, setCollectionMap] = useState<Record<string, string>>(initialCollectionMap)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSystem, setFilterSystem] = useState('')
  const [hardnessMin, setHardnessMin] = useState<number | ''>('')
  const [hardnessMax, setHardnessMax] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(totalInDb)
  const [offset, setOffset] = useState(24)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchParams = useSearchParams()

  // Mostrar feedback del flujo OAuth de Google Drive
  useEffect(() => {
    const success = searchParams.get('success')
    const error   = searchParams.get('error')
    if (success === 'google_connected') showToast('✅ Google Drive conectado correctamente', 'success')
    if (error === 'google_denied')      showToast('Google Drive: acceso denegado', 'error')
    if (error === 'google_csrf')        showToast('Error de seguridad en la conexión con Google', 'error')
    if (error?.startsWith('google_'))   showToast('Error al conectar Google Drive', 'error')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const supabase = createClient()

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  /** Ejecuta búsqueda usando RPC (Server-side full-text search) */
  const executeSearch = useCallback(async (params: {
    query?: string; cls?: string; system?: string; hMin?: number | ''; hMax?: number | ''; offsetVal?: number
  }) => {
    const isLoadMore = params.offsetVal !== undefined && params.offsetVal > 0
    if (isLoadMore) setLoadingMore(true); else setLoading(true)

    try {
      // @ts-ignore
      const { data, error } = await supabase.rpc('search_minerals', {
        search_query:   params.query?.trim() || null,
        filter_class:   params.cls || null,
        filter_system:  params.system || null,
        hardness_min_v: params.hMin === '' ? null : params.hMin,
        hardness_max_v: params.hMax === '' ? null : params.hMax,
        page_size:      PAGE_SIZE,
        page_offset:    params.offsetVal ?? 0
      })

      if (error) throw error

      const results = (data as any[]) ?? []
      const totalCountFromRpc = results[0]?.total_count ? parseInt(results[0].total_count) : 0

      if (isLoadMore) {
        setMinerals(prev => [...prev, ...results])
        setOffset(params.offsetVal! + PAGE_SIZE)
      } else {
        setMinerals(results)
        setTotalCount(totalCountFromRpc)
        setOffset(PAGE_SIZE)
      }
    } catch (err) {
      console.error('[Search RPC Error]:', err)
      showToast('Error en la búsqueda avanzada', 'error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [supabase])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      executeSearch({ query: value, cls: filterClass, system: filterSystem, hMin: hardnessMin, hMax: hardnessMax })
    }, 400)
  }

  const handleFilterChange = (type: string, value: any) => {
    let newHMin = hardnessMin
    let newHMax = hardnessMax
    let newCls = filterClass
    let newSys = filterSystem

    if (type === 'class') { setFilterClass(value); newCls = value }
    if (type === 'system') { setFilterSystem(value); newSys = value }
    if (type === 'hMin') { setHardnessMin(value); newHMin = value }
    if (type === 'hMax') { setHardnessMax(value); newHMax = value }

    startTransition(() => {
      executeSearch({ query: search, cls: newCls, system: newSys, hMin: newHMin, hMax: newHMax })
    })
  }

  const handleLoadMore = () => {
    executeSearch({ query: search, cls: filterClass, system: filterSystem, hMin: hardnessMin, hMax: hardnessMax, offsetVal: offset })
  }

  /** Añade/quita un mineral de la colección */
  const toggleCollection = async (mineralId: string) => {
    const isOwned = collectionMap[mineralId] === 'owned'
    try {
      if (isOwned) {
        const { error } = await supabase
          .from('user_collection')
          .delete()
          .eq('user_id', userId)
          .eq('mineral_id', mineralId)
        if (error) throw error
        setCollectionMap(prev => { const next = { ...prev }; delete next[mineralId]; return next })
        showToast('Eliminado de tu colección', 'info')
      } else {
        const { error } = await supabase
          .from('user_collection')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert({ user_id: userId, mineral_id: mineralId, status: 'owned' } as any, { onConflict: 'user_id,mineral_id' })
        if (error) throw error
        setCollectionMap(prev => ({ ...prev, [mineralId]: 'owned' }))
        showToast('¡Añadido a tu colección! 💎', 'success')
      }
    } catch (err) {
      console.error('[Collection Toggle Error]:', err)
      showToast('Error al actualizar la colección', 'error')
    }
  }

  const ownedCount = Object.values(collectionMap).filter(s => s === 'owned').length

  return (
    <div style={{ minHeight: '100dvh', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.375rem' }}>
              Catálogo de <span className="gradient-text">Minerales</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {totalCount.toLocaleString()} minerales · {' '}
              <span style={{ color: 'var(--accent-emerald)' }}>{ownedCount} en tu colección</span>
            </p>
          </div>
          <Link href="/collection">
            <button className="btn btn-secondary">
              💎 Mi Colección ({ownedCount})
            </button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          
          {/* Search */}
          <div className="form-group">
            <label htmlFor="catalog-search">Búsqueda rápida</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '1rem', pointerEvents: 'none',
              }}>🔍</span>
              <input
                id="catalog-search"
                type="search"
                className="input input-search"
                placeholder="Nombre, fórmula, clase..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Class */}
          <div className="form-group">
            <label htmlFor="filter-class">Clase Mineral</label>
            <select
              id="filter-class"
              className="input"
              value={filterClass}
              onChange={e => handleFilterChange('class', e.target.value)}>
              <option value="">Todas las clases</option>
              {MINERAL_CLASSES.map(cls => (
                <option key={cls} value={cls}>{MINERAL_CLASS_LABELS[cls] ?? cls}</option>
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
              onChange={e => handleFilterChange('system', e.target.value)}>
              <option value="">Todos los sistemas</option>
              {CRYSTAL_SYSTEMS.map(sys => (
                <option key={sys} value={sys}>{CRYSTAL_SYSTEM_LABELS[sys] ?? sys}</option>
              ))}
            </select>
          </div>

          {/* Hardness */}
          <div className="form-group">
            <label>Dureza Mohs</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                className="input"
                style={{ padding: '0.5rem' }}
                placeholder="Min"
                value={hardnessMin}
                onChange={e => handleFilterChange('hMin', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                className="input"
                style={{ padding: '0.5rem' }}
                placeholder="Max"
                value={hardnessMax}
                onChange={e => handleFilterChange('hMax', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>
          </div>

        </div>

        {/* Clear & Stats */}
        <div style={{ 
          marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Mostrando <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{minerals.length}</span> de {totalCount.toLocaleString()} resultados
          </div>
          {(search || filterClass || filterSystem || hardnessMin !== '' || hardnessMax !== '') && (
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setSearch(''); setFilterClass(''); setFilterSystem(''); setHardnessMin(''); setHardnessMax('')
              executeSearch({ query: '', cls: '', system: '', hMin: '', hMax: '' })
            }}>✕ Limpiar filtros</button>
          )}
        </div>
      </div>

      {/* Minerals grid */}
      {loading || isPending ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : minerals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>Sin resultados</h3>
          <p>Prueba con otros filtros o términos de búsqueda.</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            {minerals.map(mineral => (
              <MineralCard
                key={mineral.id}
                mineral={mineral}
                isOwned={collectionMap[mineral.id] === 'owned'}
                onToggleCollection={toggleCollection}
              />
            ))}
          </div>

          {minerals.length < totalCount && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-lg" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? <><span className="spinner" /> Cargando...</> : `Cargar más (${totalCount - minerals.length} restantes)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}
