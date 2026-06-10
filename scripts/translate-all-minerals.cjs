require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { translateName } = require('./translate-minerals-rules.cjs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 1000;

async function main() {
  console.log('=== TRADUCCIÓN MASIVA DE MINERALES EN LA BD ===\n');

  console.log('1. Contando minerales sin traducir...');
  const { count: totalToTranslate, error: errCount } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })
    .is('name_es', null);

  if (errCount) {
    console.error('Error al contar minerales:', errCount);
    return;
  }

  console.log(`Total de minerales sin traducción (name_es es NULL): ${totalToTranslate}`);
  if (totalToTranslate === 0) {
    console.log('¡Todos los minerales ya están traducidos!');
    return;
  }

  console.log('\n2. Iniciando traducción por lotes...');
  
  let processed = 0;
  
  // Como no queremos sobrecargar la memoria ni el servidor,
  // vamos a ir consultando y actualizando secuencialmente por lotes.
  while (true) {
    // Traer un lote de 1000 sin traducir
    const { data: batchData, error: errFetch } = await supabase
      .from('minerals')
      .select('id, name')
      .is('name_es', null)
      .limit(BATCH_SIZE);

    if (errFetch) {
      console.error('Error al consultar lote:', errFetch);
      break;
    }

    if (!batchData || batchData.length === 0) {
      break;
    }

    // Traducir los nombres
    const upsertPayload = batchData.map(min => {
      const nameEs = translateName(min.name);
      return {
        id: min.id,
        name: min.name,
        name_es: nameEs
      };
    });

    // Realizar upsert en la BD
    const { error: errUpsert } = await supabase
      .from('minerals')
      .upsert(upsertPayload);

    if (errUpsert) {
      console.error('Error al realizar upsert en lote:', errUpsert);
      break;
    }

    processed += batchData.length;
    console.log(`  Procesados: ${processed} / ${totalToTranslate}`);

    // Si el lote devuelto es menor que el tamaño máximo, es que terminamos
    if (batchData.length < BATCH_SIZE) {
      break;
    }
  }

  console.log('\n=== PROCESO COMPLETADO ===');
  console.log(`Minerales traducidos y actualizados: ${processed}`);
}

main().catch(console.error);
