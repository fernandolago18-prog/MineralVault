/**
 * Análisis de qué minerales pueden ser enriquecidos
 * desde el endpoint individual de Mindat vs los que ya fueron procesados
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const MINDAT_API_KEY = process.env.MINDAT_API_KEY;
const BASE = 'https://api.mindat.org/v1';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeEnrichmentPotential() {
  console.log('=== ANÁLISIS DE ENRIQUECIMIENTO ===\n');
  
  // 1. Contar minerales sin datos clave
  const { count: total } = await supabase.from('minerals').select('id', { count: 'exact', head: true });
  const { count: noDesc } = await supabase.from('minerals').select('id', { count: 'exact', head: true }).is('description', null);
  const { count: noFormula } = await supabase.from('minerals').select('id', { count: 'exact', head: true }).is('chemical_formula', null);
  const { count: noHardness } = await supabase.from('minerals').select('id', { count: 'exact', head: true }).or('hardness_min.is.null,hardness_min.eq.0');
  const { count: noCrystal } = await supabase.from('minerals').select('id', { count: 'exact', head: true }).is('crystal_system', null);
  
  console.log(`Total minerales: ${total}`);
  console.log(`Sin descripción: ${noDesc} (${Math.round(noDesc/total*100)}%)`);
  console.log(`Sin fórmula: ${noFormula} (${Math.round(noFormula/total*100)}%)`);
  console.log(`Sin dureza: ${noHardness} (${Math.round(noHardness/total*100)}%)`);
  console.log(`Sin sistema cristalino: ${noCrystal} (${Math.round(noCrystal/total*100)}%)`);
  
  // 2. Probar una muestra de 10 minerales "vacíos" para ver si tienen datos en el endpoint individual
  console.log('\n=== MUESTRA DE MINERALES VACÍOS — POTENCIAL DE ENRIQUECIMIENTO ===\n');
  
  const { data: emptySample } = await supabase.from('minerals')
    .select('id, name, mindat_id')
    .is('description', null)
    .is('chemical_formula', null)
    .not('mindat_id', 'is', null)
    .limit(10);
  
  let enrichable = 0;
  for (const mineral of emptySample) {
    const r = await fetch(`${BASE}/geomaterials/${mineral.mindat_id}/?format=json`, {
      headers: { 'Authorization': `Token ${MINDAT_API_KEY}` }
    });
    const d = await r.json();
    
    const hasDesc = d.description_short && d.description_short.trim() !== '';
    const hasFormula = d.ima_formula && d.ima_formula.trim() !== '';
    const hasHardness = d.hmin && d.hmin > 0;
    const hasColor = d.colour && d.colour.trim() !== '';
    
    const score = [hasDesc, hasFormula, hasHardness, hasColor].filter(Boolean).length;
    if (score > 0) enrichable++;
    
    console.log(`${mineral.name} (${mineral.mindat_id}): desc=${hasDesc ? '✓' : '✗'} formula=${hasFormula ? '✓' : '✗'} hardness=${hasHardness ? '✓' : '✗'} color=${hasColor ? '✓' : '✗'}`);
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\nEnriquecibles en la muestra: ${enrichable}/10 (${enrichable*10}% estimado)`);
  console.log(`\nConclusion:`);
  console.log(`- Si el ${enrichable*10}% de ${noDesc} minerales sin desc son enriquecibles...`);
  console.log(`- Eso seria ~${Math.round(noDesc * enrichable/10).toLocaleString()} minerales potencialmente enriquecibles`);
  
  // 3. Ver si hay API de Mindat v2 con más datos
  console.log('\n=== PROBANDO API v2 de Mindat ===');
  const r2 = await fetch(`https://api.mindat.org/v2/minerals_ima/?format=json&limit=1`, {
    headers: { 'Authorization': `Token ${MINDAT_API_KEY}` }
  });
  console.log('v2 status:', r2.status);
  if (r2.ok) {
    const d2 = await r2.json();
    console.log('v2 fields:', Object.keys(d2.results?.[0] || {}).join(', '));
  } else {
    const text = await r2.text();
    console.log('v2 response:', text.slice(0, 100));
  }
}

analyzeEnrichmentPotential().catch(console.error);
