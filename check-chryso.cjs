const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkChryso() {
  const { data, error } = await supabase.from('minerals').select('id, name, name_es, parent_mindat_id').ilike('name', '%chrysoprase%');
  console.log("Chrysoprase Data:", data, error);

  if (data && data.length > 0) {
    console.log("Fixing translation to Crisoprasa...");
    await supabase.from('minerals').update({ name_es: 'Crisoprasa' }).ilike('name', '%chrysoprase%');
    console.log("Fixed.");
  }
}
checkChryso();
