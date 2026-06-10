/**
 * MineralVault — Script de Descarga Completa de Minerales IMA
 * ============================================================
 * Descarga TODOS los minerales aprobados por la IMA desde la API v1 de Mindat.org
 * y los inserta/actualiza en Supabase usando upsert (idempotente).
 *
 * Características:
 *   ✅ Solo minerales IMA aprobados (enttype_ids=1)
 *   ✅ Reanudación automática desde último punto guardado
 *   ✅ Retry con backoff exponencial (hasta 5 intentos)
 *   ✅ Rate limiting inteligente con headers de la API
 *   ✅ Barra de progreso con ETA
 *   ✅ Logging persistente a archivo
 *   ✅ Modo --dry-run para validar sin insertar
 *
 * Uso:
 *   npx tsx scripts/seed-mindat.ts              # Ejecución normal
 *   npx tsx scripts/seed-mindat.ts --dry-run    # Solo validar conexión
 *   npx tsx scripts/seed-mindat.ts --reset      # Reiniciar progreso
 *
 * Requiere en .env.local:
 *   MINDAT_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// ── Cargar variables de entorno ────────────────────────────────────────────────
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ── Configuración ──────────────────────────────────────────────────────────────

const MINDAT_API_KEY = process.env.MINDAT_API_KEY ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// API v1 de Mindat — la v1 devuelve páginas fijas de 10 resultados
const MINDAT_BASE_URL = 'https://api.mindat.org/v1'
const BATCH_INSERT_SIZE = 50    // Tamaño de batch para upsert en Supabase
const MAX_RETRIES = 5           // Reintentos por página
const BASE_DELAY_MS = 1000      // Delay base para backoff exponencial
const RATE_LIMIT_PAUSE_MS = 300 // Pausa entre páginas (ms) — ser amigable con la API

// Solo minerales IMA aprobados (enttype 1)
const INITIAL_URL = `${MINDAT_BASE_URL}/geomaterials/?format=json&enttype_ids=1`

// Archivos de progreso y log
const PROGRESS_FILE = path.resolve(__dirname, 'seed-progress.json')
const LOG_DIR = path.resolve(__dirname, '../logs')
const LOG_FILE = path.resolve(LOG_DIR, `seed-${new Date().toISOString().slice(0, 10)}.log`)

// Flags de línea de comandos
const DRY_RUN = process.argv.includes('--dry-run')
const RESET = process.argv.includes('--reset')

// Estimación de minerales IMA (para la barra de progreso)
// No hay count en la API v1, así que usamos una estimación
const ESTIMATED_IMA_MINERALS = 6200

// ── Validación de entorno ──────────────────────────────────────────────────────

if (!MINDAT_API_KEY || MINDAT_API_KEY === 'your_mindat_api_key') {
  console.error('❌ MINDAT_API_KEY no configurada en .env.local')
  process.exit(1)
}
if (!SUPABASE_URL || SUPABASE_URL === 'your_supabase_project_url') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no configurada en .env.local')
  process.exit(1)
}
if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'your_supabase_service_role_key') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local')
  process.exit(1)
}

// ── Supabase client con service_role (bypass RLS) ──────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface MindatMineral {
  id: number
  name: string
  // Fórmulas
  ima_formula?: string
  mindat_formula?: string
  // Dureza
  hmin?: number
  hmax?: number
  // Densidad
  dmeas?: number
  dmeas2?: number
  dcalc?: number
  // Clasificación
  strunz10ed1?: string
  strunz10ed2?: string
  strunz10ed3?: string
  strunz10ed4?: string
  dana8ed1?: string
  dana8ed2?: string
  dana8ed3?: string
  dana8ed4?: string
  // Cristalografía
  csystem?: string
  morphology?: string
  cclass?: string
  spacegroup?: string
  // Ejes cristalográficos
  a?: number
  b?: number
  c?: number
  alpha?: number
  beta?: number
  gamma?: number
  // Propiedades físicas
  colour?: string
  streak?: string
  lustretype?: string
  lustre?: string
  diapheny?: string
  cleavagetype?: string
  fracturetype?: string
  tenacity?: string
  magnetism?: string
  uv?: string
  luminescence?: string
  // Descripción y metadata
  description_short?: string
  entrytype?: number
  entrytype_text?: string
  weighting?: number
  approval_year?: string
  ima_status?: string
  ima_notes?: string
  discovery_year?: string
  elements?: string
  occurrence?: string
  // IDs de relación
  varietyof?: number
  synid?: number
  polytypeof?: number
  groupid?: number
}

interface MindatResponse {
  results: MindatMineral[]
  next?: string | null
  previous?: string | null
}

interface SeedProgress {
  lastPage: number
  lastUrl: string | null
  totalFetched: number
  totalInserted: number
  totalErrors: number
  startedAt: string
  updatedAt: string
}

// ── Logger ─────────────────────────────────────────────────────────────────────

class Logger {
  private logStream: fs.WriteStream

  constructor() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }
    this.logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' })
    this.log('═'.repeat(60))
    this.log(`🪨 MineralVault Seed — ${new Date().toISOString()}`)
    this.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no inserts)' : 'LIVE'}`)
    this.log('═'.repeat(60))
  }

  log(msg: string) {
    const timestamp = new Date().toISOString().slice(11, 19)
    const line = `[${timestamp}] ${msg}`
    console.log(line)
    this.logStream.write(line + '\n')
  }

  error(msg: string, err?: unknown) {
    const timestamp = new Date().toISOString().slice(11, 19)
    let errMsg: string
    if (err instanceof Error) {
      errMsg = err.message
    } else if (err && typeof err === 'object') {
      errMsg = JSON.stringify(err, null, 2)
    } else {
      errMsg = String(err ?? '')
    }
    const line = `[${timestamp}] ❌ ${msg}${errMsg ? ': ' + errMsg : ''}`
    console.error(line)
    this.logStream.write(line + '\n')
  }

  progress(current: number, estimated: number, inserted: number, errors: number, startTime: number) {
    const pct = estimated > 0 ? Math.min(Math.round((current / estimated) * 100), 99) : 0
    const elapsed = (Date.now() - startTime) / 1000
    const rate = current / elapsed
    const remaining = estimated > 0 ? Math.round(Math.max(0, (estimated - current) / rate)) : 0
    const etaMin = Math.floor(remaining / 60)
    const etaSec = remaining % 60

    const barWidth = 30
    const filled = Math.round((pct / 100) * barWidth)
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled)

    const line = `\r  [${bar}] ${pct}% | ${current.toLocaleString()}/${estimated.toLocaleString()} (~) | ` +
      `✓${inserted.toLocaleString()} ✗${errors} | ETA: ${etaMin}m${etaSec}s`
    process.stdout.write(line)
  }

  close() {
    this.logStream.end()
  }
}

// ── Progreso (reanudación) ─────────────────────────────────────────────────────

function loadProgress(): SeedProgress | null {
  if (RESET && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE)
    return null
  }
  if (!fs.existsSync(PROGRESS_FILE)) return null
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    return data as SeedProgress
  } catch {
    return null
  }
}

function saveProgress(progress: SeedProgress) {
  progress.updatedAt = new Date().toISOString()
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

function clearProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE)
  }
}

// ── Fetch con retry y backoff ──────────────────────────────────────────────────

async function fetchWithRetry(url: string, logger: Logger): Promise<MindatResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${MINDAT_API_KEY}`,
          'Accept': 'application/json',
        },
      })

      // Rate limit: si recibimos 429, esperar
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10)
        const waitMs = (retryAfter + 5) * 1000
        logger.log(`⏳ Rate limited (429). Esperando ${retryAfter + 5}s antes de reintentar...`)
        await sleep(waitMs)
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Comprobar rate limit restante
      const remaining = response.headers.get('X-RateLimit-Remaining')
      if (remaining && parseInt(remaining, 10) < 50) {
        logger.log(`⚠️  Rate limit bajo: ${remaining} requests restantes. Pausando 5s...`)
        await sleep(5000)
      }

      return await response.json() as MindatResponse
    } catch (err) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)

      if (attempt === MAX_RETRIES) {
        logger.error(`Falló tras ${MAX_RETRIES} intentos`, err)
        throw err
      }

      logger.log(`⚠️  Intento ${attempt}/${MAX_RETRIES} falló. Reintentando en ${delay / 1000}s...`)
      await sleep(delay)
    }
  }

  throw new Error('Unreachable: exceeded max retries')
}

// ── Mapeo Mindat → Schema Supabase ─────────────────────────────────────────────

function mapMindatToMineral(m: MindatMineral): Record<string, unknown> {
  // Fórmula química: priorizar IMA > mindat
  const formula = m.ima_formula ?? m.mindat_formula ?? null

  // Truncar precisión numérica para ajustarse a las columnas DB
  // NUMERIC(3,1) → max 99.9 con 1 decimal
  const roundTo1 = (v: any): number | null => {
    if (v == null || v === '' || isNaN(Number(v))) return null
    const n = Math.round(Number(v) * 10) / 10
    return n === 0 ? null : n  // 0 no es una dureza válida
  }
  // NUMERIC(5,2) → max 999.99 con 2 decimales
  const roundTo2 = (v: any): number | null => {
    if (v == null || v === '' || isNaN(Number(v))) return null
    const n = Math.round(Number(v) * 100) / 100
    return n === 0 ? null : n  // 0 no es una densidad válida
  }

  // Helper para strings: convierte "" → null
  const str = (v: string | undefined | null): string | null => {
    if (!v || v.trim() === '') return null
    return v.trim()
  }

  // Dureza — NUMERIC(3,1)
  const hardness_min = roundTo1(m.hmin)
  let hardness_max = roundTo1(m.hmax)
  if (hardness_max === null) hardness_max = hardness_min

  // Densidad — NUMERIC(5,2)
  const density_min = roundTo2(m.dmeas)
  let density_max = roundTo2(m.dmeas2)
  if (density_max === null) density_max = density_min

  // Clasificación Strunz: componer número completo
  const strunz = buildClassification(
    m.strunz10ed1, m.strunz10ed2, m.strunz10ed3, m.strunz10ed4
  )

  // Clasificación Dana: componer número completo
  const dana = buildClassification(
    m.dana8ed1, m.dana8ed2, m.dana8ed3, m.dana8ed4
  )

  // Parsear listas separadas por coma/punto y coma
  const parseList = (val?: string): string[] | null => {
    if (!val) return null
    return val.split(/[,;]/).map(s => s.trim()).filter(Boolean)
  }

  // Sistema cristalino normalizado
  const crystal_system = normalizeCrystalSystem(m.csystem)

  // Hábito cristalino
  const crystal_habits = parseList(m.morphology)

  // Config 3D para el visor de cristales (usando datos reales de ejes si existen)
  const model_3d_config = {
    system: crystal_system ?? 'Amorphous',
    habit: m.morphology?.split(/[,;]/)[0]?.trim() ?? '',
    params: m.a && m.b && m.c
      ? { a: m.a, b: m.b, c: m.c }
      : getDefaultAxisRatio(crystal_system),
  }

  return {
    mindat_id: m.id,
    parent_mindat_id: (m.varietyof && Number(m.varietyof) !== 0 && !isNaN(Number(m.varietyof))) ? Number(m.varietyof) : null,
    name: m.name,
    name_es: null,
    chemical_formula: str(formula),
    hardness_min,
    hardness_max,
    density_min,
    density_max,
    streak: str(m.streak),
    luster: parseList(m.lustretype ?? m.lustre),
    transparency: str(m.diapheny),
    color: parseList(m.colour),
    crystal_system,
    crystal_habits,
    cleavage: str(m.cleavagetype),
    fracture: str(m.fracturetype),
    tenacity: str(m.tenacity),
    magnetism: str(m.magnetism),
    radioactivity: null,
    fluorescence: str(m.uv ?? m.luminescence),
    mineral_class: null,
    strunz_number: strunz,
    dana_number: dana,
    associated_minerals: null,
    localities: null,
    description: str(m.description_short),
    mindat_url: `https://www.mindat.org/min-${m.id}.html`,
    thumbnail_url: null,
    model_3d_config,
  }
}

/** Componer clasificación tipo "10.AB.05c" desde componentes */
function buildClassification(
  ed1?: string, ed2?: string, ed3?: string, ed4?: string
): string | null {
  const parts = [ed1, ed2, ed3, ed4].filter(Boolean)
  if (parts.length === 0) return null
  return parts.join('.')
}

