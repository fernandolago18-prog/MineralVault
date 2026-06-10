/**
 * Intenta ejecutar la migración 004 creando primero una función ejecutora
 * y luego llamándola via RPC con el service role key
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Usar service role para operaciones admin
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
  console.log('=== Intentando ejecutar migración vía RPC executor ===\n');
  
  // Intentar llamar la función de limpieza que creamos antes (si existe)
  const { data: cleanResult, error: cleanError } = await supabaseAdmin.rpc('cleanup_zero_hardness');
  if (cleanError) {
    console.log('cleanup_zero_hardness no existe:', cleanError.message);
  } else {
    console.log('cleanup_zero_hardness ejecutado:', cleanResult, 'registros actualizados');
  }
  
  // Verificar estado actual
  const { count: zeros } = await supabaseAdmin.from('minerals')
    .select('id', { count: 'exact', head: true })
    .eq('hardness_min', 0);
  console.log('Hardness=0 actualmente:', zeros);
  
  // Test de búsqueda con función actual
  const { data: searchTest, error: searchErr } = await supabaseAdmin.rpc('search_minerals', {
    search_query: 'quar',
    filter_class: null,
    filter_system: null,
    hardness_min_v: null,
    hardness_max_v: null,
    page_size: 5,
    page_offset: 0,
  });
  
  if (searchErr) {
    console.log('Search "quar" error:', searchErr.message);
  } else {
    console.log('Search "quar" → resultados:', (searchTest || []).map(m => m.name).join(', ') || '(vacío - función vieja aún activa)');
  }
  
  // Probar con la palabra completa
  const { data: searchFull } = await supabaseAdmin.rpc('search_minerals', {
    search_query: 'quartz',
    filter_class: null, filter_system: null,
    hardness_min_v: null, hardness_max_v: null,
    page_size: 3, page_offset: 0,
  });
  console.log('Search "quartz" →', (searchFull || []).map(m => m.name).join(', ') || '(vacío)');
}

run().catch(console.error);
