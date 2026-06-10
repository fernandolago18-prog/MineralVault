const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function search() {
  console.log('Searching in DB for name ILIKE %quartz% or %amatista% or %amethyst%...');
  const { data, error } = await supabase
    .from('minerals')
    .select('id, mindat_id, parent_mindat_id, name, name_es')
    .or('name.ilike.%quartz%,name_es.ilike.%quartz%,name.ilike.%amethyst%,name_es.ilike.%amatista%')
    .limit(30);

  if (error) {
    console.error('Error querying database:', error);
  } else {
    console.log(`Found ${data.length} matches:`);
    console.log(data);
  }
}

search();
