import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials missing in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const PROGRESS_FILE = path.resolve(__dirname, 'translate-progress.json')

// ── DICCIONARIOS DE TRADUCCIÓN RÁPIDA ────────────────────────────────────────

const MAGNETISM_MAP: Record<string, string> = {
  'non-magnetic': 'No magnético',
  'diamagnetic': 'Diamagnético',
  'ferrimagnetic': 'Ferrimagnético',
  'ferromagnetic': 'Ferromagnético',
  'paramagnetic': 'Paramagnético',
  'weakly magnetic': 'Débilmente magnético',
  'strongly magnetic': 'Fuertemente magnético',
  'none': 'Ninguno',
  'magnetic': 'Magnético'
}

const COLOR_MAP: Record<string, string> = {
  'white': 'blanca',
  'black': 'negra',
  'gray': 'gris',
  'grey': 'gris',
  'red': 'roja',
  'brown': 'marrón',
  'yellow': 'amarilla',
  'green': 'verde',
  'blue': 'azul',
  'orange': 'naranja',
  'pink': 'rosa',
  'colorless': 'incolora',
  'colourless': 'incolora',
  'light': 'claro',
  'pale': 'pálido',
  'dark': 'oscuro',
  'reddish': 'rojiza',
  'brownish': 'pardusca',
  'grayish': 'grisácea',
  'greyish': 'grisácea',
  'yellowish': 'amarillenta',
  'greenish': 'verdosa',
  'bluish': 'azulada',
  'blueish': 'azulada',
  'pinkish': 'rosada',
  'yellowish-brown': 'marrón amarillenta',
  'reddish-brown': 'marrón rojiza',
  'grey-greenish': 'verde grisácea',
  'grey-black': 'negra grisácea',
  'gray-black': 'negra grisácea',
  'brown-black': 'negra pardusca',
  'green-blue': 'azul verdosa',
  'to': 'a',
  'con': 'con',
  'with': 'con',
  'a': 'a',
  'or': 'o',
  'and': 'y',
  'tint': 'matiz'
}

// ── FUNCIONES AUXILIARES DE TRADUCCIÓN ────────────────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function cleanDescription(text: string): string {
  if (!text) return ''
  let cleaned = text.trim()
  
  if (cleaned.endsWith('...')) {
    cleaned = cleaned.slice(0, -3).trim()
  }
  
  const lastPeriod = Math.max(
    cleaned.lastIndexOf('.'),
    cleaned.lastIndexOf('?'),
    cleaned.lastIndexOf('!')
  )
  
  // Si encontramos un signo de puntuación y está antes del final, recortamos ahí
  if (lastPeriod !== -1 && lastPeriod < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastPeriod + 1).trim()
  }
  
  return cleaned
}

// Heurística simple para saber si ya está en español
function isAlreadySpanish(text: string): boolean {
  if (!text) return true
  return /[áéíóúñ¿¡]/i.test(text)
}

