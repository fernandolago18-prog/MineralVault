const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMoly() {
  const { data, error } = await supabase.from('minerals').select('*').ilike('name', '%molybdenite%');
  console.log("Molybdenite Data:");
  console.dir(data, { depth: null });
}
checkMoly();
