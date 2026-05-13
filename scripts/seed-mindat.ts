/**
 * Script de Seed — Extrae todos los minerales de la API de Mindat.org
 * y los carga en Supabase como snapshot único (no se vuelve a ejecutar).
 *
 * Uso:
 *   npx ts-node scripts/seed-mindat.ts
 *
 * Requiere en .env.local:
 *   MINDAT_API_KEY=tu_clave_de_mindat
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...  (¡NUNCA en frontend!)
 *
 * La API de Mindat: https://api.mindat.org/
 * Documentación: https://api.mindat.org/schema/redoc/
 */

import { createClient } from '@supabase/supabase-js'

// ── Configuración ──────────────────────────────────────────────────────────────

const MINDAT_API_KEY = process.env.MINDAT_API_KEY ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const MINDAT_BASE_URL = 'https://api.mindat.org'
const PAGE_SIZE = 200
const BATCH_INSERT_SIZE = 100

if (!MINDAT_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno. Configura MINDAT_API_KEY, NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

// Supabase con service_role para bypass de RLS en el seed
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Tipos de la API Mindat ─────────────────────────────────────────────────────

interface MindatMineral {
  id: number
  name: string
  ima_formula?: string
  formula?: string
  weighting?: number
  hardness?: string
  hardness_min?: number
  hardness_max?: number
  density?: string
  density_min?: number
  density_max?: number
  strunz_classification?: string
  dana_classification?: string
  crystal_system?: string
  colour?: string
  streak?: string
  luster?: string
  transparency?: string
  cleavage?: string
  fracture?: string
  tenacity?: string
  magnetism?: string
  radioactive?: string
  fluorescence?: string
  crystal_habit?: string
  class_name?: string  // clase mineral
  associated_minerals?: string
  mindat_formula?: string
  description?: string
  longid?: string      // para construir URL de Mindat
}

interface MindatResponse {
  results: MindatMineral[]
  next?: string | null
  count?: number
}

// ── Mapeo de campos Mindat → nuestro schema ────────────────────────────────────

function mapMindatToMineral(m: MindatMineral): Record<string, unknown> {
  const formula = m.ima_formula ?? m.formula ?? m.mindat_formula ?? null

  // Parsear hardness: puede ser "6.5-7" o "7"
  let hardness_min: number | null = m.hardness_min ?? null
  let hardness_max: number | null = m.hardness_max ?? null
  if (!hardness_min && m.hardness) {
    const parts = m.hardness.replace(/[^0-9.-]/g, '').split('-')
    hardness_min = parseFloat(parts[0]) || null
    hardness_max = parts[1] ? parseFloat(parts[1]) : hardness_min
  }

  // Parsear density
  let density_min: number | null = m.density_min ?? null
  let density_max: number | null = m.density_max ?? null
  if (!density_min && m.density) {
    const parts = m.density.replace(/[^0-9.-]/g, '').split('-')
    density_min = parseFloat(parts[0]) || null
    density_max = parts[1] ? parseFloat(parts[1]) : density_min
  }

  // Parsear arrays separados por coma
  const parseList = (val?: string): string[] | null => {
    if (!val) return null
    return val.split(/[,;]/).map(s => s.trim()).filter(Boolean)
  }

  const crystal_system = normalizeCrystalSystem(m.crystal_system)

  const model_3d_config = {
    system: crystal_system ?? 'Amorphous',
    habit: m.crystal_habit?.split(/[,;]/)[0]?.trim() ?? '',
    params: getDefaultAxisRatio(crystal_system),
  }

  return {
    mindat_id: m.id,
    name: m.name,
    name_es: null,  // Se puede enriquecer en futuras iteraciones
    chemical_formula: formula,
    hardness_min,
    hardness_max,
    density_min,
    density_max,
    streak: m.streak ?? null,
    luster: parseList(m.luster),
    transparency: m.transparency ?? null,
    color: parseList(m.colour),
    crystal_system,
    crystal_habits: parseList(m.crystal_habit),
    cleavage: m.cleavage ?? null,
    fracture: m.fracture ?? null,
    tenacity: m.tenacity ?? null,
    magnetism: m.magnetism ?? null,
    radioactivity: m.radioactive ?? null,
    fluorescence: m.fluorescence ?? null,
    mineral_class: m.class_name ?? null,
    strunz_number: m.strunz_classification ?? null,
    dana_number: m.dana_classification ?? null,
    associated_minerals: parseList(m.associated_minerals),
    localities: null,
    description: m.description ?? null,
    mindat_url: m.longid ? `https://www.mindat.org/min-${m.id}.html` : null,
    thumbnail_url: null,
    model_3d_config,
  }
}

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
  }
  return map[raw.toLowerCase()] ?? raw
}

