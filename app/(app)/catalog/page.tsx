import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CatalogClient from './CatalogClient'
import { mergeMineralWithParent } from '@/types/database'

export const metadata: Metadata = {
  title: 'Catálogo de Minerales',
  description: 'Explora la base de datos completa de minerales con datos de Mindat.org. Filtra por sistema cristalino, clase mineral y dureza Mohs.',
}

/**
 * Página del catálogo — Server Component.
 * Carga los datos iniciales de minerales y el estado de la colección del usuario.
 */
export default async function CatalogPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Carga inicial de minerales (primera página) — solo minerales padre (sin variedades)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: minerals, error } = await (supabase as any).rpc('search_minerals', {
    search_query:   null,
    filter_class:   null,
    filter_system:  null,
    hardness_min_v: null,
    hardness_max_v: null,
    page_size:      24,
    page_offset:    0,
  })

  if (error) {
    console.error('[Catalog Load Error]:', error.message)
  }

  // IDs de minerales que el usuario ya tiene en su colección
  const { data: collection } = await supabase
    .from('user_collection')
    .select('mineral_id, status')
    .eq('user_id', user.id)

  const collectionMap = new Map()
  const collectionCounts: Record<string, number> = {}
  
  if (collection) {
    (collection as any[]).forEach((item: any) => {
      collectionMap.set(item.mineral_id, item.status)
      if (item.status === 'owned') {
        collectionCounts[item.mineral_id] = (collectionCounts[item.mineral_id] ?? 0) + 1
      }
    })
  }

  let initialMinerals = (minerals as any[]) ?? []

  // Fusionar con padres para heredar propiedades (como color de raya)
  const parentMindatIds = initialMinerals
    .map(m => m.parent_mindat_id)
    .filter((id): id is number => id !== null && id !== undefined)

  if (parentMindatIds.length > 0) {
    const { data: parentsData } = await supabase
      .from('minerals')
      .select('*')
      .in('mindat_id', parentMindatIds)

    if (parentsData) {
      const parentsMap = new Map((parentsData as any[]).map(p => [p.mindat_id, p]))
      initialMinerals = initialMinerals.map(m => {
        if (m.parent_mindat_id) {
          const parent = parentsMap.get(m.parent_mindat_id)
          return mergeMineralWithParent(m, parent ?? null)
        }
        return mergeMineralWithParent(m, null)
      })
    }
  } else {
    initialMinerals = initialMinerals.map(m => mergeMineralWithParent(m, null))
  }

  // Estadísticas para el header
  const { count: totalMinerals } = await supabase
    .from('minerals')
    .select('id', { count: 'exact', head: true })

  return (
    <CatalogClient
      initialMinerals={initialMinerals}
      collectionMap={Object.fromEntries(collectionMap)}
      collectionCounts={collectionCounts}
      totalInDb={totalMinerals ?? 0}
      userId={user.id}
    />
  )
}
