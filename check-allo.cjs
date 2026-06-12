const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllophane() {
  const { data, error } = await supabase.from('minerals').select('id, name, name_es, mindat_id').ilike('name', '%allophane%');
  console.log("Allophane Data:", data, error);

  if (data && data.length > 0) {
    console.log("Fixing translation to Alofana...");
    await supabase.from('minerals').update({ name_es: 'Alofana' }).eq('mindat_id', 139);
    console.log("Fixed.");
  } else {
    console.log("Adding Allophane...");
    const allo = {
      mindat_id: 139,
      name: 'Allophane',
      name_es: 'Alofana',
      chemical_formula: 'Al<sub>2</sub>O<sub>3</sub>·(SiO<sub>2</sub>)<sub>1.3-2</sub>·(H<sub>2</sub>O)<sub>2.5-3</sub>',
      hardness_min: 3,
      hardness_max: 3,
      density_min: 1.8,
      density_max: 1.9,
      streak: 'Blanca',
      luster: ['Vitreous', 'Waxy', 'Earthy'],
      transparency: 'Translucent, Opaque',
      color: ['Blue', 'green', 'brown', 'yellow', 'colorless'],
      crystal_system: 'Amorphous',
      cleavage: 'None',
      fracture: 'Conchoidal',
      mineral_class: 'Silicates',
      description: 'Mineral de la arcilla amorfo a pobremente cristalino. Nombre procedente del griego "allos" (otro) y "phanos" (aparecer), en alusión a su engañosa apariencia bajo el soplete.',
      mindat_url: 'https://www.mindat.org/min-139.html',
      is_rock: false,
      model_3d_config: { habit: 'Amorphous', params: { a: 1, b: 1, c: 1 }, system: 'Amorphous' }
    };
    await supabase.from('minerals').upsert(allo, { onConflict: 'mindat_id' });
    console.log("Added Allophane successfully!");
  }
}
checkAllophane();
