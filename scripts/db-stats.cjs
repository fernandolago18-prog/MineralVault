require('dotenv').config({path:'.env.local'});
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { count: total, error: errTotal } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true });

  const { count: withDesc, error: errDesc } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })
    .not('description', 'is', null);

  const { count: withNameEs, error: errNameEs } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })
    .not('name_es', 'is', null);

  const { count: withFormula, error: errFormula } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })
    .not('chemical_formula', 'is', null);

  const { count: withHardness, error: errHardness } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })
    .not('hardness_min', 'is', null);

  const { count: withMindatId, error: errMindatId } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })
    .not('mindat_id', 'is', null);

  console.log('Total minerals:', total);
  console.log('With description:', withDesc);
  console.log('With name_es:', withNameEs);
  console.log('With chemical_formula:', withFormula);
  console.log('With hardness_min:', withHardness);
  console.log('With mindat_id:', withMindatId);

  // Print a sample of 10 minerals
  const { data: sample, error: errSample } = await supabase
    .from('minerals')
    .select('id, name, mindat_id')
    .limit(10);
  console.log('Sample minerals:', sample);
}

main().catch(console.error);
