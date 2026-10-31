import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import MineralDetailClient from './MineralDetailClient'
import { mergeMineralWithParent } from '@/types/database'

interface Props {
  params: Promise<{ mineralId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mineralId } = await params
  const supabase = await createClient()
  
  let query = supabase.from('minerals').select('name, name_es, description, mineral_class')
  
  const isNumeric = /^\d+$/.test(mineralId)
  if (isNumeric) {
    query = query.eq('mindat_id', parseInt(mineralId))
  } else {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mineralId)
    if (!isUuid) return { title: 'Mineral no encontrado' }
    query = query.eq('id', mineralId)
  }

  const { data: mineral } = await (query.single() as any)

  if (!mineral) return { title: 'Mineral no encontrado' }

  return {
    title: mineral.name_es ? `${mineral.name} (${mineral.name_es})` : mineral.name,
    description: mineral.description?.slice(0, 160) ?? `Información completa sobre el mineral ${mineral.name}.`,
  }
}

/**
 * Página de detalle de mineral — Server Component.
 * Carga todos los datos del mineral y el estado en la colección del usuario.
 */
export default async function MineralDetailPage({ params }: Props) {
  const { mineralId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Datos completos del mineral (soportando ID de base de datos o Mindat ID)
  console.log('--- MINERAL DETAIL PAGE REQUEST ---', { 
    rawMineralId: mineralId, 
    isNumeric: /^\d+$/.test(mineralId), 
    isUuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mineralId) 
  })
  let query = supabase.from('minerals').select('*')
  
  const isNumeric = /^\d+$/.test(mineralId)
  if (isNumeric) {
    query = query.eq('mindat_id', parseInt(mineralId))
  } else {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mineralId)
    if (!isUuid) {
      notFound()
    }
    query = query.eq('id', mineralId)
  }

  const { data: mineral, error } = await (query.single() as any)

  if (error) {
    console.error('[Mineral Detail Database Error]:', error.message, error.code)
    if (error.code === 'PGRST116') {
      notFound()
    }
    throw new Error(`Error al cargar el mineral: ${error.message}`)
  }

  if (!mineral) {
    notFound()
  }

  const realMineralId = mineral.id

  // Estado en la colección del usuario (múltiples ejemplares)
  const { data: collectionItems } = await (supabase
    .from('user_collection')
    .select('*, specimen_photos(*)')
    .eq('user_id', user.id)
    .eq('mineral_id', realMineralId) as any)

  // Obtener variedades y/o mineral principal (padre)
  let varieties: any[] = []
  let parentMineral: any = null

  if (mineral.parent_mindat_id === null) {
    if (mineral.mindat_id !== null) {
      const { data: vars } = await supabase
        .from('minerals')
        .select('id, name, name_es, chemical_formula, thumbnail_url')
        .eq('parent_mindat_id', mineral.mindat_id)
        .order('name_es', { ascending: true })
      varieties = vars ?? []
    }
  } else {
    const [parentRes, siblingsRes] = await Promise.all([
      supabase
        .from('minerals')
        .select('*')
        .eq('mindat_id', mineral.parent_mindat_id)
        .maybeSingle(),
      supabase
        .from('minerals')
        .select('id, name, name_es, chemical_formula, thumbnail_url')
        .eq('parent_mindat_id', mineral.parent_mindat_id)
        .neq('id', mineral.id)
        .order('name_es', { ascending: true })
    ])
    parentMineral = parentRes.data ?? null
    varieties = siblingsRes.data ?? []
  }

  // Fusionar propiedades del padre si es una variedad, y enriquecer con hábitos por defecto
  const displayMineral = mergeMineralWithParent(mineral, parentMineral)

  return (
    <MineralDetailClient
      mineral={displayMineral}
      collectionItems={collectionItems ?? []}
      userId={user.id}
      varieties={varieties}
      parentMineral={parentMineral}
    />
  )
}
