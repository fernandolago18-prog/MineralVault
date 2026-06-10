const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  console.log('Fetching Quartz (mindat_id: 3337)...');
  const { data: quartz, error } = await supabase
    .from('minerals')
    .select('id, mindat_id, name, name_es, crystal_habits, parent_mindat_id')
    .eq('mindat_id', 3337)
    .single();

  if (error) {
    console.error('Error fetching Quartz:', error);
    return;
  }

  console.log('Quartz data:', quartz);

  console.log('\nFetching varieties of Quartz (parent_mindat_id: 3337)...');
  const { data: varieties, error: varError } = await supabase
    .from('minerals')
    .select('id, mindat_id, name, name_es, parent_mindat_id, crystal_habits')
    .eq('parent_mindat_id', 3337);

  if (varError) {
    console.error('Error fetching varieties:', varError);
    return;
  }

  console.log(`Found ${varieties.length} varieties:`);
  varieties.forEach(v => {
    console.log(`- ID: ${v.id} | Mindat ID: ${v.mindat_id} | Name: ${v.name} / ${v.name_es} | Habits: ${JSON.stringify(v.crystal_habits)}`);
  });
}

check();
