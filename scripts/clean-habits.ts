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

const GEOMETRIC_HABITS_KEYWORDS = [
  { key: 'octahedr', label: 'Octaédrico' },
  { key: 'octaédr', label: 'Octaédrico' },
  { key: 'octaedr', label: 'Octaédrico' },
  { key: 'dodecahedr', label: 'Dodecaédrico' },
  { key: 'dodecaédr', label: 'Dodecaédrico' },
  { key: 'dodecaedr', label: 'Dodecaédrico' },
  { key: 'tetrahedr', label: 'Tetraédrico' },
  { key: 'tetraédr', label: 'Tetraédrico' },
  { key: 'tetraedr', label: 'Tetraédrico' },
  { key: 'tabular', label: 'Tabular' },
  { key: 'tabul', label: 'Tabular' },
  { key: 'platy', label: 'Tabular' },
  { key: 'plat', label: 'Tabular' },
  { key: 'lamin', label: 'Tabular' },
  { key: 'hojos', label: 'Tabular' },
  { key: 'hoja', label: 'Tabular' },
  { key: 'plaquet', label: 'Tabular' },
  { key: 'placa', label: 'Tabular' },
  { key: 'prismatic', label: 'Prismático' },
  { key: 'prismátic', label: 'Prismático' },
  { key: 'prism', label: 'Prismático' },
  { key: 'pyramid', label: 'Piramidal' },
  { key: 'piramid', label: 'Piramidal' },
  { key: 'bipyramid', label: 'Piramidal' },
  { key: 'bipiramid', label: 'Piramidal' },
  { key: 'acicular', label: 'Acicular' },
  { key: 'needle', label: 'Acicular' },
  { key: 'aguja', label: 'Acicular' },
  { key: 'rhombohedr', label: 'Romboédrico' },
  { key: 'romboédr', label: 'Romboédrico' },
  { key: 'romboedr', label: 'Romboédrico' },
  { key: 'scalenohedr', label: 'Escalenoédrico' },
  { key: 'escalenoédr', label: 'Escalenoédrico' },
  { key: 'escalenoedr', label: 'Escalenoédrico' },
  { key: 'cubic', label: 'Cúbico' },
  { key: 'cúbic', label: 'Cúbico' },
  { key: 'isometr', label: 'Cúbico' }
]

function extractStandardHabits(text: string | null | undefined): string[] {
  if (!text) return []
  const lowercase = text.toLowerCase()
  const habits = new Set<string>()

  for (const item of GEOMETRIC_HABITS_KEYWORDS) {
    if (lowercase.includes(item.key)) {
      habits.add(item.label)
    }
  }

  return Array.from(habits)
}

async function main() {
  console.log('=== LIMPIEZA Y ESTANDARIZACIÓN DE HÁBITOS CRISTALINOS EN LA BD ===\n')

  console.log('1. Descargando catálogo de minerales de la BD...')
  const BATCH_SIZE = 1000
  const allMinerals: any[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('minerals')
      .select('id, name, crystal_habits')
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

  console.log(`Descargados ${allMinerals.length} minerales.`)

  console.log('\n2. Procesando y estandarizando hábitos en memoria...')
  let updatedCount = 0
  const updates: { id: string; name: string; oldHabits: string[]; newHabits: string[] | null }[] = []

  for (const m of allMinerals) {
    if (!m.crystal_habits || m.crystal_habits.length === 0) continue

    const joinedText = m.crystal_habits.join(' ')
    const cleanHabits = extractStandardHabits(joinedText)
    const newHabits = cleanHabits.length > 0 ? cleanHabits : null

    // Comparar si cambiaron
    const oldStr = JSON.stringify(m.crystal_habits)
    const newStr = JSON.stringify(newHabits)

    if (oldStr !== newStr) {
      updates.push({ id: m.id, name: m.name, oldHabits: m.crystal_habits, newHabits })
    }
  }

  console.log(`Total de minerales a actualizar: ${updates.length}`)

  if (updates.length === 0) {
    console.log('Todos los hábitos ya están estandarizados.')
    return
  }

  console.log('\n3. Guardando cambios en la base de datos por lotes...')
  const writeBatchSize = 100
  for (let i = 0; i < updates.length; i += writeBatchSize) {
    const batch = updates.slice(i, i + writeBatchSize)
    const promises = batch.map(async (upd) => {
      const { error } = await supabase
        .from('minerals')
        .update({ crystal_habits: upd.newHabits })
        .eq('id', upd.id)

      if (error) {
        console.error(`  ❌ Error actualizando ${upd.name}:`, error.message)
      } else {
        updatedCount++
      }
    })

    await Promise.all(promises)
    console.log(`  Actualizados: ${Math.min(i + writeBatchSize, updates.length)} / ${updates.length}...`)
  }

  console.log('\n=== PROCESO COMPLETADO ===')
  console.log(`Minerales actualizados con éxito: ${updatedCount}`)
}

main().catch(console.error)
