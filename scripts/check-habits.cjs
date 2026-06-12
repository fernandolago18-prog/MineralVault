require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('=== MINERALS WITH HABITS AND SYSTEMS ===\n');

  const { data, error } = await supabase
    .from('minerals')
    .select('id, mindat_id, name, name_es, crystal_system, crystal_habits')
    .not('crystal_system', 'is', null)
    .limit(100);

  if (error) {
    console.error(error);
    return;
  }

  for (const m of data) {
    console.log(`- ID: ${m.id} | Name: ${m.name_es || m.name} | System: ${m.crystal_system} | Habits: ${JSON.stringify(m.crystal_habits)}`);
  }
}

main().catch(console.error);
