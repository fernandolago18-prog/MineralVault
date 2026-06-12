const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixAll() {
  console.log("Fixing translations...");
  
  // Fix 'ite' -> 'ita'
  const { data: ites } = await supabase.from('minerals').select('id, name_es').ilike('name_es', '%ite');
  for (const m of ites) {
    const fixed = m.name_es.replace(/ite/ig, 'ita');
    await supabase.from('minerals').update({ name_es: fixed }).eq('id', m.id);
  }
  console.log(`Fixed ${ites.length} '-ite' names.`);

  // Fix 'group' -> 'Grupo'
  const { data: groups } = await supabase.from('minerals').select('id, name_es').ilike('name_es', '%group%');
  for (const m of groups) {
    let fixed = m.name_es.replace(/Supergroup/ig, 'Supergrupo').replace(/Group/ig, 'Grupo');
    await supabase.from('minerals').update({ name_es: fixed }).eq('id', m.id);
  }
  console.log(`Fixed ${groups.length} 'Group' names.`);

  console.log("\nFixing poor parent sheets...");
  const { data: children } = await supabase.from('minerals')
    .select('parent_mindat_id')
    .not('parent_mindat_id', 'is', null);
    
  const parentIds = [...new Set(children.map(c => c.parent_mindat_id))];
  
  const { data: poorParents } = await supabase.from('minerals')
    .select('id, mindat_id, name')
    .in('mindat_id', parentIds)
    .is('streak', null)
    .is('hardness_min', null);

  let fixedParents = 0;
  for (const p of poorParents) {
    // get children
    const { data: pChildren } = await supabase.from('minerals')
      .select('*')
      .eq('parent_mindat_id', p.mindat_id)
      .not('streak', 'is', null)
      .limit(1);
      
    if (pChildren && pChildren.length > 0) {
      const child = pChildren[0];
      await supabase.from('minerals').update({
        streak: child.streak,
        hardness_min: child.hardness_min,
        hardness_max: child.hardness_max,
        density_min: child.density_min,
        density_max: child.density_max,
        cleavage: child.cleavage,
        fracture: child.fracture,
        tenacity: child.tenacity,
        chemical_formula: child.chemical_formula,
        mineral_class: child.mineral_class
      }).eq('id', p.id);
      fixedParents++;
      console.log(`- Enriched ${p.name} using properties from ${child.name}`);
    }
  }
  console.log(`Enriched ${fixedParents} poor parent sheets.`);
}
fixAll();
