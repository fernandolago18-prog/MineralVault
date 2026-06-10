require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('minerals')
    .select('streak')
    .not('streak', 'is', null)
    .limit(30);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Sample streak values:');
  console.log(data.map(d => d.streak));
}

main().catch(console.error);
