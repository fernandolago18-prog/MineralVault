const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addChryso() {
  // Check if Chalcedony exists
  const { data: qData } = await supabase.from('minerals').select('mindat_id, name').in('mindat_id', [3337, 960]);
  console.log("Parents:", qData);

  const parentId = qData.find(q => q.mindat_id === 960) ? 960 : (qData.find(q => q.mindat_id === 3337) ? 3337 : null);

  console.log("Adding Chrysoprase with parent:", parentId);
  
  const chryso = {
    mindat_id: 952,
    name: 'Chrysoprase',
    name_es: 'Crisoprasa',
    chemical_formula: 'SiO<sub>2</sub>',
    hardness_min: 6.5,
    hardness_max: 7,
    density_min: 2.58,
    density_max: 2.64,
    streak: 'Blanca',
    luster: ['Vitreous', 'Waxy'],
    transparency: 'Translucent',
    color: ['Apple green', 'yellowish green'],
    crystal_system: 'Trigonal',
    cleavage: 'None',
    fracture: 'Conchoidal',
    mineral_class: 'Silicates',
    description: 'Variedad de calcedonia verde manzana que contiene pequeñas cantidades de níquel. Muy valorada como piedra semipreciosa.',
    mindat_url: 'https://www.mindat.org/min-952.html',
    parent_mindat_id: parentId,
    is_rock: false,
    model_3d_config: { habit: 'Massive', params: { a: 1, b: 1, c: 1 }, system: 'Trigonal' }
  };

  const { error } = await supabase.from('minerals').upsert(chryso, { onConflict: 'mindat_id' });
  if (error) console.error("Error inserting:", error);
  else console.log("Chrysoprase added successfully!");
}
addChryso();
