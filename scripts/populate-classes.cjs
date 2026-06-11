const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // Use service role to bypass RLS for updating

function getClassName(strunz, dana, formula) {
  if (strunz && strunz !== '0.0.0' && strunz !== '0.0.0.0') {
    const cleanStrunz = strunz.trim();
    const match = cleanStrunz.match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num === 1) return 'Native Elements';
      if (num === 2) return 'Sulfides';
      if (num === 3) return 'Halides';
      if (num === 4) return 'Oxides';
      if (num === 5) {
        if (formula && (formula.includes('NO3') || formula.includes('N'))) return 'Nitrates';
        return 'Carbonates';
      }
      if (num === 6) return 'Borates';
      if (num === 7) {
        if (formula && (formula.includes('MoO4') || formula.includes('Mo'))) return 'Molybdates';
        if (formula && (formula.includes('WO4') || formula.includes('W'))) return 'Tungstates';
        return 'Sulfates';
      }
      if (num === 8) {
        if (formula && (formula.includes('AsO4') || formula.includes('As'))) return 'Arsenates';
        if (formula && (formula.includes('VO4') || formula.includes('V'))) return 'Vanadates';
        return 'Phosphates';
      }
      if (num === 9) return 'Silicates';
    }
  }
  
  if (dana && dana !== '0.0.0' && dana !== '0.0.0.0') {
    const cleanDana = dana.trim();
    const match = cleanDana.match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 4) return 'Native Elements';
      if (num >= 5 && num <= 8) return 'Sulfides';
      if (num >= 9 && num <= 12) return 'Halides';
      if (num >= 13 && num <= 17) return 'Carbonates';
      if (num >= 24 && num <= 32) return 'Sulfates';
      if (num >= 37 && num <= 43) return 'Phosphates';
      if (num >= 51 && num <= 78) return 'Silicates';
    }
  }
  
  return null;
}

async function run() {
  console.log('=== POPULATING MINERAL CLASSES ===');
  
  let offset = 0;
  const BATCH_SIZE = 500;
  let totalUpdated = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching batch from offset ${offset}...`);
    const { data: minerals, error } = await supabase
      .from('minerals')
      .select('id, name, strunz_number, dana_number, chemical_formula, mineral_class')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('Error fetching minerals:', error);
      break;
    }

    if (!minerals || minerals.length === 0) {
      hasMore = false;
      break;
    }

    const updates = [];
    for (const m of minerals) {
      const computedClass = getClassName(m.strunz_number, m.dana_number, m.chemical_formula);
      
      // Update only if computed class is non-null and differs from current
      if (computedClass && m.mineral_class !== computedClass) {
        updates.push({
          id: m.id,
          mineral_class: computedClass
        });
      }
    }

    if (updates.length > 0) {
      console.log(`Updating ${updates.length} minerals in this batch...`);
      
      // Execute updates in parallel or in chunked upserts
      // Since supabase upsert requires all columns or will set other columns to default unless it's a partial update,
      // let's do individual updates in parallel or batch them
      const promises = updates.map(update => 
        supabase
          .from('minerals')
          .update({ mineral_class: update.mineral_class })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error(`Failed to update some records:`, errors[0].error);
      }
      
      totalUpdated += (updates.length - errors.length);
      console.log(`Successfully updated ${updates.length - errors.length} records. Cumulative total: ${totalUpdated}`);
    } else {
      console.log('No updates needed in this batch.');
    }

    offset += BATCH_SIZE;
    hasMore = minerals.length === BATCH_SIZE;
  }

  console.log(`=== POPULATION COMPLETE. Total records updated: ${totalUpdated} ===`);
}

run();
