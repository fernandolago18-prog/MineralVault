import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import MineralDetailClient from './MineralDetailClient'

interface Props {
  params: Promise<{ mineralId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mineralId } = await params
  const supabase = await createClient()
  const { data: mineral } = await supabase
    .from('minerals')
    .select('name, name_es, description, mineral_class')
    .eq('id', mineralId)
    .single()

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

  // Datos completos del mineral
  const { data: mineral, error } = await supabase
    .from('minerals')
    .select('*')
    .eq('id', mineralId)
    .single()

  if (error || !mineral) {
    console.error('[Mineral Detail Error]:', error?.message)
    notFound()
  }

  // Estado en la colección del usuario
  const { data: collectionItem } = await supabase
    .from('user_collection')
    .select('*, specimen_photos(*)')
    .eq('user_id', user.id)
    .eq('mineral_id', mineralId)
    .single()

  return (
    <MineralDetailClient
      mineral={mineral}
      collectionItem={collectionItem ?? null}
      userId={user.id}
    />
  )
}
