/**
 * Ejecuta la migración 004 directamente en Supabase
 * Usa el endpoint de PostgreSQL REST que acepta SQL arbitrario con service_role
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Extraer project ref (ej: https://xyzxyz.supabase.co -> xyzxyz)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function executeSQL(sql, description) {
  console.log(`\n▶ ${description}...`);
  
  // Intentar via Management API
  const resp = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (resp.ok) {
    const data = await resp.json();
    console.log(`  ✅ OK:`, JSON.stringify(data).slice(0, 200));
    return true;
  }

  const errText = await resp.text();
  console.log(`  ⚠️  Management API (${resp.status}):`, errText.slice(0, 150));
  return false;
}

async function runMigration() {
  console.log('=== MIGRACION 004: Fix búsqueda + limpieza hardness=0 ===');
  console.log(`Project: ${projectRef}`);

  // ── Paso 1: Habilitar pg_trgm extension ──
  await executeSQL(
    `CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
    'Habilitar extensión pg_trgm'
  );

  // ── Paso 2: Limpiar hardness = 0 ──
  await executeSQL(
    `UPDATE public.minerals SET hardness_min = NULL, hardness_max = NULL WHERE hardness_min = 0 OR hardness_max = 0;`,
    'Limpiar hardness_min/max = 0'
  );

  // ── Paso 3: Crear índices trigrama ──
  await executeSQL(
    `DROP INDEX IF EXISTS idx_minerals_name_trgm; CREATE INDEX idx_minerals_name_trgm ON public.minerals USING gin(name gin_trgm_ops);`,
    'Crear índice trigrama en name'
  );

  await executeSQL(
    `DROP INDEX IF EXISTS idx_minerals_name_es_trgm; CREATE INDEX idx_minerals_name_es_trgm ON public.minerals USING gin(name_es gin_trgm_ops);`,
    'Crear índice trigrama en name_es'
  );

  // ── Paso 4: Nueva función search_minerals ──
  const sql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/004_cleanup_and_improve_search.sql'),
    'utf-8'
  );

  // Extraer solo el CREATE FUNCTION
  const funcStart = sql.indexOf('CREATE OR REPLACE FUNCTION public.search_minerals');
  const funcEnd = sql.indexOf('\n$$;', funcStart) + 4;
  const funcSQL = sql.substring(funcStart, funcEnd);

  await executeSQL(
    `DROP FUNCTION IF EXISTS public.search_minerals(text, text, text, numeric, numeric, integer, integer);`,
    'Drop función anterior'
  );

  await executeSQL(funcSQL, 'Crear nueva función search_minerals');

  // ── Paso 5: Verificar ──
  console.log('\n=== VERIFICACIÓN ===');
  const { data: testSearch, error: e1 } = await supabase.rpc('search_minerals', {
    search_query: 'quartz',
    filter_class: null,
    filter_system: null,
    hardness_min_v: null,
    hardness_max_v: null,
    page_size: 5,
    page_offset: 0,
  });
  
  if (e1) {
    console.log('Error al buscar "quartz":', e1.message);
  } else {
    console.log('Búsqueda "quartz":', (testSearch || []).map(m => m.name).join(', ') || '(sin resultados)');
  }

  // Contar hardness=0 restantes
  const { count: zeros } = await supabase.from('minerals')
    .select('id', { count: 'exact', head: true })
    .eq('hardness_min', 0);
  console.log('Hardness=0 restantes:', zeros);

  console.log('\n✅ Migración completada');
}

runMigration().catch(console.error);
