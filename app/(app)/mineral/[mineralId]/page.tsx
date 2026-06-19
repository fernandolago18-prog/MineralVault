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

// Helper para traducir texto al vuelo usando la API gratuita de Google Translate
async function translateText(text: string): Promise<string> {
  if (!text) return ''
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`)
    const json = await resp.json()
    if (json && json[0]) {
      return json[0].map((s: any) => s[0]).join('')
    }
    return ''
  } catch (err) {
    console.error('[Translation API Error]:', err)
    return ''
  }
}

// Heurística simple para saber si el texto está en inglés
function isEnglish(text: string): boolean {
  const englishWords = [' the ', ' and ', ' is ', ' of ', ' with ', ' from ', ' at ', ' by ', ' for ', ' which ', ' is a ', ' composed of '];
  const lowercase = text.toLowerCase()
  return englishWords.some(word => lowercase.includes(word))
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

  // Traducción perezosa (lazy translation) de la descripción si detectamos que está en inglés
  if (mineral.description && isEnglish(mineral.description)) {
    // Limpiar frase incompleta al final debido al límite de 150 caracteres de la API de Mindat
    let textToTranslate = mineral.description.trim()
    if (textToTranslate.endsWith('...')) {
      textToTranslate = textToTranslate.slice(0, -3).trim()
    }
    const lastPeriod = Math.max(
      textToTranslate.lastIndexOf('.'),
      textToTranslate.lastIndexOf('?'),
      textToTranslate.lastIndexOf('!')
    )
    if (lastPeriod !== -1 && lastPeriod < textToTranslate.length - 1) {
      textToTranslate = textToTranslate.slice(0, lastPeriod + 1).trim()
    }

    if (textToTranslate) {
      const translated = await translateText(textToTranslate)
      if (translated) {
        try {
          const { createClient: createServiceRoleClient } = await import('@supabase/supabase-js')
          const serviceSupabase = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { error: errUpdate } = await serviceSupabase
            .from('minerals')
            .update({ description: translated })
            .eq('id', realMineralId)

          if (!errUpdate) {
            mineral.description = translated
          }
        } catch (dbErr) {
          console.error('[Lazy Translation DB Update Error]:', dbErr)
        }
      }
    }
  }

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
