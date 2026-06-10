const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const MINDAT_API_KEY = process.env.MINDAT_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  console.log('=== MINDAT API vs LOCAL DB: QUARTZ VARIETIES ===\n');
  
  // 1. Fetch from Mindat API: varieties of Quartz (varietyof=3337)
  const url = `https://api.mindat.org/v1/geomaterials/?format=json&varietyof=3337`;
  console.log(`Fetching Quartz varieties from Mindat API: ${url}...`);
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Token ${MINDAT_API_KEY}`, 'Accept': 'application/json' }
  });
  
  if (!res.ok) {
    console.error(`Mindat API error: HTTP ${res.status}`);
    return;
  }
  
  const data = await res.json();
  const mindatVarieties = data.results ?? [];
  console.log(`Mindat API returned ${mindatVarieties.length} varieties for Quartz.`);
  
  // 2. Fetch from local DB: varieties of Quartz (parent_mindat_id=3337)
  console.log('Fetching Quartz varieties from local database...');
  const { data: dbVarieties, error } = await supabase
    .from('minerals')
    .select('mindat_id, name')
    .eq('parent_mindat_id', 3337);
    
  if (error) {
    console.error('Local DB error:', error);
    return;
  }
  
  console.log(`Local DB has ${dbVarieties.length} varieties for Quartz.`);
  
  // 3. Compare
  const dbIds = new Set(dbVarieties.map(v => v.mindat_id));
  const missing = [];
  
  for (const m of mindatVarieties) {
    if (!dbIds.has(m.id)) {
      missing.push({ id: m.id, name: m.name, entrytype: m.entrytype, entrytype_text: m.entrytype_text });
    }
  }
  
  console.log(`\nFound ${missing.length} varieties in Mindat API that are MISSING in local DB:`);
  console.log(JSON.stringify(missing.slice(0, 20), null, 2));
  if (missing.length > 20) {
    console.log(`... and ${missing.length - 20} more.`);
  }
}

check().catch(console.error);
