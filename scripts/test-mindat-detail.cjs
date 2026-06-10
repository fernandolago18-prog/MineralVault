const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const MINDAT_API_KEY = process.env.MINDAT_API_KEY;
const BASE = 'https://api.mindat.org/v1';

async function testEndpoints() {
  const mineralId = 3337; // Quartz

  const r1 = await fetch(`${BASE}/geomaterials/${mineralId}/?format=json`, {
    headers: { 'Authorization': `Token ${MINDAT_API_KEY}` }
  });
  const d1 = await r1.json();
  
  console.log('=== QUARTZ fields from /geomaterials/3337/ ===');
  console.log('All fields:', Object.keys(d1).join(', '));
  console.log('---');
  console.log('name:', d1.name);
  console.log('hmin:', d1.hmin, '| hmax:', d1.hmax);
  console.log('description_short:', d1.description_short?.slice(0, 150));
  console.log('colour:', d1.colour);
  console.log('streak:', d1.streak);
  console.log('ima_formula:', d1.ima_formula);
  console.log('lustretype:', d1.lustretype);
  console.log('csystem:', d1.csystem);
  console.log('strunz:', d1.strunz10ed1, d1.strunz10ed2, d1.strunz10ed3, d1.strunz10ed4);
  console.log('dmeas:', d1.dmeas, '| dmeas2:', d1.dmeas2);
  console.log('cleavagetype:', d1.cleavagetype);
  console.log('fracturetype:', d1.fracturetype);
  console.log('tenacity:', d1.tenacity);
  console.log('diapheny:', d1.diapheny);
  console.log('occurrence:', d1.occurrence?.slice(0, 100));
  
  // Test also with a mineral known to be sparse (Nchwaningite mindat_id=16624)
  console.log('\n=== NCHWANINGITE from /geomaterials/16624/ ===');
  const r2 = await fetch(`${BASE}/geomaterials/16624/?format=json`, {
    headers: { 'Authorization': `Token ${MINDAT_API_KEY}` }
  });
  const d2 = await r2.json();
  console.log('name:', d2.name);
  console.log('hmin:', d2.hmin, '| hmax:', d2.hmax);
  console.log('description_short:', d2.description_short);
  console.log('colour:', d2.colour);
  console.log('ima_formula:', d2.ima_formula);
}

testEndpoints().catch(console.error);
