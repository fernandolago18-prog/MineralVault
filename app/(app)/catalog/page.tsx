import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CatalogClient from './CatalogClient'

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

  const collectionMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((collection ?? []) as any[]).map((item: any) => [item.mineral_id as string, item.status as string])
  )

  // Estadísticas para el header
  const { count: totalMinerals } = await supabase
    .from('minerals')
    .select('id', { count: 'exact', head: true })

  return (
    <CatalogClient
      initialMinerals={minerals ?? []}
      collectionMap={Object.fromEntries(collectionMap)}
      totalInDb={totalMinerals ?? 0}
      userId={user.id}
    />
  )
}
