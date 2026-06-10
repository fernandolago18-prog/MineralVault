/**
 * Ejecuta la actualización de la migración 006 usando supabase-js con service_role
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runUpdate() {
  console.log('=== ACTUALIZACIÓN MIGRACIÓN 006 VÍA SUPABASE-JS ===');
  console.log('Conectando a:', SUPABASE_URL);

  // Contar antes
  const { count: countBefore, error: eBefore } = await supabase
    .from('minerals')
    .select('id', { count: 'exact', head: true })
    .eq('parent_mindat_id', 0);

  if (eBefore) {
    console.error('Error counting before:', eBefore.message);
    return;
  }
  console.log(`Minerales con parent_mindat_id = 0 antes de la actualización: ${countBefore}`);

  if (countBefore === 0) {
    console.log('No hay minerales con parent_mindat_id = 0. Saltando actualización.');
  } else {
    console.log('Ejecutando update...');
    // Realizar la actualización en chunks o todo de golpe (Supabase rest soporta bulk update)
    const { data, error: eUpdate } = await supabase
      .from('minerals')
      .update({ parent_mindat_id: null })
      .eq('parent_mindat_id', 0)
      .select('id');

    if (eUpdate) {
      console.error('Error durante la actualización:', eUpdate.message);
      return;
    }
    console.log(`Actualización completada. Filas afectadas: ${data?.length ?? 0}`);
  }

  // Verificar
  console.log('\n=== VERIFICACIÓN ===');
  
  // 1. Contar parent_mindat_id = 0
  const { count: zeros, error: e1 } = await supabase
    .from('minerals')
    .select('id', { count: 'exact', head: true })
    .eq('parent_mindat_id', 0);
    
  if (e1) {
    console.log('Error counting zeroes:', e1.message);
  } else {
    console.log('Minerales con parent_mindat_id = 0 restantes:', zeros);
  }

  // 2. Buscar Fantappièite
  const { data: testSearch, error: e2 } = await supabase.rpc('search_minerals', {
    search_query: 'Fantappièite',
    filter_class: null,
    filter_system: null,
    hardness_min_v: null,
    hardness_max_v: null,
    page_size: 5,
    page_offset: 0,
  });
  
  if (e2) {
    console.log('Error searching Fantappièite:', e2.message);
  } else {
    console.log('Búsqueda "Fantappièite":', (testSearch || []).map(m => m.name).join(', ') || '(sin resultados)');
  }

  console.log('\n✅ Proceso completado');
}

runUpdate().catch(console.error);
