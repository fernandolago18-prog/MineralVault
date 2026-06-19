'use client'

import { useState, useCallback, useRef, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { MineralSearchResult, Mineral } from '@/types/database'
import { CRYSTAL_SYSTEM_LABELS, MINERAL_CLASS_LABELS, mergeMineralWithParent } from '@/types/database'
import MineralCard from '@/components/catalog/MineralCard'

interface CatalogClientProps {
  initialMinerals: MineralSearchResult[]
  collectionMap: Record<string, string>
  collectionCounts: Record<string, number>
  totalInDb: number
  userId: string
}

const CRYSTAL_SYSTEMS = ['Cubic', 'Hexagonal', 'Tetragonal', 'Orthorhombic', 'Monoclinic', 'Triclinic', 'Trigonal']
const MINERAL_CLASSES = Object.keys(MINERAL_CLASS_LABELS)
const PAGE_SIZE = 24

export default function CatalogClient({
  initialMinerals,
  collectionMap: initialCollectionMap,
  collectionCounts: initialCollectionCounts = {},
  totalInDb,
  userId,
}: CatalogClientProps) {
  const [minerals, setMinerals] = useState<MineralSearchResult[]>(initialMinerals)
  const [collectionMap, setCollectionMap] = useState<Record<string, string>>(initialCollectionMap)
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>(initialCollectionCounts)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSystem, setFilterSystem] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStreak, setFilterStreak] = useState('')
  const [hardnessMin, setHardnessMin] = useState<number | ''>('')
  const [hardnessMax, setHardnessMax] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(totalInDb)
  const [offset, setOffset] = useState(24)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [varietiesMap, setVarietiesMap] = useState<Record<number, Mineral[]>>({})
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchParams = useSearchParams()

  const supabase = createClient()

  const fetchVarieties = useCallback(async (parentIds: number[]) => {
    if (parentIds.length === 0) return
    try {
      const { data, error } = await supabase
        .from('minerals')
        .select('*')
        .in('parent_mindat_id', parentIds)
      
      if (error) throw error

      if (data) {
        setVarietiesMap(prev => {
          const next = { ...prev }
          data.forEach((v: any) => {
            const pid = v.parent_mindat_id
            if (pid != null) {
              if (!next[pid]) next[pid] = []
              if (!next[pid].some((m: any) => m.id === v.id)) {
                next[pid].push(v)
              }
            }
          })
          return next
        })
      }
    } catch (err) {
      console.error('[Fetch Varieties Error]:', err)
    }
  }, [supabase])

  // Cargar variedades de los minerales iniciales al montar el componente
  useEffect(() => {
    if (initialMinerals.length > 0) {
      const parentIds = initialMinerals.map(m => m.mindat_id).filter((id): id is number => id !== null)
      fetchVarieties(parentIds)
    }
  }, [initialMinerals, fetchVarieties])

  // Mostrar feedback del flujo OAuth de Google Drive
  useEffect(() => {
    const success = searchParams.get('success')
    const error   = searchParams.get('error')
    if (success === 'google_connected') showToast('Google Drive conectado correctamente', 'success')
    if (error === 'google_denied')      showToast('Google Drive: acceso denegado', 'error')
    if (error === 'google_csrf')        showToast('Error de seguridad en la conexión con Google', 'error')
    if (error?.startsWith('google_'))   showToast('Error al conectar Google Drive', 'error')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const executeSearch = useCallback(async (params: {
    query?: string; cls?: string; system?: string; hMin?: number | ''; hMax?: number | ''; offsetVal?: number; typeVal?: string; streakVal?: string
  }) => {
    const isLoadMore = params.offsetVal !== undefined && params.offsetVal > 0
    if (isLoadMore) setLoadingMore(true); else setLoading(true)

    try {
      // @ts-ignore
      const { data, error } = await supabase.rpc('search_minerals', {
        search_query:   (params.query && params.query.trim().length > 0) ? params.query.trim() : null,
        filter_class:   params.cls || null,
        filter_system:  params.system || null,
        hardness_min_v: params.hMin === '' ? null : params.hMin,
        hardness_max_v: params.hMax === '' ? null : params.hMax,
        page_size:      PAGE_SIZE,
        page_offset:    params.offsetVal ?? 0,
        filter_type:    params.typeVal !== undefined ? params.typeVal : (filterType || null),
        filter_streak:  params.streakVal !== undefined ? params.streakVal : (filterStreak || null)
      })

      if (error) throw error

      let results = (data as any[]) ?? []
      let totalCountFromRpc = results[0]?.total_count ? parseInt(results[0].total_count) : 0



      // Fusionar propiedades de padres si hay variedades en los resultados
      const parentMindatIds = results
        .map(r => r.parent_mindat_id)
        .filter((id): id is number => id !== null && id !== undefined)

      if (parentMindatIds.length > 0) {
        const { data: parentsData } = await supabase
          .from('minerals')
          .select('*')
          .in('mindat_id', parentMindatIds)

        if (parentsData) {
          const parentsMap = new Map((parentsData as any[]).map(p => [p.mindat_id, p]))
          results = results.map(item => {
            if (item.parent_mindat_id !== null && item.parent_mindat_id !== undefined) {
              const parent = parentsMap.get(item.parent_mindat_id)
              if (parent) {
                return mergeMineralWithParent(item, parent)
              }
            }
            // También enriquecer padres con fallback habits si es necesario
            return mergeMineralWithParent(item, null)
          })
        }
      } else {
        // Enriquecer padres con fallback habits (incluso si no hay variedades)
        results = results.map(item => mergeMineralWithParent(item, null))
      }

      // Cargar variedades de los resultados de búsqueda para los dropdowns
      const parentIds = results.map(m => m.mindat_id).filter((id): id is number => id !== null)
      if (parentIds.length > 0) {
        await fetchVarieties(parentIds)
      }

      if (isLoadMore) {
        setMinerals(prev => {
          // Filtrar duplicados al paginar
          const next = [...prev]
          results.forEach(r => {
            if (!next.some(n => n.id === r.id)) next.push(r)
          })
          return next
        })
        setOffset(params.offsetVal! + PAGE_SIZE)
      } else {
        setMinerals(results)
        setTotalCount(totalCountFromRpc || results.length)
        setOffset(PAGE_SIZE)
      }
    } catch (err) {
      console.error('[Search RPC Error]:', err)
      showToast('Error en la búsqueda avanzada', 'error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [supabase, fetchVarieties])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      executeSearch({ query: value, cls: filterClass, system: filterSystem, hMin: hardnessMin, hMax: hardnessMax, typeVal: filterType, streakVal: filterStreak })
    }, 500)  // 500ms debounce
  }

  const handleFilterChange = (type: string, value: any) => {
    let newHMin = hardnessMin
    let newHMax = hardnessMax
    let newCls = filterClass
    let newSys = filterSystem
    let newType = filterType
    let newStreak = filterStreak

    if (type === 'class') { setFilterClass(value); newCls = value }
    if (type === 'system') { setFilterSystem(value); newSys = value }
    if (type === 'hMin') { setHardnessMin(value); newHMin = value }
    if (type === 'hMax') { setHardnessMax(value); newHMax = value }
    if (type === 'type') { setFilterType(value); newType = value }
    if (type === 'streak') { setFilterStreak(value); newStreak = value }

    startTransition(() => {
      executeSearch({ query: search, cls: newCls, system: newSys, hMin: newHMin, hMax: newHMax, typeVal: newType, streakVal: newStreak })
    })
  }

  const handleLoadMore = () => {
    executeSearch({ query: search, cls: filterClass, system: filterSystem, hMin: hardnessMin, hMax: hardnessMax, offsetVal: offset, typeVal: filterType, streakVal: filterStreak })
  }

  /** Añade/quita un mineral de la colección (owned o wanted) */
  const toggleCollection = async (mineralId: string, status: 'owned' | 'wanted' = 'owned') => {
    const currentStatus = collectionMap[mineralId]
    
    try {
      if (status === 'owned') {
        // Añadir otro ejemplar (se permite duplicados)
        const { error } = await (supabase
          .from('user_collection') as any)
          .insert({ user_id: userId, mineral_id: mineralId, status: 'owned' })

        if (error) throw error
        setCollectionMap(prev => ({ ...prev, [mineralId]: 'owned' }))
        setCollectionCounts(prev => ({ ...prev, [mineralId]: (prev[mineralId] ?? 0) + 1 }))
        showToast('¡Ejemplar añadido a tu colección!', 'success')
      } else {
        // Toggle wanted (lista de deseos)
        if (currentStatus === 'wanted') {
          // Ya era wanted, lo quitamos
          const { error } = await (supabase
            .from('user_collection') as any)
            .delete()
            .eq('user_id', userId)
            .eq('mineral_id', mineralId)
            .eq('status', 'wanted')
          
          if (error) throw error
          setCollectionMap(prev => { const next = { ...prev }; delete next[mineralId]; return next })
          showToast('Quitado de tu lista de deseos', 'info')
        } else {
          // Si era owned, pedir confirmación antes de borrar los ejemplares existentes
          if (currentStatus === 'owned') {
            if (!confirm('Este mineral ya tiene ejemplares en tu colección. Si lo añades a la lista de deseos, se eliminarán todos tus ejemplares existentes. ¿Deseas continuar?')) {
              return
            }
            // Borrar los ejemplares existentes
            const { error: delError } = await (supabase
              .from('user_collection') as any)
              .delete()
              .eq('user_id', userId)
              .eq('mineral_id', mineralId)
            if (delError) throw delError
          }

          // Insertar wanted
          const { error } = await (supabase
            .from('user_collection') as any)
            .insert({ user_id: userId, mineral_id: mineralId, status: 'wanted' })

          if (error) throw error
          setCollectionMap(prev => ({ ...prev, [mineralId]: 'wanted' }))
          setCollectionCounts(prev => { const next = { ...prev }; delete next[mineralId]; return next })
          showToast('Añadido a tu lista de deseos', 'success')
        }
      }
    } catch (err) {
      console.error('[Collection Toggle Error]:', err)
      showToast('Error al actualizar la colección', 'error')
    }
  }

  const ownedCount = Object.values(collectionMap).filter(s => s === 'owned').length
  const wantedCount = Object.values(collectionMap).filter(s => s === 'wanted').length
  const completionPercentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  return (
    <div className="catalog-container">
      {/* Header */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>Minerales</span> de la Tierra
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', 
              maxWidth: '600px', lineHeight: '1.5' 
            }}>
              Un compendio exhaustivo de especies minerales y variedades cristalográficas. 
              Documente sus hallazgos para completar el archivo.
            </p>
            
            {/* Progress Bar (Museum Style) */}
            <div style={{ maxWidth: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Archivo Completado</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{ownedCount} / {totalCount.toLocaleString()}</span>
              </div>
              <div style={{ 
                height: '4px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${completionPercentage}%`, height: '100%', background: 'var(--accent-gold)',
                  transition: 'width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }} />
              </div>
            </div>
          </div>
          
          <Link href="/collection">
            <button className="btn btn-primary btn-lg">
              Mi Vitrina ({ownedCount})
            </button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          
          {/* Search & Type (Unified) */}
          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
            <label htmlFor="catalog-search">Búsqueda rápida</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                <span style={{
                  position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '1rem', pointerEvents: 'none',
                }}></span>
                <input
                  id="catalog-search"
                  type="search"
                  className="input input-search"
                  placeholder="Nombre, fórmula, clase..."
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button"
                  className={`btn ${filterType === '' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleFilterChange('type', '')}
                >Todos</button>
                <button 
                  type="button"
                  className={`btn ${filterType === 'mineral' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleFilterChange('type', 'mineral')}
                >Minerales</button>
                <button 
                  type="button"
                  className={`btn ${filterType === 'rock' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleFilterChange('type', 'rock')}
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
              onChange={e => handleFilterChange('streak', e.target.value)}>
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
                placeholder="Mín"
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
                placeholder="Máx"
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
          <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--border-strong)' }}>◆</div>
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
                varieties={mineral.mindat_id ? (varietiesMap[mineral.mindat_id] || []) : []}
                collectionMap={collectionMap}
                collectionCounts={collectionCounts}
                onToggleCollection={toggleCollection}
                searchQuery={search}
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
