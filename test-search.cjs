const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('minerals').select('id, name, name_es, is_rock').ilike('name', '%pyrrhotite%');
  console.log("Pyrrhotite:", data, error);
  const { data: d2 } = await supabase.from('minerals').select('id, name, name_es, is_rock').ilike('name', '%apatite%');
  console.log("Apatite:", d2);
  const { data: d3 } = await supabase.from('minerals').select('id, name, name_es, is_rock').ilike('name_es', '%pirrotita%');
  console.log("Pirrotita ES:", d3);
  const { data: d4 } = await supabase.from('minerals').select('id, name, name_es, is_rock').ilike('name_es', '%apatito%');
  console.log("Apatito ES:", d4);
}
test();
