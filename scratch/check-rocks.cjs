const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  try {
    const { data, error } = await supabase
      .from('minerals')
      .select('id, name, name_es, is_rock')
      .eq('is_rock', true)
      .limit(5);

    if (error) {
      console.error('Error fetching rocks:', error.message);
      return;
    }

    console.log('Successfully queried is_rock!');
    console.log('Sample rocks in database:', data);

    const { count, error: countError } = await supabase
      .from('minerals')
      .select('*', { count: 'exact', head: true })
      .eq('is_rock', true);
      
    if (countError) {
      console.error('Error counting rocks:', countError.message);
    } else {
      console.log('Total rocks in database:', count);
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

check();
