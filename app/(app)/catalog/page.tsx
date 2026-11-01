import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CatalogClient from './CatalogClient'
import { mergeMineralWithParent } from '@/types/database'
import { getDriveImageUrl } from '@/lib/images'

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

  // Carga inicial de minerales, colección y estadísticas en PARALELO para máxima velocidad de navegación
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mineralsRes, collectionRes, countRes] = await Promise.all([
    (supabase as any).rpc('search_minerals', {
      search_query:   null,
      filter_class:   null,
      filter_system:  null,
      hardness_min_v: null,
      hardness_max_v: null,
      page_size:      24,
      page_offset:    0,
    }),
    (supabase
      .from('user_collection')
      .select('mineral_id, status, primary_photo_url, specimen_photos(drive_thumb_url, drive_file_id, is_primary)')
      .eq('user_id', user.id) as any),
    supabase
      .from('minerals')
      .select('id', { count: 'exact', head: true }),
  ])

  const minerals = mineralsRes.data
  const error = mineralsRes.error
  if (error) {
    console.error('[Catalog Load Error]:', error.message)
  }

  const collection = collectionRes.data
  const totalMinerals = countRes.count

  const collectionMap = new Map()
  const collectionCounts: Record<string, number> = {}
  const collectionPhotos: Record<string, string> = {}
  
  if (collection) {
    (collection as any[]).forEach((item: any) => {
      if (item.status === 'owned') {
        collectionCounts[item.mineral_id] = (collectionCounts[item.mineral_id] ?? 0) + 1
        if (!collectionMap.has(item.mineral_id)) {
          collectionMap.set(item.mineral_id, 'owned')
        }
        // Asignar la mejor foto guardada del ejemplar para la portada del mineral
        if (!collectionPhotos[item.mineral_id]) {
          const photos = item.specimen_photos || []
          const primaryPhoto = photos.find((p: any) => p.is_primary) || photos[0]
          const photoUrlOrId = primaryPhoto?.drive_thumb_url || primaryPhoto?.drive_file_id || item.primary_photo_url
          if (photoUrlOrId) {
            collectionPhotos[item.mineral_id] = getDriveImageUrl(photoUrlOrId, 400)
          }
        }
      } else if (item.status === 'wanted') {
        collectionMap.set(item.mineral_id, 'wanted')
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

  return (
    <CatalogClient
      initialMinerals={initialMinerals}
      collectionMap={Object.fromEntries(collectionMap)}
      collectionCounts={collectionCounts}
      collectionPhotos={collectionPhotos}
      totalInDb={totalMinerals ?? 0}
      userId={user.id}
    />
  )
}
