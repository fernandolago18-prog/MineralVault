/**
 * Ejecuta la migración 004 via Supabase Management API
 * Limpia hardness=0 y mejora la función search_minerals
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extraer project ref de la URL (ej: https://abcdef.supabase.co -> abcdef)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function runMigration() {
  console.log('=== EJECUTANDO MIGRACIÓN 004 ===\n');
  console.log('Project ref:', projectRef);
  
  // Leer el SQL de la migración
  const sqlFile = path.join(__dirname, '../supabase/migrations/004_cleanup_and_improve_search.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  
  // Usar el endpoint de Management API para ejecutar SQL
  // POST https://api.supabase.com/v1/projects/{ref}/database/query
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.log('Management API failed:', response.status, text.slice(0, 300));
    console.log('\nAlternative: trying via pg connection string...');
    
    // Alternativa: usar el endpoint SQL de Supabase REST
    // El service role puede ejecutar SQL via /rest/v1/rpc si hay una función
    await runViaRPC();
    return;
  }
  
  const result = await response.json();
  console.log('Result:', JSON.stringify(result, null, 2));
}

async function runViaRPC() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  console.log('\n=== ESTRATEGIA ALTERNATIVA: Crear función + llamar RPC ===\n');
  
  // Primero crear la función de limpieza
  // No podemos ejecutar DDL vía supabase-js directamente, pero sí podemos
  // usar el endpoint /pg del proyecto de Supabase
  
  // La forma correcta: usar el SQL editor API de Supabase 
  const pgUrl = `${SUPABASE_URL}/pg/query`;
  const resp = await fetch(pgUrl, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      query: 'UPDATE public.minerals SET hardness_min = NULL, hardness_max = NULL WHERE hardness_min = 0 OR hardness_max = 0',
    }),
  });
  
  console.log('PG endpoint status:', resp.status);
  const text = await resp.text();
  console.log('Response:', text.slice(0, 300));
}

runMigration().catch(console.error);
