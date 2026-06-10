require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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
  console.log('=== TRADUCCIÓN DE MINERALES CON WIKIDATA (P6263) ===\n');

  console.log('1. Obteniendo todas las traducciones de Wikidata...');
  const wikidataRows = await queryWikidata(`
    SELECT ?mindatId ?nameEs WHERE {
      ?item wdt:P6263 ?mindatId .
      ?item rdfs:label ?nameEs .
      FILTER(LANG(?nameEs) = "es")
    }
  `);

  console.log(`Encontradas ${wikidataRows.length} traducciones en Wikidata.`);

  const wikidataMap = {}; // mindatId -> nameEs
  for (const r of wikidataRows) {
    const id = parseInt(r.mindatId?.value);
    const label = r.nameEs?.value;
    if (!isNaN(id) && label) {
      // Si ya existe y el nuevo es lowercase, preferir con mayúscula si procede,
      // pero en general guardamos el label.
      wikidataMap[id] = label;
    }
  }

  const mindatIds = Object.keys(wikidataMap).map(Number);
  console.log(`Total de IDs únicos de Mindat mapeados: ${mindatIds.length}`);

  console.log('\n2. Buscando coincidencias en nuestra base de datos...');
  let matchedMinerals = [];
  
  // Buscar en la DB cuáles existen
  for (let i = 0; i < mindatIds.length; i += 500) {
    const batch = mindatIds.slice(i, i + 500);
    const { data, error } = await supabase
      .from('minerals')
      .select('id, mindat_id, name, description')
      .in('mindat_id', batch);
    
    if (error) {
      console.error('Error al consultar lote de la DB:', error);
      continue;
    }
    if (data) {
      matchedMinerals.push(...data);
    }
  }

  console.log(`De las traducciones de Wikidata, ${matchedMinerals.length} existen en nuestra DB.`);
  const withDesc = matchedMinerals.filter(m => m.description != null).length;
  console.log(`De las coincidentes, ${withDesc} tienen descripción.`);

  console.log('\n3. Actualizando name_es en la base de datos...');
  let updatedCount = 0;
  let errorCount = 0;

  // Actualizar uno por uno o en transacciones. Dado que son unos ~1000 a 1500, podemos hacerlo en lotes o uno por uno.
  // Hacerlo uno por uno en paralelo (con límite de concurrencia) o secuencial rápido.
  // Vamos a usar un bucle y promesas para actualizar de forma controlada.
  const batchSize = 50;
  for (let i = 0; i < matchedMinerals.length; i += batchSize) {
    const batch = matchedMinerals.slice(i, i + batchSize);
    const promises = batch.map(async (min) => {
      const translation = wikidataMap[min.mindat_id];
      if (!translation) return;

      // Normalizar: Capitalizar primera letra si viene en minúsculas en Wikidata
      let normalizedTranslation = translation.trim();
      if (normalizedTranslation.length > 0) {
        normalizedTranslation = normalizedTranslation.charAt(0).toUpperCase() + normalizedTranslation.slice(1);
      }

      const { error } = await supabase
        .from('minerals')
        .update({ name_es: normalizedTranslation })
        .eq('id', min.id);

      if (error) {
        errorCount++;
      } else {
        updatedCount++;
      }
    });

    await Promise.all(promises);
    if ((i + batchSize) % 250 === 0 || i + batchSize >= matchedMinerals.length) {
      console.log(`  Procesados: ${Math.min(i + batchSize, matchedMinerals.length)} / ${matchedMinerals.length}...`);
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`Actualizados con éxito: ${updatedCount}`);
  console.log(`Errores: ${errorCount}`);
}

main().catch(console.error);
