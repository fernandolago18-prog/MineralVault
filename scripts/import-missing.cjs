const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MINDAT_API_KEY = process.env.MINDAT_API_KEY;

async function fetchGeomaterial(id) {
  const url = `https://api.mindat.org/v1/geomaterials/${id}/?format=json`;
  console.log(`Fetching from Mindat API: ${url}...`);
  const res = await fetch(url, {
    headers: {
      'Authorization': `Token ${MINDAT_API_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch geomaterial ${id}: HTTP ${res.status}`);
  }
  return await res.json();
}

async function importMissing() {
  if (!MINDAT_API_KEY) {
    console.error('MINDAT_API_KEY is not defined in .env.local');
    return;
  }

  const itemsToImport = [
    {
      id: 2082, // Jasper
      name_es: 'Jaspe',
      parent_mindat_id: 3337, // Quartz
      chemical_formula: 'SiO₂',
      crystal_system: 'Trigonal',
      hardness_min: 6.5,
      hardness_max: 7.0,
      density_min: 2.58,
      density_max: 2.91,
      color: ['Rojo', 'Amarillo', 'Marrón', 'Verde', 'Negro'],
      luster: ['Vítreo', 'Mate'],
      mineral_class: 'Silicatos',
      streak: 'Blanca',
      description_es: 'Variedad opaca e impura de cuarzo microcristalino, coloreada por inclusiones de óxidos de hierro y otros minerales.'
    },
    {
      id: 2330, // Lapis lazuli
      name_es: 'Lapislázuli',
      parent_mindat_id: null, // Standalone rock
      chemical_formula: '(Na,Ca)₈(AlSiO₄)₆(S,SO₄,Cl)₁₋₂',
      crystal_system: 'Cúbico',
      hardness_min: 5.0,
      hardness_max: 5.5,
      density_min: 2.7,
      density_max: 2.9,
      color: ['Azul oscuro', 'Azul'],
      luster: ['Vítreo', 'Mate'],
      mineral_class: 'Silicatos',
      streak: 'Azul claro',
      description_es: 'Una roca metamórfica de color azul intenso, compuesta principalmente por lazurita, sodalita, calcita y pirita.'
    }
  ];

  for (const item of itemsToImport) {
    console.log(`\nImporting ${item.name_es} (Mindat ID: ${item.id})...`);
    try {
      const raw = await fetchGeomaterial(item.id);

      const crystal_system = item.crystal_system || raw.csystem || null;
      const model_3d_config = {
        system: crystal_system ?? 'Amorphous',
        habit: raw.morphology?.split(/[,;]/)[0]?.trim() ?? '',
        params: raw.a && raw.b && raw.c ? { a: raw.a, b: raw.b, c: raw.c } : { a: 1, b: 1, c: 1 }
      };

      const record = {
        mindat_id: raw.id,
        parent_mindat_id: item.parent_mindat_id,
        name: raw.name,
        name_es: item.name_es,
        chemical_formula: item.chemical_formula || raw.ima_formula || raw.mindat_formula || null,
        hardness_min: item.hardness_min || (raw.hmin ? Number(raw.hmin) : null),
        hardness_max: item.hardness_max || (raw.hmax ? Number(raw.hmax) : null),
        density_min: item.density_min || (raw.dmeas ? Number(raw.dmeas) : null),
        density_max: item.density_max || (raw.dmeas2 ? Number(raw.dmeas2) : null),
        streak: item.streak || raw.streak || null,
        luster: item.luster || (raw.lustretype || raw.lustre ? [raw.lustretype || raw.lustre] : null),
        transparency: raw.diapheny || null,
        color: item.color || (raw.colour ? [raw.colour] : null),
        crystal_system,
        crystal_habits: raw.morphology ? raw.morphology.split(/[,;]/).map(x => x.trim()).filter(Boolean) : null,
        cleavage: raw.cleavagetype || raw.cleavage || null,
        fracture: raw.fracturetype || null,
        tenacity: raw.tenacity || null,
        magnetism: raw.magnetism || null,
        radioactivity: null,
        fluorescence: raw.uv || raw.luminescence || null,
        mineral_class: item.mineral_class || null,
        strunz_number: raw.strunz10ed1 ? raw.strunz10ed1 : null,
        dana_number: raw.dana8ed1 ? raw.dana8ed1 : null,
        description: item.description_es || raw.description_short || null,
        model_3d_config
      };

      const { data, error } = await supabase
        .from('minerals')
        .upsert(record, { onConflict: 'mindat_id' })
        .select();

      if (error) {
        console.error(`Error inserting/upserting ${item.name_es}:`, error.message);
      } else {
        console.log(`✅ Successfully imported ${item.name_es}! Database ID: ${data[0].id}`);
      }
    } catch (err) {
      console.error(`Exception while importing ${item.name_es}:`, err.message);
    }
  }
}

importMissing().catch(console.error);
