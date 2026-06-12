import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { mergeMineralWithParent, getStreakColor } from '@/types/database'

export const metadata: Metadata = {
  title: 'Mi Colección',
  description: 'Todos los minerales de tu colección personal.',
}

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: collection, error } = await (supabase
    .from('user_collection') as any)
    .select(`
      id, status, acquired_at, origin, quality,
      price_eur, primary_photo_url, created_at,
      mineral:mineral_id (
        id, name, name_es, chemical_formula,
        hardness_min, hardness_max, crystal_system,
        mineral_class, thumbnail_url, color, parent_mindat_id, streak, is_rock
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'owned')
    .order('created_at', { ascending: false })

  if (error) console.error('[Collection Load Error]:', error.message)

  const items = (collection as any[]) ?? []

  // Obtener los parent_mindat_id únicos para las variedades en la colección
  const parentMindatIds = items
    .map(i => i.mineral?.parent_mindat_id)
    .filter((id): id is number => id !== null && id !== undefined)

  const parentsMap = new Map()
  if (parentMindatIds.length > 0) {
    const { data: parents } = await supabase
      .from('minerals')
      .select('*')
      .in('mindat_id', parentMindatIds)

    if (parents) {
      (parents as any[]).forEach((p: any) => parentsMap.set(p.mindat_id, p))
    }
  }

  // Siempre ejecutar mergeMineralWithParent para aplicar fallbacks e herencia
  items.forEach(i => {
    if (i.mineral) {
      const parent = i.mineral.parent_mindat_id ? parentsMap.get(i.mineral.parent_mindat_id) : null
      i.mineral = mergeMineralWithParent(i.mineral, parent)
    }
  })

  const totalValue = items.reduce((sum: number, i: any) => sum + (i.price_eur as number ?? 0), 0)

  // Distribución por clase
  const byClass: Record<string, number> = {}
  items.forEach(i => {
    const cls = (i.mineral as { mineral_class?: string | null })?.mineral_class ?? 'Sin clase'
    byClass[cls] = (byClass[cls] ?? 0) + 1
  })

  const { data: profile } = await (supabase
    .from('user_profiles') as any)
    .select('google_drive_connected')
    .eq('id', user.id)
    .single()

  const driveConnected = profile?.google_drive_connected ?? false

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
          { label: 'Total de minerales', value: items.length, icon: '◆', color: 'var(--accent-purple)' },
          { label: 'Clases distintas', value: Object.keys(byClass).length, icon: '■', color: 'var(--accent-cyan)' },
          { label: 'Valor estimado', value: `€${totalValue.toFixed(0)}`, icon: '€', color: 'var(--accent-amber)' },
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

      {/* Collection grid */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--border-strong)' }}>◆</div>
          <h3 style={{ marginBottom: '0.75rem' }}>Tu colección está vacía</h3>
          <p style={{ marginBottom: '1.5rem' }}>Visita el catálogo y añade tus primeros minerales.</p>
          <Link href="/catalog">
            <button className="btn btn-primary btn-lg">Explorar el Catálogo</button>
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {items.map(item => {
            const mineral = item.mineral as {
              id: string; name: string; name_es?: string | null; chemical_formula?: string | null;
              hardness_min?: number | null; crystal_system?: string | null; mineral_class?: string | null;
              thumbnail_url?: string | null; streak?: string | null; is_rock?: boolean | null;
            } | null
            if (!mineral) return null

            const streakColor = getStreakColor(mineral.streak)

            return (
              <Link key={item.id} href={`/collection/${item.id}`} style={{ textDecoration: 'none' }}>
                <div className={`mineral-card in-collection ${mineral.is_rock ? 'is-rock-card' : ''}`} style={{ cursor: 'pointer', position: 'relative' }}>
                  {streakColor && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: streakColor.hex,
                        borderRight: streakColor.border || 'none',
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
                      <img src={item.primary_photo_url} alt={mineral.name}
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
                    <h5 style={{ marginBottom: '0.125rem' }}>{mineral.name_es || mineral.name}</h5>
                    {mineral.name_es && mineral.name_es !== mineral.name && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        {mineral.name}
                      </p>
                    )}
                    {mineral.chemical_formula && (
                      <code 
                        style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}
                        dangerouslySetInnerHTML={{ __html: mineral.chemical_formula }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.625rem', flexWrap: 'wrap' }}>
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
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