/** Normalizar el sistema cristalino a nombres estándar */
function normalizeCrystalSystem(raw?: string): string | null {
  if (!raw) return null
  const map: Record<string, string> = {
    'isometric': 'Cubic', 'cubic': 'Cubic',
    'hexagonal': 'Hexagonal',
    'tetragonal': 'Tetragonal',
    'orthorhombic': 'Orthorhombic',
    'monoclinic': 'Monoclinic',
    'triclinic': 'Triclinic',
    'trigonal': 'Trigonal', 'rhombohedral': 'Trigonal',
    'amorphous': 'Amorphous',
    'icosahedral': 'Icosahedral',
  }
  return map[raw.toLowerCase()] ?? raw
}

/** Relaciones de ejes estándar por sistema cristalino (para geometría 3D) */
function getDefaultAxisRatio(system: string | null): { a: number; b: number; c: number } {
  const defaults: Record<string, { a: number; b: number; c: number }> = {
    Cubic:        { a: 1.0, b: 1.0, c: 1.0 },
    Hexagonal:    { a: 1.0, b: 1.0, c: 1.6 },
    Tetragonal:   { a: 1.0, b: 1.0, c: 1.4 },
    Orthorhombic: { a: 0.8, b: 1.0, c: 1.2 },
    Monoclinic:   { a: 0.9, b: 1.0, c: 1.1 },
    Triclinic:    { a: 0.8, b: 1.0, c: 1.2 },
    Trigonal:     { a: 1.0, b: 1.0, c: 1.4 },
    Icosahedral:  { a: 1.0, b: 1.0, c: 1.0 },
    Amorphous:    { a: 1.0, b: 1.0, c: 1.0 },
  }
  return defaults[system ?? 'Amorphous'] ?? defaults.Amorphous
}

