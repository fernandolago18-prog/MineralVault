import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { mergeMineralWithParent } from '@/types/database'
import CollectionClient from './CollectionClient'

export const metadata: Metadata = {
  title: 'Mi Colección',
  description: 'Todos los minerales de tu colección personal.',
}

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Cargar colección del usuario y perfil en PARALELO para acelerar la navegación
  const [collectionRes, profileRes] = await Promise.all([
    (supabase
      .from('user_collection') as any)
      .select(`
        id, status, acquired_at, origin, quality,
        price_eur, primary_photo_url, created_at, specimen_label,
        mineral:mineral_id (
          id, name, name_es, chemical_formula,
          hardness_min, hardness_max, crystal_system,
          mineral_class, thumbnail_url, color, parent_mindat_id, streak, is_rock
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['owned', 'wanted'])
      .order('created_at', { ascending: false }),
    (supabase
      .from('user_profiles') as any)
      .select('google_drive_connected')
      .eq('id', user.id)
      .single(),
  ])

  if (collectionRes.error) console.error('[Collection Load Error]:', collectionRes.error.message)

  const items = (collectionRes.data as any[]) ?? []

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

  const driveConnected = (profileRes.data as any)?.google_drive_connected ?? false

  return <CollectionClient items={items} driveConnected={driveConnected} userId={user.id} />
}
