import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

async function check() {
  // Count
  const { count } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })
  console.log('Total minerales en DB:', count)

  // Sample full row to estimate size
  const { data } = await supabase
    .from('minerals')
    .select('*')
    .limit(10)

  if (data && data.length > 0) {
    const sizes = data.map(r => Buffer.byteLength(JSON.stringify(r)))
    const avgBytes = sizes.reduce((a, b) => a + b, 0) / sizes.length
    console.log('Tamaño medio por fila (JSON):', Math.round(avgBytes), 'bytes')
    console.log('Tamaño estimado total (JSON):', ((avgBytes * (count ?? 0)) / 1024 / 1024).toFixed(2), 'MB')
    // PostgreSQL row overhead ~1.3x JSON size
    console.log('Tamaño estimado en disco (PG):', ((avgBytes * 1.3 * (count ?? 0)) / 1024 / 1024).toFixed(2), 'MB')
  }
}

check()
