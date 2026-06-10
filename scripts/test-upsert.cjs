require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Get a single mineral
  const { data: original, error: errGet } = await supabase
    .from('minerals')
    .select('*')
    .limit(1);

  if (errGet || !original || original.length === 0) {
    console.error('Error getting mineral:', errGet);
    return;
  }

  const mineral = original[0];
  console.log('Original mineral:', {
    id: mineral.id,
    name: mineral.name,
    name_es: mineral.name_es,
    chemical_formula: mineral.chemical_formula,
    description: mineral.description ? mineral.description.slice(0, 50) + '...' : null
  });

  // 2. Perform upsert with only id, name and a temporary name_es
  const testNameEs = 'Test Name Es ' + Date.now();
  console.log('Performing upsert with name_es:', testNameEs);
  const { data: upserted, error: errUpsert } = await supabase
    .from('minerals')
    .upsert({ id: mineral.id, name: mineral.name, name_es: testNameEs })
    .select('*');

  if (errUpsert || !upserted || upserted.length === 0) {
    console.error('Error during upsert:', errUpsert);
    return;
  }

  const updated = upserted[0];
  console.log('Updated mineral:', {
    id: updated.id,
    name: updated.name,
    name_es: updated.name_es,
    chemical_formula: updated.chemical_formula,
    description: updated.description ? updated.description.slice(0, 50) + '...' : null
  });

  // 3. Restore original name_es
  console.log('Restoring original name_es...');
  await supabase
    .from('minerals')
    .update({ name_es: mineral.name_es })
    .eq('id', mineral.id);
}

main().catch(console.error);
