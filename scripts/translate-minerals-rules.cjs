const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Diccionario de elementos en inglés -> español (para Native X -> X nativo/a)
const ELEMENTS_MAP = {
  'Osmium': { es: 'Osmio', gender: 'm' },
  'Gold': { es: 'Oro', gender: 'm' },
  'Silver': { es: 'Plata', gender: 'f' },
  'Copper': { es: 'Cobre', gender: 'm' },
  'Iron': { es: 'Hierro', gender: 'm' },
  'Lead': { es: 'Plomo', gender: 'm' },
  'Tin': { es: 'Estaño', gender: 'm' },
  'Zinc': { es: 'Zinc', gender: 'm' },
  'Mercury': { es: 'Mercurio', gender: 'm' },
  'Platinum': { es: 'Platino', gender: 'm' },
  'Antimony': { es: 'Antimonio', gender: 'm' },
  'Bismuth': { es: 'Bismuto', gender: 'm' },
  'Arsenic': { es: 'Arsénico', gender: 'm' },
  'Nickel': { es: 'Níquel', gender: 'm' },
  'Cobalt': { es: 'Cobalto', gender: 'm' },
  'Manganese': { es: 'Manganeso', gender: 'm' },
  'Selenium': { es: 'Selenio', gender: 'm' },
  'Tellurium': { es: 'Teluro', gender: 'm' },
  'Sulfur': { es: 'Azufre', gender: 'm' },
  'Sulphur': { es: 'Azufre', gender: 'm' },
  'Carbon': { es: 'Carbono', gender: 'm' },
  'Silicon': { es: 'Silicio', gender: 'm' },
  'Aluminum': { es: 'Aluminio', gender: 'm' },
  'Aluminium': { es: 'Aluminio', gender: 'm' },
};

// Diccionario general de nombres completos
const DIRECT_MAP = {
  'Quartz': 'Cuarzo',
  'Calcite': 'Calcita',
  'Gypsum': 'Yeso',
  'Pyrite': 'Pirita',
  'Fluorite': 'Fluorita',
  'Halite': 'Halita',
  'Hematite': 'Hematita',
  'Magnetite': 'Magnetita',
  'Malachite': 'Malaquita',
  'Azurite': 'Azurita',
  'Talc': 'Talco',
  'Mica': 'Mica',
  'Feldspar': 'Feldespato',
  'Beryl': 'Berilo',
  'Corundum': 'Corindón',
  'Diamond': 'Diamante',
  'Galena': 'Galena',
  'Sphalerite': 'Esferalita',
  'Chalcopyrite': 'Calcopirita',
  'Arsenopyrite': 'Arsenopirita',
  'Cassiterite': 'Casiterita',
  'Rutile': 'Rutilo',
  'Barite': 'Barita',
  'Celestine': 'Celestina',
  'Anhydrite': 'Anhidrita',
  'Apatite': 'Apatita',
  'Turquoise': 'Turquesa',
  'Olivine': 'Olivino',
  'Garnet': 'Granate',
  'Topaz': 'Topacio',
  'Tourmaline': 'Turmalina',
  'Zircon': 'Zircón',
  'Spodumene': 'Espodumena',
  'Jadeite': 'Jadeíta',
  'Nephrite': 'Nefrita',
  'Augite': 'Augita',
  'Hornblende': 'Hornblenda',
  'Asbestos': 'Asbesto',
  'Serpentine': 'Serpentina',
  'Kaolinite': 'Caolinita',
  'Muscovite': 'Moscovita',
  'Biotite': 'Biotita',
  'Lepidolite': 'Lepidolita',
  'Obsidian': 'Obsidiana',
  'Pumice': 'Piedra pómez',
  'Opal': 'Ópalo',
  'Chalcedony': 'Calcedonia',
  'Agate': 'Ágata',
  'Jasper': 'Jaspe',
  'Carnelian': 'Cornalina',
  'Amethyst': 'Amatista',
  'Citrine': 'Citrino',
  'Rose Quartz': 'Cuarzo rosa',
  'Smoky Quartz': 'Cuarzo ahumado',
  'Tiger\'s Eye': 'Ojo de tigre',
  'Aventurine': 'Aventurina',
  'Chrysoprase': 'Crisoprasa',
  'Onyx': 'Ónix',
  'Emerald': 'Esmeralda',
  'Aquamarine': 'Aguamarina',
  'Morganite': 'Morganita',
  'Ruby': 'Rubí',
  'Sapphire': 'Zafiro',
  'Alexandrite': 'Alejandrita',
  'Chrysoberyl': 'Crisoberilo',
  'Spinel': 'Espinela',
  'Tanzanite': 'Tanzanita',
  'Tsavorite': 'Tsavorita',
  'Kunzite': 'Kunzita',
  'Ice': 'Hielo',
  'Cubo-ice': 'Hielo cúbico',
};

