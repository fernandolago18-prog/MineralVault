const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('Searching database for "Limonite" or "Limonita"...');
  
  const { data: matches, error } = await supabase
    .from('minerals')
    .select('id, name, name_es, mindat_id, parent_mindat_id, crystal_system, mineral_class')
    .or('name.ilike.%limonite%,name_es.ilike.%limonita%');

  if (error) {
    console.error('Error fetching by name:', error);
    return;
  }

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => {
    console.log(`- ID: ${m.id} | Mindat ID: ${m.mindat_id} | Name: ${m.name} / ${m.name_es} | Parent Mindat ID: ${m.parent_mindat_id} | Class: ${m.mineral_class} | System: ${m.crystal_system}`);
  });
}

run();
