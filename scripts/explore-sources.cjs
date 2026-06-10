/**
 * Explora todos los endpoints disponibles en la API de Mindat v1
 * y busca fuentes alternativas de datos para enriquecer minerales
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const MINDAT_API_KEY = process.env.MINDAT_API_KEY;
const BASE = 'https://api.mindat.org/v1';

async function exploreAPI() {
  console.log('=== EXPLORANDO ENDPOINTS DE MINDAT API v1 ===\n');
  
  // Endpoint raíz - ver qué recursos hay
  const root = await fetch(`${BASE}/?format=json`, {
    headers: { 'Authorization': `Token ${MINDAT_API_KEY}` }
  });
  console.log('Root status:', root.status);
  if (root.ok) {
    const rootData = await root.json();
    console.log('Available endpoints:', JSON.stringify(rootData, null, 2));
  }
}

async function testAlternativeSources() {
  console.log('\n=== PROBANDO FUENTES ALTERNATIVAS ===\n');
  
  // Wikipedia API - buscar info de un mineral
  const wikiQuartz = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Quartz');
  if (wikiQuartz.ok) {
    const data = await wikiQuartz.json();
    console.log('Wikipedia Quartz extract:', data.extract?.slice(0, 200));
  }
  
  // Buscar en Wikipedia por nombre
  const wikiSearch = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=Malachite+mineral&format=json&srlimit=1');
  if (wikiSearch.ok) {
    const data = await wikiSearch.json();
    console.log('Wikipedia search Malachite:', JSON.stringify(data.query?.search?.[0]));
  }
  
  // PubChem para fórmulas químicas
  const pubchem = await fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/quartz/property/MolecularFormula,IUPACName,MolecularWeight/JSON');
  if (pubchem.ok) {
    const data = await pubchem.json();
    console.log('\nPubChem Quartz:', JSON.stringify(data.PropertyTable?.Properties?.[0]));
  }
}

async function testMindatOtherEndpoints() {
  console.log('\n=== OTROS ENDPOINTS MINDAT ===\n');
  
  const endpoints = [
    '/localities/?format=json&limit=1',
    '/localities/geomaterials/?format=json&limit=1',
    '/geomaterials/?format=json&limit=1&fields=id,name,description_short,hmin,hmax,ima_formula,colour,csystem',
    '/geomaterials/3337/?format=json&fields=id,name,description_short,hmin,hmax,ima_formula,colour,csystem,streak,lustretype',
  ];
  
  for (const ep of endpoints) {
    const r = await fetch(`${BASE}${ep}`, {
      headers: { 'Authorization': `Token ${MINDAT_API_KEY}` }
    });
    console.log(`${ep}: status=${r.status}`);
    if (r.ok) {
      const d = await r.json();
      if (d.results) {
        console.log('  Fields:', Object.keys(d.results[0] || {}).join(', '));
      } else {
        console.log('  Response keys:', Object.keys(d).slice(0, 10).join(', '));
      }
    }
  }
  
  // Test if we can filter by fields with 'fields' param
  console.log('\n=== TEST: Paginación con filtro de minerales sin datos ===');
  // Mindat v1 tiene parámetro 'weighting' y 'description_short' que indica popularidad
  const r = await fetch(`${BASE}/geomaterials/?format=json&limit=5&ordering=-weighting&enttype_ids=1`, {
    headers: { 'Authorization': `Token ${MINDAT_API_KEY}` }
  });
  if (r.ok) {
    const d = await r.json();
    console.log('Top minerals by weighting:');
    for (const m of d.results) {
      console.log(`  ${m.name}: weighting=${m.weighting}, desc=${m.description_short ? 'YES' : 'NO'}, formula=${m.ima_formula ? 'YES' : 'NO'}`);
    }
  }
}

exploreAPI().then(testAlternativeSources).then(testMindatOtherEndpoints).catch(console.error);