function getDefaultAxisRatio(system: string | null): { a: number; b: number; c: number } {
  // Relaciones de ejes estándar por sistema para la geometría 3D
  const defaults: Record<string, { a: number; b: number; c: number }> = {
    Cubic:         { a: 1.0, b: 1.0, c: 1.0 },
    Hexagonal:     { a: 1.0, b: 1.0, c: 1.6 },
    Tetragonal:    { a: 1.0, b: 1.0, c: 1.4 },
    Orthorhombic:  { a: 0.8, b: 1.0, c: 1.2 },
    Monoclinic:    { a: 0.9, b: 1.0, c: 1.1 },
    Triclinic:     { a: 0.8, b: 1.0, c: 1.2 },
    Trigonal:      { a: 1.0, b: 1.0, c: 1.4 },
    Amorphous:     { a: 1.0, b: 1.0, c: 1.0 },
  }
  return defaults[system ?? 'Amorphous'] ?? defaults.Amorphous
}

// ── Función principal ──────────────────────────────────────────────────────────

async function main() {
  console.log('🪨 MineralVault — Iniciando extracción de Mindat.org')
  console.log(`📡 API Key: ${MINDAT_API_KEY.slice(0, 8)}...`)
  console.log('')

  let nextUrl: string | null = `${MINDAT_BASE_URL}/geomaterials/?format=json&pagesize=${PAGE_SIZE}`
  let totalFetched = 0
  let totalInserted = 0
  let pageNum = 1

  while (nextUrl) {
    console.log(`📄 Página ${pageNum}: ${nextUrl.split('?')[1] ?? ''}`)

    let response: Response
    try {
      response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Token ${MINDAT_API_KEY}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      console.error(`❌ Error en petición a Mindat:`, err)
      process.exit(1)
    }

    const data: MindatResponse = await response.json()
    const results = data.results ?? []

    if (results.length === 0) {
      console.log('  ⚠️  Sin resultados en esta página, finalizando.')
      break
    }

    totalFetched += results.length
    console.log(`  ↳ ${results.length} minerales obtenidos (total: ${totalFetched})`)

    // Mapear y filtrar (solo minerales válidos con nombre)
    const minerals = results
      .filter(m => m.name && m.id)
      .map(m => mapMindatToMineral(m))

    // Insertar en Supabase en batches para evitar límites de payload
    for (let i = 0; i < minerals.length; i += BATCH_INSERT_SIZE) {
      const batch = minerals.slice(i, i + BATCH_INSERT_SIZE)
      const { error } = await supabase
        .from('minerals')
        .upsert(batch, { onConflict: 'mindat_id', ignoreDuplicates: false })

      if (error) {
        console.error(`  ❌ Error insertando batch ${i}–${i + BATCH_INSERT_SIZE}:`, error.message)
        // Continuar con el siguiente batch (no detener todo el proceso)
      } else {
        totalInserted += batch.length
        process.stdout.write(`  ✓ Insertados ${totalInserted} minerales\r`)
      }
    }

    nextUrl = data.next ?? null
    pageNum++

    // Rate limiting: pausa entre páginas para respetar los límites de la API
    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\n')
  console.log('━'.repeat(50))
  console.log(`✅ Seed completado!`)
  console.log(`   Minerales fetched:  ${totalFetched}`)
  console.log(`   Minerales en DB:    ${totalInserted}`)
  console.log('━'.repeat(50))
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
