const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getStreaks() {
  const { data, error } = await supabase.from('minerals').select('streak').not('streak', 'is', null);
  const streaks = [...new Set(data.map(d => d.streak))];
  console.log("Unique streaks count:", streaks.length);
  console.log(streaks.slice(0, 30));
}
getStreaks();
