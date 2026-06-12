/**
 * app/(app)/collection/[id]/page.tsx
 * Página de detalle del espécimen — Server Component.
 * Carga el item de colección, el mineral asociado y las fotos.
 */

import { createClient }  from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Metadata }  from 'next'
import SpecimenDetailClient from './SpecimenDetailClient'
import type { CollectionItem, Mineral, SpecimenPhoto } from '@/types/database'
import { mergeMineralWithParent } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid) return { title: 'Espécimen no encontrado' }

  const supabase = await createClient()

  const { data } = await supabase
    .from('user_collection')
    .select('mineral:mineral_id(name, name_es)')
    .eq('id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mineral = (data as any)?.mineral as { name?: string; name_es?: string } | null
  const name = mineral?.name ?? 'Espécimen'

  return {
    title: `Mi ${name} — Colección`,
    description: `Detalle del ejemplar de ${name} en tu colección personal de Minerales de la Tierra.`,
  }
}

export default async function SpecimenDetailPage({ params }: Props) {
  const { id } = await params
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid) {
    notFound()
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Cargar colección + mineral + fotos en paralelo para máximo rendimiento
  const [collectionRes, photosRes, profileRes] = await Promise.all([
    supabase
      .from('user_collection')
      .select(`
        id, user_id, mineral_id, status, acquired_at, origin,
        notes, quality, dimensions, weight_g, price_eur,
        drive_folder_id, primary_photo_url, created_at, updated_at,
        mineral:mineral_id (
          id, name, name_es, chemical_formula,
          hardness_min, hardness_max, crystal_system,
          mineral_class, thumbnail_url, color, localities,
          mindat_url, description, parent_mindat_id, is_rock
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)  // Garantía explícita — RLS también lo impone
      .single(),

    supabase
      .from('specimen_photos')
      .select('*')
      .eq('collection_id', id)
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),

    supabase
      .from('user_profiles')
      .select('google_drive_connected')
      .eq('id', user.id)
      .single(),
  ])

  if (collectionRes.error || !collectionRes.data) {
    console.error('[Specimen Detail Error]:', collectionRes.error?.message)
    notFound()
  }

  const item    = (collectionRes as any).data as CollectionItem & { mineral: Mineral }

  // Fusionar propiedades de variedad y aplicar hábitos por defecto
  if (item && item.mineral) {
    let parentMineral = null
    if (item.mineral.parent_mindat_id !== null) {
      const { data: parent } = await supabase
        .from('minerals')
        .select('*')
        .eq('mindat_id', item.mineral.parent_mindat_id)
        .maybeSingle()
      parentMineral = parent
    }
    item.mineral = mergeMineralWithParent(item.mineral, parentMineral)
  }

  const photos  = ((photosRes as any).data ?? []) as SpecimenPhoto[]
  const driveConnected = (profileRes as any).data?.google_drive_connected ?? false

  return (
    <SpecimenDetailClient
      item={item}
      initialPhotos={photos}
      driveConnected={driveConnected}
      userId={user.id}
    />
  )
}
