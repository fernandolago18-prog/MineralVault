require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const names = ['Sphalerite', 'Limonite', 'Pyrite', 'Calcite', 'Fluorite', 'Quartz', 'Gypsum', 'Baryte', 'Galena', 'Halite'];
  
  console.log('=== MAJOR MINERALS DETAILS ===\n');

  for (const name of names) {
    const { data, error } = await supabase
      .from('minerals')
      .select('id, mindat_id, name, name_es, crystal_system, crystal_habits')
      .eq('name', name)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching ${name}:`, error);
      continue;
    }

    if (data) {
      console.log(`- Name: ${data.name} (${data.name_es})`);
      console.log(`  System: ${data.crystal_system}`);
      console.log(`  Habits: ${JSON.stringify(data.crystal_habits)}`);
    } else {
      console.log(`- Name: ${name} not found by English name, trying Spanish...`);
      const { data: dataEs, error: errorEs } = await supabase
        .from('minerals')
        .select('id, mindat_id, name, name_es, crystal_system, crystal_habits')
        .eq('name_es', name)
        .maybeSingle();
      if (dataEs) {
        console.log(`  - Name: ${dataEs.name} (${dataEs.name_es})`);
        console.log(`    System: ${dataEs.crystal_system}`);
        console.log(`    Habits: ${JSON.stringify(dataEs.crystal_habits)}`);
      } else {
        console.log(`  - Not found.`);
      }
    }
  }
}

main().catch(console.error);
