/**
 * Ejecuta la migración 009 (agregar campo is_rock y filtro por tipo) en Supabase
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function runMigration() {
  console.log('=== EJECUTANDO MIGRACION 009 EN SUPABASE ===');
  
  const sqlFile = path.join(__dirname, '../supabase/migrations/009_add_is_rock.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  // Método 1: Endpoint pg/query
  console.log('\nIntentando Método 1: Endpoint local pg/query de Supabase...');
  try {
    const pgUrl = `${SUPABASE_URL}/pg/query`;
    const resp = await fetch(pgUrl, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    console.log('  Status:', resp.status);
    const text = await resp.text();
    console.log('  Respuesta:', text.slice(0, 300));
    if (resp.ok) {
      console.log('  ✅ Método 1 COMPLETADO CON ÉXITO');
      return;
    }
  } catch (err) {
    console.log('  ⚠️ Método 1 falló con excepción:', err.message);
  }

  // Método 2: API de Gestión (Management API)
  console.log('\nIntentando Método 2: Supabase Management API...');
  try {
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

    console.log('  Status:', resp.status);
    const text = await resp.text();
    console.log('  Respuesta:', text.slice(0, 300));
    if (resp.ok) {
      console.log('  ✅ Método 2 COMPLETADO CON ÉXITO');
      return;
    }
  } catch (err) {
    console.log('  ⚠️ Método 2 falló con excepción:', err.message);
  }

  console.log('\n❌ Ambos métodos fallaron. Esto es común si se requieren tokens PAT de Supabase.');
  console.log('💡 POR FAVOR, COPIA EL CONTENIDO DE:');
  console.log(`   ${sqlFile}`);
  console.log('Y PÉGALO en el SQL Editor de tu Supabase Dashboard para actualizar la función.');
}

runMigration().catch(console.error);