function translateWord(word) {
  // Ver si está en el diccionario directo
  if (DIRECT_MAP[word]) return DIRECT_MAP[word];

  // Si tiene un paréntesis final como (Y) o (Fe), lo separamos
  let suffix = '';
  let core = word;
  const parenMatch = word.match(/(-\([^\)]+\))$/);
  if (parenMatch) {
    suffix = parenMatch[1];
    core = word.slice(0, word.length - suffix.length);
  }

  // Traducción del core
  let translatedCore = core;

  // Prefijos y raíces
  translatedCore = translatedCore
    .replace(/^Thallio/g, 'Talio')
    .replace(/^Telluro/g, 'Teluro')
    .replace(/^Tetrahed/g, 'Tetraed')
    .replace(/^Sulph/g, 'Sulf')
    .replace(/^Chalc/g, 'Calc')
    .replace(/Carbonate/g, 'Carbonato')
    .replace(/Sulfate/g, 'Sulfato')
    .replace(/Phosphate/g, 'Fosfato')
    .replace(/^Zinco/g, 'Zinco')
    .replace(/^Hydro/g, 'Hidro')
    .replace(/^Hydra/g, 'Hidra')
    .replace(/^Ortho/g, 'Orto')
    .replace(/^Plumbo/g, 'Plumbo')
    .replace(/^Argento/g, 'Argento')
    .replace(/^Alumo/g, 'Alumo');

  // Reemplazos fonéticos ingles -> español
  translatedCore = translatedCore
    .replace(/ph/gi, 'f')
    .replace(/ch(?=[ie])/gi, 'qu')
    .replace(/ch/gi, 'c')
    .replace(/chl/gi, 'cl')
    .replace(/th/gi, 't')
    .replace(/cy/gi, 'ci')
    .replace(/ky/gi, 'ci')
    .replace(/^stib/gi, 'estib')
    .replace(/^stann/gi, 'estann')
    .replace(/^spod/gi, 'espod')
    .replace(/^sc(?=[aeiouy])/gi, 'esc');

  // Sufijos
  if (translatedCore.endsWith('silicide')) {
    translatedCore = translatedCore.replace(/silicide$/, 'siliciuro');
  } else if (translatedCore.endsWith('silicides')) {
    translatedCore = translatedCore.replace(/silicides$/, 'siliciuros');
  } else if (translatedCore.endsWith('ide')) {
    translatedCore = translatedCore.replace(/ide$/, 'uro');
  } else if (translatedCore.endsWith('ides')) {
    translatedCore = translatedCore.replace(/ides$/, 'uros');
  } else if (translatedCore.endsWith('silite')) {
    translatedCore = translatedCore.replace(/silite$/, 'silita');
  } else if (translatedCore.endsWith('silites')) {
    translatedCore = translatedCore.replace(/silites$/, 'silitas');
  } else if (translatedCore.endsWith('lite')) {
    translatedCore = translatedCore.replace(/lite$/, 'lita');
  } else if (translatedCore.endsWith('lites')) {
    translatedCore = translatedCore.replace(/lites$/, 'litas');
  } else if (translatedCore.endsWith('ite')) {
    translatedCore = translatedCore.replace(/ite$/, 'ita');
  } else if (translatedCore.endsWith('ites')) {
    translatedCore = translatedCore.replace(/ites$/, 'itas');
  } else if (translatedCore.endsWith('ine')) {
    translatedCore = translatedCore.replace(/ine$/, 'ina');
  } else if (translatedCore.endsWith('ines')) {
    translatedCore = translatedCore.replace(/ines$/, 'inas');
  } else if (translatedCore.endsWith('ase')) {
    translatedCore = translatedCore.replace(/ase$/, 'asa');
  } else if (translatedCore.endsWith('ases')) {
    translatedCore = translatedCore.replace(/ases$/, 'asas');
  } else if (translatedCore.endsWith('ate')) {
    translatedCore = translatedCore.replace(/ate$/, 'ato');
  } else if (translatedCore.endsWith('ates')) {
    translatedCore = translatedCore.replace(/ates$/, 'atos');
  } else if (translatedCore.endsWith('ane')) {
    translatedCore = translatedCore.replace(/ane$/, 'ano');
  } else if (translatedCore.endsWith('anes')) {
    translatedCore = translatedCore.replace(/anes$/, 'anos');
  }

  // Capitalizar primera letra por si acaso
  if (translatedCore.length > 0) {
    translatedCore = translatedCore.charAt(0).toUpperCase() + translatedCore.slice(1);
  }

  return translatedCore + suffix;
}

