/**
 * Diagnóstico exacto del bug de búsqueda
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSearch(query) {
  const { data, error } = await supabase.rpc('search_minerals', {
    search_query: query,
    filter_class: null,
    filter_system: null,
    hardness_min_v: null,
    hardness_max_v: null,
    page_size: 5,
    page_offset: 0,
  });
  if (error) {
    console.log(`"${query}" → ERROR: ${error.message}`);
  } else {
    const names = (data || []).map(m => m.name).slice(0, 3);
    console.log(`"${query}" → ${data?.length ?? 0} resultados: ${names.join(', ') || '(vacío)'}`);
  }
}

async function run() {
  console.log('=== TEST DE BÚSQUEDA ===\n');
  // Nombres en inglés (deberían funcionar)
  await testSearch('quartz');
  await testSearch('Quartz');
  await testSearch('diamond');
  await testSearch('malachite');
  // Búsquedas parciales
  await testSearch('quar');
  await testSearch('mal');
  // Nombres científicos con caracteres especiales
  await testSearch('Nchwaningit');
  await testSearch('Azurit');
  await testSearch('azur');
  // Nombres con letras especiales
  await testSearch('Muscovite');
  await testSearch('muscov');
  // Una sola letra
  await testSearch('a');
  // String que definitivamente existe
  const { data: first } = await supabase.from('minerals').select('name').limit(1).single();
  console.log('\nPrimer mineral en DB:', first?.name);
  await testSearch(first?.name);
  await testSearch(first?.name?.toLowerCase());
  await testSearch(first?.name?.slice(0, 3));
}

run().catch(console.error);
