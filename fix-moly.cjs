const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixMoly() {
  console.log("Fixing Molybdenite...");
  
  // 1. Fix main species name
  await supabase.from('minerals').update({ name_es: 'Molibdenita' }).eq('mindat_id', 2746);
  
  // 2. Link polytypes to the main species so they inherit properties, and fix their names
  await supabase.from('minerals').update({ 
    name_es: 'Molibdenita-2H',
    parent_mindat_id: 2746 
  }).eq('mindat_id', 31721);
  
  await supabase.from('minerals').update({ 
    name_es: 'Molibdenita-3R',
    parent_mindat_id: 2746 
  }).eq('mindat_id', 2745);

  console.log("Molybdenite fixed successfully!");
}
fixMoly();
