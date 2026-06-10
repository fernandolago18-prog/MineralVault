const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('minerals')
    .select('name, name_es, streak, color, luster, cleavage, fracture, tenacity, crystal_habits')
    .in('name', ['Quartz', 'Fluorite', 'Calcite', 'Pyrite', 'Malachite', 'Gypsum'])
    .limit(10);

  if (error) {
    console.error('Error querying database:', error);
  } else {
    console.log(`Checking ${data.length} minerals:`);
    data.forEach(m => {
      console.log(`=== Mineral: ${m.name_es} (${m.name}) ===`);
      console.log(`  Streak (Raya): ${m.streak}`);
      console.log(`  Color: ${JSON.stringify(m.color)}`);
      console.log(`  Luster (Brillo): ${JSON.stringify(m.luster)}`);
      console.log(`  Cleavage (Exfoliación): ${m.cleavage}`);
      console.log(`  Fracture (Fractura): ${m.fracture}`);
      console.log(`  Tenacity (Tenacidad): ${m.tenacity}`);
      console.log(`  Crystal Habits (Hábitos): ${JSON.stringify(m.crystal_habits)}`);
      console.log('-------------------------------------------');
    });
  }
}

check();
