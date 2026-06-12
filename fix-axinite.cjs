const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixAxinite() {
  console.log("Updating generic Axinite...");
  const { data, error } = await supabase.from('minerals')
    .update({
      streak: 'Blanca',
      chemical_formula: '(Ca,Fe,Mn,Mg)<sub>3</sub>Al<sub>2</sub>BO<sub>3</sub>Si<sub>4</sub>O<sub>12</sub>(OH)',
      mineral_class: 'Silicates',
      density_min: 3.16,
      density_max: 3.36,
      cleavage: 'Distinct/Good',
      fracture: 'Irregular/Uneven,Conchoidal',
      tenacity: 'brittle'
    })
    .eq('mindat_id', 440);

  if (error) console.error("Error updating Axinite:", error);
  else console.log("Axinite updated successfully!");
}
fixAxinite();
