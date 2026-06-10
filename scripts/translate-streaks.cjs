require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COLOR_MAP = {
  'white': 'blanca',
  'black': 'negra',
  'gray': 'gris',
  'grey': 'gris',
  'red': 'roja',
  'brown': 'marrón',
  'yellow': 'amarilla',
  'green': 'verde',
  'blue': 'azul',
  'orange': 'naranja',
  'pink': 'rosa',
  'colorless': 'incolora',
  'colourless': 'incolora',
  'light': 'claro',
  'pale': 'pálido',
  'dark': 'oscuro',
  'reddish': 'rojiza',
  'brownish': 'pardusca',
  'grayish': 'grisácea',
  'greyish': 'grisácea',
  'yellowish': 'amarillenta',
  'greenish': 'verdosa',
  'bluish': 'azulada',
  'blueish': 'azulada',
  'pinkish': 'rosada',
  'yellowish-brown': 'marrón amarillenta',
  'reddish-brown': 'marrón rojiza',
  'grey-greenish': 'verde grisácea',
  'grey-black': 'negra grisácea',
  'gray-black': 'negra grisácea',
  'brown-black': 'negra pardusca',
  'green-blue': 'azul verdosa',
  'to': 'a',
  'con': 'con',
  'with': 'con',
  'a': 'a',
  'or': 'o',
  'and': 'y',
  'tint': 'matiz'
};

function translateStreak(streak) {
  if (!streak) return streak;
  
  let val = streak.toLowerCase().trim();
  
  // Limpiar paréntesis comunes
  val = val.replace(/"/g, '').replace(/\(|\)/g, ' ').replace(/\s+/g, ' ').trim();

  // Reemplazar combinaciones comunes directamente
  if (val === 'white') return 'Blanca';
  if (val === 'black') return 'Negra';
  if (val === 'colorless' || val === 'colourless') return 'Incolora';
  if (val === 'white colorless') return 'Blanca / Incolora';
  if (val === 'colorless white') return 'Incolora / Blanca';

  // Dividir por palabras y traducir individualmente
  const words = val.split(/[\s\-]+/);
  const translatedWords = words.map(w => {
    return COLOR_MAP[w] || w;
  });

  let result = translatedWords.join(' ');
  
  // Limpiezas y concordancias rápidas de género/número en español
  result = result
    .replace(/claro blanca/gi, 'blanca clara')
    .replace(/claro negra/gi, 'negra clara')
    .replace(/claro roja/gi, 'roja clara')
    .replace(/claro amarilla/gi, 'amarilla clara')
    .replace(/claro verde/gi, 'verde claro')
    .replace(/claro azul/gi, 'azul claro')
    .replace(/claro rosa/gi, 'rosa claro')
    .replace(/oscuro blanca/gi, 'blanca oscura')
    .replace(/oscuro negra/gi, 'negra oscura')
    .replace(/oscuro roja/gi, 'roja oscura')
    .replace(/oscuro amarilla/gi, 'amarilla oscura')
    .replace(/oscuro verde/gi, 'verde oscuro')
    .replace(/oscuro azul/gi, 'azul oscuro')
    .replace(/pálido blanca/gi, 'blanca pálida')
    .replace(/pálido negra/gi, 'negra pálida')
    .replace(/pálido roja/gi, 'roja pálida')
    .replace(/pálido amarilla/gi, 'amarilla pálida')
    .replace(/pálido verde/gi, 'verde pálido')
    .replace(/pálido azul/gi, 'azul pálido')
    .replace(/pálido rosa/gi, 'rosa pálido')
    .replace(/marrón a negra/gi, 'marrón a negro')
    .replace(/verde a azul/gi, 'verde a azul')
    .replace(/gris a negra/gi, 'gris a negro')
    .replace(/rosa a rosada/gi, 'rosa a rosado');

  // Capitalizar
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

async function main() {
  console.log('=== TRADUCCIÓN DE RAYAS DE MINERALES ===\n');

  console.log('1. Consultando minerales con color de raya...');
  const { data, error } = await supabase
    .from('minerals')
    .select('id, name, streak')
    .not('streak', 'is', null);

  if (error) {
    console.error('Error al consultar rayas:', error);
    return;
  }

  console.log(`Encontrados ${data.length} minerales con raya definida.`);

  console.log('\nMuestra de traducciones:');
  const samples = data.slice(0, 15);
  for (const s of samples) {
    console.log(`  "${s.streak}" -> "${translateStreak(s.streak)}"`);
  }

  console.log('\n2. Actualizando en la base de datos...');
  let updated = 0;
  
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      const translated = translateStreak(item.streak);
      if (translated === item.streak) return; // No cambiar si no varía

      const { error: errUpdate } = await supabase
        .from('minerals')
        .update({ streak: translated })
        .eq('id', item.id);
      
      if (!errUpdate) updated++;
    });

    await Promise.all(promises);
    if ((i + batchSize) % 500 === 0 || i + batchSize >= data.length) {
      console.log(`  Procesados: ${Math.min(i + batchSize, data.length)} / ${data.length}...`);
    }
  }

  console.log(`\n=== PROCESO COMPLETADO ===`);
  console.log(`Registros actualizados: ${updated}`);
}

main().catch(console.error);