// ── Utilidad ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Función principal ──────────────────────────────────────────────────────────

async function main() {
  const logger = new Logger()
  const startTime = Date.now()

  logger.log(`📡 API Key: ${MINDAT_API_KEY.slice(0, 8)}...****`)
  logger.log(`🗄️  Supabase: ${SUPABASE_URL}`)
  logger.log(`📦 API Base: ${MINDAT_BASE_URL}`)
  logger.log('')

  // ── Paso 1: Verificar conexión a Supabase ──
  logger.log('🔌 Verificando conexión a Supabase...')
  const { count: existingCount, error: countError } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    logger.error('No se puede conectar a Supabase o la tabla minerals no existe', countError)
    logger.log('💡 Asegúrate de ejecutar la migración 001_initial_schema.sql primero.')
    process.exit(1)
  }

  logger.log(`✅ Conexión OK. Minerales actuales en DB: ${existingCount?.toLocaleString() ?? 0}`)

  // ── Paso 2: Verificar conexión a Mindat API v1 ──
  logger.log('🔌 Verificando conexión a Mindat API v1...')
  const testUrl = `${MINDAT_BASE_URL}/geomaterials/?format=json&enttype_ids=1`

  try {
    const testData = await fetchWithRetry(testUrl, logger)
    const firstMineral = testData.results?.[0]
    logger.log(`✅ Conexión OK. Primera muestra: "${firstMineral?.name}" (id: ${firstMineral?.id})`)
    logger.log(`   Resultados por página: ${testData.results?.length ?? 0}`)
    logger.log(`   Paginación: ${testData.next ? 'Sí (hay más páginas)' : 'No'}`)
    logger.log(`   Estimación total minerales IMA: ~${ESTIMATED_IMA_MINERALS.toLocaleString()}`)
  } catch (err) {
    logger.error('No se puede conectar a la API de Mindat v1', err)
    logger.log('💡 Verifica tu MINDAT_API_KEY en .env.local')
    process.exit(1)
  }

  if (DRY_RUN) {
    logger.log('')
    logger.log('🏁 DRY RUN completado. Ambas conexiones verificadas.')
    logger.log(`   Se descargarían ~${ESTIMATED_IMA_MINERALS.toLocaleString()} minerales IMA.`)
    logger.log(`   Páginas estimadas: ~${Math.ceil(ESTIMATED_IMA_MINERALS / 10)} (10 por página)`)
    logger.close()
    return
  }

  // ── Paso 3: Cargar progreso (reanudación) ──
  const savedProgress = loadProgress()
  let nextUrl: string | null
  let totalFetched: number
  let totalInserted: number
  let totalErrors: number
  let pageNum: number

  if (savedProgress && savedProgress.lastUrl) {
    logger.log('')
    logger.log(`🔄 Reanudando desde página ${savedProgress.lastPage + 1}`)
    logger.log(`   Progreso anterior: ${savedProgress.totalFetched.toLocaleString()} descargados, ${savedProgress.totalInserted.toLocaleString()} insertados`)
    nextUrl = savedProgress.lastUrl
    totalFetched = savedProgress.totalFetched
    totalInserted = savedProgress.totalInserted
    totalErrors = savedProgress.totalErrors
    pageNum = savedProgress.lastPage + 1
  } else {
    nextUrl = INITIAL_URL
    totalFetched = 0
    totalInserted = 0
    totalErrors = 0
    pageNum = 1
  }

  logger.log('')
  logger.log('━'.repeat(60))
  logger.log('🚀 Iniciando descarga de minerales IMA...')
  logger.log('━'.repeat(60))
  logger.log('')

  // Buffer de minerales para insertar en batch (acumular varias páginas)
  let mineralBuffer: Record<string, unknown>[] = []

  // ── Paso 4: Descarga página a página ──
  while (nextUrl) {
    // Log periódico (cada 10 páginas para no saturar)
    if (pageNum % 10 === 1 || pageNum <= 3) {
      logger.log(`📄 Página ${pageNum}...`)
    }

    let data: MindatResponse
    try {
      data = await fetchWithRetry(nextUrl, logger)
    } catch (err) {
      logger.error(`Error irrecuperable en página ${pageNum}. Guardando progreso.`, err)

      // Flush del buffer antes de guardar
      if (mineralBuffer.length > 0) {
        const { error } = await supabase
          .from('minerals')
          .upsert(mineralBuffer, { onConflict: 'mindat_id', ignoreDuplicates: false })
        if (error) {
          totalErrors++
          logger.error(`  Flush del buffer falló (${mineralBuffer.length} minerales)`, error)
        } else {
          totalInserted += mineralBuffer.length
        }
        mineralBuffer = []
      }

      saveProgress({
        lastPage: pageNum - 1,
        lastUrl: nextUrl,
        totalFetched,
        totalInserted,
        totalErrors,
        startedAt: savedProgress?.startedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      logger.log(`💾 Progreso guardado. Ejecuta de nuevo para reanudar desde página ${pageNum}.`)
      logger.close()
      process.exit(1)
    }

    const results = data.results ?? []

    if (results.length === 0) {
      logger.log('  ⚠️  Sin resultados en esta página, finalizando.')
      break
    }

    totalFetched += results.length

    // Mapear y filtrar (solo minerales válidos con nombre)
    const minerals = results
      .filter(m => m.name && m.id)
      .map(m => mapMindatToMineral(m))

    // Añadir al buffer
    mineralBuffer.push(...minerals)

    // Insertar en Supabase cuando el buffer alcanza el tamaño del batch
    if (mineralBuffer.length >= BATCH_INSERT_SIZE) {
      const batch = mineralBuffer.splice(0, BATCH_INSERT_SIZE)
      const { error } = await supabase
        .from('minerals')
        .upsert(batch, { onConflict: 'mindat_id', ignoreDuplicates: false })

      if (error) {
        totalErrors++
        logger.error(`  Batch de ${batch.length} falló en página ${pageNum}`, error)
        // Reintentar uno por uno en caso de error
        let batchRecovered = 0
        for (const mineral of batch) {
          const { error: singleError } = await supabase
            .from('minerals')
            .upsert(mineral, { onConflict: 'mindat_id', ignoreDuplicates: false })
          if (!singleError) {
            totalInserted++
            batchRecovered++
          } else {
            logger.error(`    Mineral "${mineral.name}" (mindat_id: ${mineral.mindat_id}) falló individualmente`, singleError)
          }
        }
        logger.log(`  🔧 Recuperados ${batchRecovered}/${batch.length} del batch fallido`)
      } else {
        totalInserted += batch.length
      }
    }

    // Mostrar progreso visual
    logger.progress(totalFetched, ESTIMATED_IMA_MINERALS, totalInserted, totalErrors, startTime)

    // Guardar progreso cada 10 páginas (cada 100 minerales)
    if (pageNum % 10 === 0) {
      saveProgress({
        lastPage: pageNum,
        lastUrl: data.next ?? null,
        totalFetched,
        totalInserted,
        totalErrors,
        startedAt: savedProgress?.startedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // Avanzar a siguiente página
    nextUrl = data.next ?? null
    pageNum++

    // Rate limiting: pausa entre páginas
    if (nextUrl) {
      await sleep(RATE_LIMIT_PAUSE_MS)
    }
  }

  // ── Flush del buffer restante ──
  if (mineralBuffer.length > 0) {
    const { error } = await supabase
      .from('minerals')
      .upsert(mineralBuffer, { onConflict: 'mindat_id', ignoreDuplicates: false })
    if (error) {
      totalErrors++
      logger.error(`  Flush final falló (${mineralBuffer.length} minerales)`, error)
    } else {
      totalInserted += mineralBuffer.length
    }
    mineralBuffer = []
  }

  // ── Paso 5: Reporte final ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('') // Salto de línea tras la barra de progreso
  logger.log('')
  logger.log('═'.repeat(60))
  logger.log('✅ ¡DESCARGA COMPLETADA!')
  logger.log('═'.repeat(60))
  logger.log(`   ⏱️  Tiempo total:     ${elapsed}s`)
  logger.log(`   📥 Descargados:       ${totalFetched.toLocaleString()}`)
  logger.log(`   ✅ Insertados/Act.:   ${totalInserted.toLocaleString()}`)
  logger.log(`   ❌ Errores:           ${totalErrors}`)
  logger.log(`   📄 Páginas:           ${pageNum - 1}`)
  logger.log(`   📝 Log:               ${LOG_FILE}`)
  logger.log('═'.repeat(60))

  // Verificación final
  const { count: finalCount } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })

  logger.log(`   🗄️  Total en DB:       ${finalCount?.toLocaleString() ?? '?'}`)
  logger.log('')

  // Limpiar archivo de progreso (descarga completada)
  clearProgress()
  logger.log('🧹 Progreso limpiado (descarga completa).')

  logger.close()
}

// ── Ejecutar ───────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
