/**
 * Test: Cuántos minerales de nuestra DB tienen nombre en español en Wikidata
 * Wikidata P3886 = Mindat Mineral ID → match exacto con nuestros mindat_id
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
const HEADERS = {
  'Accept': 'application/sparql-results+json',
  'User-Agent': 'MineralVault/1.0 (educational project)',
};

async function queryWikidata(sparql) {
  const url = WIKIDATA_SPARQL + '?query=' + encodeURIComponent(sparql) + '&format=json';
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) throw new Error(`Wikidata error: ${resp.status} ${await resp.text().then(t => t.slice(0, 100))}`);
  return (await resp.json()).results.bindings;
}

async function main() {
  console.log('=== TEST: Nombres en español via Wikidata (P3886 = Mindat ID) ===\n');

  // 1. Contar cuántos minerales con Mindat ID tienen nombre ES en Wikidata
  const countRows = await queryWikidata(`
    SELECT (COUNT(DISTINCT ?mindatId) AS ?total) WHERE {
      ?item wdt:P6263 ?mindatId .
      ?item rdfs:label ?nameEs .
      FILTER(LANG(?nameEs) = "es")
    }
  `);
  const wikidataTotal = countRows[0]?.total?.value;
  console.log('Minerales en Wikidata con nombre ES:', wikidataTotal);

  // 2. Muestra de los primeros 10
  console.log('\nMuestra (primeros 10):');
  const sample = await queryWikidata(`
    SELECT ?mindatId ?nameEs ?nameEn WHERE {
      ?item wdt:P6263 ?mindatId .
      OPTIONAL { ?item rdfs:label ?nameEs . FILTER(LANG(?nameEs) = "es") }
      OPTIONAL { ?item rdfs:label ?nameEn . FILTER(LANG(?nameEn) = "en") }
    }
    LIMIT 10
  `);
  for (const r of sample) {
    console.log(`  mindat_id=${r.mindatId?.value} | EN="${r.nameEn?.value ?? '-'}" | ES="${r.nameEs?.value ?? '-'}"`);
  }

  // 3. Ver cuántos de esos existen en nuestra DB
  console.log('\nVerificando match con nuestra DB...');
  const allWikidata = await queryWikidata(`
    SELECT ?mindatId ?nameEs WHERE {
      ?item wdt:P6263 ?mindatId .
      ?item rdfs:label ?nameEs .
      FILTER(LANG(?nameEs) = "es")
    }
  `);

  const wikidataMap = {}; // mindatId -> nameEs
  for (const r of allWikidata) {
    const id = parseInt(r.mindatId?.value);
    if (!isNaN(id)) wikidataMap[id] = r.nameEs?.value;
  }
  console.log('Entradas únicas en Wikidata con ES:', Object.keys(wikidataMap).length);

  // Verificar cuántos de esos mindat_ids existen en nuestra DB
  const mindatIds = Object.keys(wikidataMap).map(Number);
  let matched = 0;
  // Consultar en lotes de 500
  for (let i = 0; i < mindatIds.length; i += 500) {
    const batch = mindatIds.slice(i, i + 500);
    const { count } = await supabase.from('minerals')
      .select('id', { count: 'exact', head: true })
      .in('mindat_id', batch);
    matched += count ?? 0;
  }
  console.log('De esos, presentes en nuestra DB:', matched);
  console.log('Porcentaje de nuestra DB traducible:', ((matched / 64888) * 100).toFixed(1) + '%');
}

main().catch(console.error);
