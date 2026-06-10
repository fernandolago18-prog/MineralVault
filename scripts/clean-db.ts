import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

async function run() {
  console.log('=== INICIANDO DEPURACIÓN DE LA BASE DE DATOS ===');
  console.log('Objetivo: Dejar únicamente minerales válidos, sus variedades y rocas.');

  // 1. Obtener minerales en colecciones de usuarios para protegerlos
  const { data: colData, error: errCol } = await supabase
    .from('user_collection')
    .select('mineral_id');
  
  if (errCol) {
    console.error('❌ Error al obtener colecciones de usuarios:', errCol.message);
    return;
  }
  
  const collectionMineralIds = new Set(colData?.map(c => c.mineral_id) ?? []);
  console.log(`🛡️  Minerales en colecciones protegidos contra borrado: ${collectionMineralIds.size}`);

  // 2. Descargar todos los registros de minerales en lotes de 1000
  let allMinerals: any[] = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;

  console.log('📡 Descargando catálogo completo en lotes de 1000...');
  while (hasMore) {
    const { data, error } = await supabase
      .from('minerals')
      .select('id, mindat_id, name, name_es, parent_mindat_id, crystal_system, chemical_formula, hardness_min')
      .order('id', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error(`❌ Error al descargar lote ${page}:`, error.message);
      break;
    }

    if (data && data.length > 0) {
      allMinerals.push(...data);
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }
  console.log(`✅ Catálogo descargado. Total de registros: ${allMinerals.length}`);

  // 3. Lógica de filtrado en memoria
  const rockKeywords = [
    'rock', 'roca', 'granite', 'granito', 'basalt', 'basalto', 'obsidian', 'obsidiana', 'coal', 'carbón', 
    'limestone', 'caliza', 'sandstone', 'arenisca', 'marble', 'mármol', 'slate', 'pizarra', 'gneiss', 'gneis', 
    'schist', 'esquisto', 'rhyolite', 'riolita', 'andesite', 'andesita', 'diorite', 'diorita', 'gabbro', 'gabro', 
    'pumice', 'pumita', 'tuff', 'toba', 'shale', 'lutita', 'clay', 'arcilla', 'conglomerado', 'brecha', 'sienita', 
    'peridotite', 'peridotita', 'serpentinite', 'serpentinita', 'quartzite', 'cuarcita', 'amphibolite', 'anfibolita', 
    'flint', 'pedernal', 'chert', 'chalk', 'tiza', 'toba'
  ];

  const isRock = (name: string, nameEs: string | null) => {
    const nameLower = name.toLowerCase();
    const nameEsLower = nameEs ? nameEs.toLowerCase() : '';
    return rockKeywords.some(k => nameLower.includes(k) || nameEsLower.includes(k));
  };

  const keepIds = new Set<string>();
  const keepMindatIds = new Set<number>();

  // Paso 1: Mantener minerales con datos químicos/físicos, rocas o protegidos por colección
  allMinerals.forEach(m => {
    const hasProperties = m.crystal_system !== null || m.chemical_formula !== null || m.hardness_min !== null;
    const isARock = isRock(m.name, m.name_es);
    const isProtected = collectionMineralIds.has(m.id);

    if (hasProperties || isARock || isProtected) {
      keepIds.add(m.id);
      if (m.mindat_id !== null) {
        keepMindatIds.add(m.mindat_id);
      }
    }
  });

  // Paso 2: Mantener variedades de minerales que decidimos conservar
  let varietiesCount = 0;
  allMinerals.forEach(m => {
    if (keepIds.has(m.id)) return; // Ya se conserva

    const isVariety = m.parent_mindat_id !== null && m.parent_mindat_id !== 0;
    if (isVariety && keepMindatIds.has(m.parent_mindat_id)) {
      keepIds.add(m.id);
      varietiesCount++;
    }
  });

  const keepCount = keepIds.size;
  const idsToDelete = allMinerals
    .filter(m => !keepIds.has(m.id))
    .map(m => m.id);

  console.log(`\n📊 Análisis del filtrado:`);
  console.log(`  - Registros a conservar: ${keepCount}`);
  console.log(`    - Especies principales y rocas: ${keepCount - varietiesCount}`);
  console.log(`    - Variedades válidas vinculadas: ${varietiesCount}`);
  console.log(`  - Registros a eliminar: ${idsToDelete.length}`);

  if (idsToDelete.length === 0) {
    console.log('✨ La base de datos ya está limpia. No hay registros para eliminar.');
    return;
  }

  // 4. Ejecutar eliminaciones en Supabase en lotes de 500
  console.log(`\n🧹 Iniciando eliminación de ${idsToDelete.length} registros en Supabase...`);
  const DELETE_BATCH_SIZE = 500;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < idsToDelete.length; i += DELETE_BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + DELETE_BATCH_SIZE);
    const { error } = await supabase
      .from('minerals')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`❌ Error al eliminar lote ${i}-${i + batch.length}:`, error.message);
      failCount += batch.length;
    } else {
      successCount += batch.length;
      process.stdout.write(`\r  Eliminados: ${successCount} / ${idsToDelete.length}...`);
    }
  }

  console.log('\n\n=== PROCESO FINALIZADO ===');
  console.log(`✅ Eliminados con éxito: ${successCount}`);
  if (failCount > 0) {
    console.log(`❌ Fallaron al eliminar: ${failCount}`);
  }
  
  // Verificación final del total en DB
  const { count: finalCount } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true });
  console.log(`🗄️  Total de registros restantes en Supabase: ${finalCount}`);
}

run().catch(console.error);