function translateName(name) {
  if (!name) return name;
  const trimmed = name.trim();

  // Caso especial: Native [Element] -> [Elemento] nativo/a
  const nativeMatch = trimmed.match(/^Native\s+(.+)$/i);
  if (nativeMatch) {
    const elementEn = nativeMatch[1];
    const elementInfo = ELEMENTS_MAP[elementEn];
    if (elementInfo) {
      const genderSuffix = elementInfo.gender === 'f' ? 'nativa' : 'nativo';
      return `${elementInfo.es} ${genderSuffix}`;
    } else {
      const translatedEl = translateWord(elementEn);
      const genderSuffix = translatedEl.endsWith('a') ? 'nativa' : 'nativo';
      return `${translatedEl} ${genderSuffix}`;
    }
  }

  // Si tiene múltiples palabras, traducir cada una o ver si es un caso especial
  if (trimmed.includes(' ')) {
    return trimmed.split(' ').map(word => {
      // Si la palabra es un elemento común o conector
      if (word.toLowerCase() === 'of') return 'de';
      return translateWord(word);
    }).join(' ');
  }

  return translateWord(trimmed);
}

async function main() {
  console.log('=== TEST DE REGLAS DE TRADUCCIÓN ===\n');

  const { data, error } = await supabase
    .from('minerals')
    .select('name')
    .is('name_es', null)
    .not('description', 'is', null)
    .limit(30);

  if (error) {
    console.error(error);
    return;
  }

  const testCases = [
    'Ariegilatite', 'Protoenstatite', 'Jingwenite-(Y)', 'Tetrahedrite-(Hg)',
    'Thalliomelane', 'Cubo-ice', 'Native Osmium', 'Native Silver',
    'Carbonatecyanotrichite', 'Reedmergnerite', 'Clinoenstatite'
  ];

  console.log('Casos fijos:');
  for (const tc of testCases) {
    console.log(`  "${tc}" -> "${translateName(tc)}"`);
  }

  console.log('\nCasos reales de la BD sin traducir:');
  for (const row of data) {
    console.log(`  "${row.name}" -> "${translateName(row.name)}"`);
  }
}

// Exportar funciones para usar en el script real de actualización
module.exports = { translateName };

if (require.main === module) {
  main().catch(console.error);
}
