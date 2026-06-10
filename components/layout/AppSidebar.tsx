'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AppSidebarProps {
  userId: string
  displayName: string
  driveConnected: boolean
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/catalog',    icon: '📖', label: 'Minerales', description: 'Enciclopedia completa' },
  { href: '/collection', icon: '💎', label: 'Mi Colección', description: 'Mis ejemplares' },
  { href: '/settings',   icon: '⚙️', label: 'Ajustes', description: 'Perfil y conexión' },
]

export default function AppSidebar({ userId, displayName, driveConnected, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  // Estados para el Buscador/Catálogo Desplegable de la barra lateral
  const [isCatalogOpen, setIsCatalogOpen]   = useState(false)
  const [searchTerm, setSearchTerm]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [streakFilter, setStreakFilter]     = useState('')
  const [debouncedStreak, setDebouncedStreak] = useState('')
  const [hardnessFilter, setHardnessFilter] = useState<number | ''>('')
  
  const [mineralsList, setMineralsList]     = useState<any[]>([])
  const [loadingList, setLoadingList]       = useState(false)
  const [listOffset, setListOffset]         = useState(0)
  const [hasMore, setHasMore]               = useState(true)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      console.error('[SignOut Error]:', err)
      setSigningOut(false)
    }
  }

  // Función de consulta de minerales (orden alfabético por defecto, soporta filtros)
  const fetchMinerals = useCallback(async (reset = false) => {
    setLoadingList(true)
    try {
      const currentOffset = reset ? 0 : listOffset
      let query = supabase
        .from('minerals')
        .select('id, name, name_es, chemical_formula, streak, hardness_min, hardness_max')
        .order('name_es', { ascending: true })
        .range(currentOffset, currentOffset + 29) // 30 por página

      // Aplicar filtro de búsqueda de nombre
      if (debouncedSearch.trim()) {
        const cleanSearch = debouncedSearch.trim()
        query = query.or(`name.ilike.%${cleanSearch}%,name_es.ilike.%${cleanSearch}%`)
      }

      // Aplicar filtro de raya
      if (debouncedStreak.trim()) {
        query = query.ilike('streak', `%${debouncedStreak.trim()}%`)
      }

      // Aplicar filtro de dureza
      if (hardnessFilter !== '') {
        query = query.gte('hardness_max', hardnessFilter).lte('hardness_min', hardnessFilter)
      }

      const { data, error } = await query
      if (error) throw error

      if (data) {
        setMineralsList(prev => reset ? data : [...prev, ...data])
        setListOffset(currentOffset + data.length)
        setHasMore(data.length === 30)
      }
    } catch (err) {
      console.error('[Sidebar Catalog Fetch Error]:', err)
    } finally {
      setLoadingList(false)
    }
  }, [supabase, listOffset, debouncedSearch, debouncedStreak, hardnessFilter])

  // Debouncing para búsqueda de nombre
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Debouncing para búsqueda de raya
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedStreak(streakFilter)
    }, 300)
    return () => clearTimeout(handler)
  }, [streakFilter])

  // Cargar/recargar lista al abrir el panel o cambiar filtros
  useEffect(() => {
    if (isCatalogOpen) {
      fetchMinerals(true)
    }
  }, [debouncedSearch, debouncedStreak, hardnessFilter, isCatalogOpen])

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo & Close (Mobile) */}
      <div style={{ padding: '2rem 1.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/catalog" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', textDecoration: 'none' }}>
          <div style={{
            width: '38px', height: '38px', flexShrink: 0,
            background: 'var(--bg-void)',
            border: '1.5px solid var(--accent-gold)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            color: 'var(--accent-gold)',
          }}>
            ◆
          </div>
          <div>
            <div style={{
              fontFamily: 'Fraunces, serif', fontWeight: 500,
              fontSize: '1.3rem', letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}>
              MineralVault
            </div>
            <div style={{ 
              fontSize: '0.6rem', color: 'var(--text-muted)', 
              textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '-2px' 
            }}>
              Arqueología Mineral
            </div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ width: '32px', height: '32px' }}>
            ✕
          </button>
        )}
      </div>

      <hr className="divider" style={{ margin: '0 1.5rem' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-xs)',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.description}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Acordeón Desplegable: Catálogo Rápido de Minerales */}
        <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setIsCatalogOpen(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'var(--bg-void)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'border-color var(--transition-fast)'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-gold)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📚 Catálogo Rápido
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isCatalogOpen ? '▲' : '▼'}</span>
          </button>

          {isCatalogOpen && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}>
              {/* Buscador de Nombre */}
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="text"
                  className="input input-sm"
                  placeholder="Nombre o palabra..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.5rem', background: 'var(--bg-void)', border: '1px solid var(--border-default)' }}
                />
              </div>

              {/* Filtro de Raya */}
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="text"
                  className="input input-sm"
                  placeholder="Color de raya (blanca, gris...)"
                  value={streakFilter}
                  onChange={e => setStreakFilter(e.target.value)}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.5rem', background: 'var(--bg-void)', border: '1px solid var(--border-default)' }}
                />
              </div>

              {/* Filtro de Dureza */}
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  className="input input-sm"
                  placeholder="Dureza Mohs..."
                  value={hardnessFilter}
                  onChange={e => setHardnessFilter(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.5rem', background: 'var(--bg-void)', border: '1px solid var(--border-default)' }}
                />
              </div>

              {/* Lista Scrollable */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}>
                {loadingList && mineralsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <span className="spinner" style={{ width: 12, height: 12, display: 'inline-block', marginRight: '0.5rem' }} />
                    Cargando...
                  </div>
                ) : mineralsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Sin resultados
                  </div>
                ) : (
                  <>
                    {mineralsList.map(min => (
                      <Link
                        key={min.id}
                        href={`/mineral/${min.id}`}
                        onClick={onClose}
                        style={{ textDecoration: 'none' }}
                      >
                        <div style={{
                          padding: '0.4rem 0.5rem',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-void)',
                          border: '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--bg-void)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                        }}>
                          <div style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {min.name_es || min.name}
                          </div>
                          {min.chemical_formula && (
                            <code 
                              style={{
                                fontSize: '0.62rem',
                                color: 'var(--accent-cyan)',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: '0.1rem'
                              }}
                              dangerouslySetInnerHTML={{ __html: min.chemical_formula }}
                            />
                          )}
                          {(min.streak || min.hardness_min) && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                              {min.hardness_min && <span>D: {min.hardness_min}</span>}
                              {min.streak && <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>R: {min.streak}</span>}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}

                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => fetchMinerals(false)}
                        disabled={loadingList}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', fontSize: '0.7rem', padding: '0.25rem', marginTop: '0.25rem' }}
                      >
                        {loadingList ? 'Cargando...' : 'Cargar más A-Z'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ margin: '0.5rem 0' }}>
          <hr className="divider" />
        </div>

        {/* Google Drive status */}
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '0.75rem' }}>{driveConnected ? '●' : '○'}</span>
            <div>
              <div style={{ 
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: driveConnected ? 'var(--accent-emerald)' : 'var(--accent-gold)' 
              }}>
                Respaldo en la Nube
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                {driveConnected ? 'Google Drive Conectado' : 'Sincronización Inactiva'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* User section */}
      <div style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          padding: '0.75rem',
          background: 'var(--bg-void)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
        }}>
          {/* Avatar */}
          <div style={{
            width: '34px', height: '34px', flexShrink: 0,
            background: 'var(--accent-gold)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontWeight: 600,
            fontSize: '0.9rem', color: 'var(--bg-void)',
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8rem',
              color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '0.02em'
            }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coleccionista</div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Cerrar sesión"
            className="btn btn-ghost btn-icon"
            style={{ width: '28px', height: '28px', flexShrink: 0 }}>
            {signingOut ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↩'}
          </button>
        </div>
      </div>
    </aside>
  )
}
