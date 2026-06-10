import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const MINDAT_API_KEY = process.env.MINDAT_API_KEY ?? ''

async function verify() {
  // 1. Check what enttype_ids=1 returns — sample from different pages
  const pages = [1, 100, 500, 800, 1000, 1200]
  
  console.log('═'.repeat(70))
  console.log('🔍 Verificación: ¿Qué devuelve enttype_ids=1?')
  console.log('═'.repeat(70))
  
  for (const page of pages) {
    const url = `https://api.mindat.org/v1/geomaterials/?format=json&enttype_ids=1&page=${page}`
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Token ${MINDAT_API_KEY}`, 'Accept': 'application/json' }
      })
      if (!res.ok) { console.log(`  Page ${page}: HTTP ${res.status}`); continue }
      
      const data = await res.json()
      const results = data.results ?? []
      
      console.log(`\n📄 Página ${page} (${results.length} resultados):`)
      for (const m of results) {
        console.log(`  ID: ${m.id} | "${m.name}" | entrytype: ${m.entrytype} (${m.entrytype_text ?? '?'}) | IMA status: ${m.ima_status ?? 'N/A'} | approval_year: ${m.approval_year ?? 'N/A'}`)
      }
    } catch (err) {
      console.error(`  Page ${page}: Error`, err)
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 500))
  }

  // 2. Also check: what does enttype_ids=1 actually mean?
  console.log('\n' + '═'.repeat(70))
  console.log('📊 Resumen de enttype_ids según documentación Mindat:')
  console.log('  1 = Approved mineral (IMA)')
  console.log('  2 = Variety')  
  console.log('  3 = Synonym / Obsolete name')
  console.log('  4 = Polytype')
  console.log('  5 = Group')
  console.log('  6 = Rock / Other geomaterial')
  console.log('═'.repeat(70))
}

verify()
