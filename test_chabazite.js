import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('minerals')
    .select('mindat_id, name, name_es, parent_mindat_id, is_rock')
    .ilike('name', '%chabazite%');
  
  const { data: data2 } = await supabase
    .from('minerals')
    .select('mindat_id, name, name_es, parent_mindat_id, is_rock')
    .ilike('name_es', '%chabasita%');

  console.log('Chabazite matches:', data);
  console.log('Chabasita matches:', data2);
}

run();
