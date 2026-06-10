require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const testTerms = ['cuarzo', 'pirita', 'yeso', 'malaquita', 'oro', 'plata'];

  console.log('=== PRUEBA DE BÚSQUEDA EN ESPAÑOL ===\n');

  for (const term of testTerms) {
    const { data, error } = await supabase.rpc('search_minerals', {
      search_query: term,
      page_size: 5
    });

    if (error) {
      console.error(`Error al buscar "${term}":`, error);
      continue;
    }

    console.log(`Búsqueda: "${term}" -> Encontrados: ${data ? data.length : 0}`);
    if (data && data.length > 0) {
      data.forEach(m => {
        console.log(`  - name_es: "${m.name_es}" | name_en: "${m.name}" | class: "${m.mineral_class}"`);
      });
    }
    console.log();
  }
}

main().catch(console.error);