async function translateText(text: string): Promise<string> {
  if (!text || text.trim() === '') return ''
  if (isAlreadySpanish(text)) return text.trim()
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`)
    const json = await resp.json() as any
    if (json && json[0]) {
      return json[0].map((s: any) => s[0]).join('').trim()
    }
    return text // fallback
  } catch (err) {
    // Si falla temporalmente, devolvemos el texto original
    return text
  }
}

function translateStreak(streak: string): string {
  if (!streak) return ''
  let val = streak.toLowerCase().trim()
  val = val.replace(/"/g, '').replace(/\(|\)/g, ' ').replace(/\s+/g, ' ').trim()

  if (val === 'white') return 'Blanca'
  if (val === 'black') return 'Negra'
  if (val === 'colorless' || val === 'colourless') return 'Incolora'
  if (val === 'white colorless') return 'Blanca / Incolora'
  if (val === 'colorless white') return 'Incolora / Blanca'

  const words = val.split(/[\s\-]+/)
  const translatedWords = words.map(w => COLOR_MAP[w] || w)
  let result = translatedWords.join(' ')
  
  result = result
    .replace(/claro blanca/gi, 'blanca clara')
    .replace(/claro negra/gi, 'negra clara')
    .replace(/claro roja/gi, 'roja clara')
    .replace(/claro amarilla/gi, 'amarilla clara')
    .replace(/claro verde/gi, 'verde claro')
    .replace(/claro azul/gi, 'azul claro')
    .replace(/claro rosa/gi, 'rosa claro')
    .replace(/oscuro blanca/gi, 'blanca oscura')
    .replace(/oscuro negra/gi, 'negra oscura')
    .replace(/oscuro roja/gi, 'roja oscura')
    .replace(/oscuro amarilla/gi, 'amarilla oscura')
    .replace(/oscuro verde/gi, 'verde oscuro')
    .replace(/oscuro azul/gi, 'azul oscuro')
    .replace(/pálido blanca/gi, 'blanca pálida')
    .replace(/pálido negra/gi, 'negra pálida')
    .replace(/pálido roja/gi, 'roja pálida')
    .replace(/pálido amarilla/gi, 'amarilla pálida')
    .replace(/pálido verde/gi, 'verde pálido')
    .replace(/pálido azul/gi, 'azul pálido')
    .replace(/pálido rosa/gi, 'rosa pálido')
    .replace(/marrón a negra/gi, 'marrón a negro')
    .replace(/verde a azul/gi, 'verde a azul')
    .replace(/gris a negra/gi, 'gris a negro')
    .replace(/rosa a rosada/gi, 'rosa a rosado')

  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1)
  }
  return result
}

function translateMagnetism(magnetism: string): string {
  if (!magnetism) return ''
  const val = magnetism.toLowerCase().trim()
  return MAGNETISM_MAP[val] || magnetism
}

async function translateArray(arr: string[] | null): Promise<string[] | null> {
  if (!arr || arr.length === 0) return null
  const translated: string[] = []
  for (const item of arr) {
    if (isAlreadySpanish(item)) {
      translated.push(item)
    } else {
      const trans = await translateText(item)
      translated.push(trans || item)
      await sleep(100)
    }
  }
  return translated
}

// ── MANEJO DEL PROGRESO ────────────────────────────────────────────────────────

interface ProgressData {
  processedIds: Record<string, boolean>
}

function loadProgress(): ProgressData {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) as ProgressData
    } catch {
      return { processedIds: {} }
    }
  }
  return { processedIds: {} }
}

function saveProgress(progress: ProgressData) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// ── PROGRAMA PRINCIPAL ─────────────────────────────────────────────────────────

async function main() {
  console.log('=== TRADUCCIÓN Y LIMPIEZA MASIVA DE CAMPOS DE MINERALES (CONCURRENCIA PARALELA) ===\n')
  
  const progress = loadProgress()
  const processedCount = Object.keys(progress.processedIds).length
  console.log(`Progreso inicial cargado: ${processedCount} minerales ya procesados.`)

  console.log('1. Descargando catálogo completo de minerales de la BD...')
  const BATCH_SIZE = 1000
  const allMinerals: any[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('minerals')
      .select('id, name, name_es, description, streak, magnetism, radioactivity, fluorescence, crystal_habits')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('Error al descargar minerales:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    allMinerals.push(...data)
    offset += BATCH_SIZE
  }

  console.log(`Catálogo descargado: ${allMinerals.length} minerales.`)

  // Filtrar minerales que necesitan procesamiento
  const toProcess = allMinerals.filter(m => {
    if (progress.processedIds[m.id]) return false

    const hasData = m.description || m.streak || m.magnetism || m.radioactivity || m.fluorescence || (m.crystal_habits && m.crystal_habits.length > 0)
    
    if (!hasData) {
      progress.processedIds[m.id] = true
      return false
    }

    return true
  })

  saveProgress(progress)

  const activeCount = toProcess.length
  console.log(`Minerales que requieren traducción activa: ${activeCount}`)

  if (activeCount === 0) {
    console.log('¡Todos los minerales ya están traducidos y procesados!')
    return
  }

  console.log('\n2. Iniciando traducción activa con 5 workers paralelos...')
  let count = 0
  const startTime = Date.now()
  const CONCURRENCY = 5

  const worker = async () => {
    while (true) {
      const m = toProcess.pop()
      if (!m) break

      const updates: Record<string, any> = {}

      // 1. Descripción
      if (m.description && !isAlreadySpanish(m.description)) {
        const cleaned = cleanDescription(m.description)
        if (cleaned) {
          updates.description = await translateText(cleaned)
        }
      }

      // 2. Raya
      if (m.streak && !isAlreadySpanish(m.streak)) {
        updates.streak = translateStreak(m.streak)
      }

      // 3. Magnetismo
      if (m.magnetism && !isAlreadySpanish(m.magnetism)) {
        updates.magnetism = translateMagnetism(m.magnetism)
      }

      // 4. Radioactividad
      if (m.radioactivity && !isAlreadySpanish(m.radioactivity)) {
        updates.radioactivity = await translateText(m.radioactivity)
      }

      // 5. Fluorescencia
      if (m.fluorescence && !isAlreadySpanish(m.fluorescence)) {
        updates.fluorescence = await translateText(m.fluorescence)
      }

      // 6. Hábitos cristalinos
      if (m.crystal_habits && m.crystal_habits.length > 0) {
        const transHabits = await translateArray(m.crystal_habits)
        if (transHabits) {
          updates.crystal_habits = transHabits
        }
      }

      // Aplicar actualizaciones en Supabase si corresponde
      if (Object.keys(updates).length > 0) {
        const { error: errUpdate } = await supabase
          .from('minerals')
          .update(updates)
          .eq('id', m.id)

        if (errUpdate) {
          console.error(`  ❌ Error al actualizar ID ${m.id} (${m.name}):`, errUpdate.message)
        }
      }

      progress.processedIds[m.id] = true
      count++

      // Guardar e imprimir progreso periódicamente
      if (count % 50 === 0 || count === activeCount) {
        saveProgress(progress)
        const elapsedMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
        console.log(`  Procesados: ${count}/${activeCount} (${((count/activeCount)*100).toFixed(1)}%) | Tiempo transcurrido: ${elapsedMin} min`)
      }

      await sleep(150) // Pausa por solicitud en el mismo worker
    }
  }

  // Lanzar workers paralelos
  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await Promise.all(workers)

  saveProgress(progress)
  console.log('\n=== PROCESO COMPLETADO CON ÉXITO ===')
  console.log(`Total procesados e insertados en esta corrida: ${count}`)
}

main().catch(console.error)
