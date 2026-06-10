require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('=== SISTEMAS CRISTALINOS EN LA BD ===\n');

  let allData = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('minerals')
      .select('crystal_system')
      .not('crystal_system', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(error);
      return;
    }

    if (!data || data.length === 0) break;
    allData.push(...data);
    offset += data.length;
  }

  const counts = {};
  for (const row of allData) {
    const sys = row.crystal_system;
    counts[sys] = (counts[sys] ?? 0) + 1;
  }

  console.log('Sistemas cristalinos encontrados en la DB:');
  console.log(JSON.stringify(counts, null, 2));
}

main().catch(console.error);
