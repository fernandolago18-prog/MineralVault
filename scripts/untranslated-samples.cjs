require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('minerals')
    .select('name, mindat_id')
    .is('name_es', null)
    .not('description', 'is', null)
    .limit(100);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Sample untranslated minerals with description:');
  const names = data.map(m => m.name);
  console.log(JSON.stringify(names, null, 2));
}

main().catch(console.error);
