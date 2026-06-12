const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeDatabase() {
  console.log("Analyzing translations...");
  const { count: untranslatedCount, error: e1 } = await supabase.from('minerals')
    .select('id', { count: 'exact', head: true })
    .ilike('name_es', '%ite');
  
  const { count: untranslatedGroupCount, error: e2 } = await supabase.from('minerals')
    .select('id', { count: 'exact', head: true })
    .ilike('name_es', '%group%');
    
  console.log(`Minerals ending in 'ite' (likely English): ${untranslatedCount}`);
  console.log(`Minerals containing 'group' (likely English): ${untranslatedGroupCount}`);

  console.log("\nAnalyzing poor parent sheets...");
  // Find all minerals that are parents
  const { data: children, error: e3 } = await supabase.from('minerals')
    .select('parent_mindat_id')
    .not('parent_mindat_id', 'is', null);
    
  const parentIds = [...new Set(children.map(c => c.parent_mindat_id))];
  console.log(`Found ${parentIds.length} unique parent minerals.`);
  
  if (parentIds.length > 0) {
    const { data: poorParents, error: e4 } = await supabase.from('minerals')
      .select('name, mindat_id')
      .in('mindat_id', parentIds)
      .is('streak', null)
      .is('hardness_min', null);
      
    console.log(`Found ${poorParents.length} parent minerals with poor sheets (missing streak and hardness).`);
    console.log("Some examples:", poorParents.slice(0, 5).map(p => p.name));
  }
}
analyzeDatabase();
