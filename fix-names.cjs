const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fix() {
  console.log("Fixing Pyrrhotite...");
  await supabase.from('minerals').update({ name_es: 'Pirrotita' }).eq('name', 'Pyrrhotite');
  await supabase.from('minerals').update({ name_es: 'Apatito (Supergrupo)' }).eq('name', 'Apatite Supergroup');
  await supabase.from('minerals').update({ name_es: 'Fluorapatito' }).eq('name', 'Fluorapatite');
  await supabase.from('minerals').update({ name_es: 'Clorapatito' }).eq('name', 'Chlorapatite');
  await supabase.from('minerals').update({ name_es: 'Hidroxiapatito' }).eq('name', 'Hydroxylapatite');

  console.log("Done");
}
fix();
