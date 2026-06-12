const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const q = 'rose quartz';
  console.log(`Testing variety query with space, q = "${q}"`);

  // Query 1: Using raw space
  try {
    const { data, error } = await supabase
      .from('minerals')
      .select('id, name, name_es')
      .not('parent_mindat_id', 'is', null)
      .or(`name.ilike.%${q}%,name_es.ilike.%${q}%`);

    if (error) {
      console.log('Query 1 (raw space) Failed:', error.message, error.code);
    } else {
      console.log('Query 1 (raw space) Succeeded! Found:', data.length, 'results');
    }
  } catch (err) {
    console.error('Query 1 Exception:', err);
  }
}

run();
