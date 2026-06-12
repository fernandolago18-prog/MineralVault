const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testRpc() {
  try {
    console.log('Testing RPC call WITH filter_type...');
    const { data: data1, error: error1 } = await supabase.rpc('search_minerals', {
      search_query: null,
      filter_class: null,
      filter_system: null,
      hardness_min_v: null,
      hardness_max_v: null,
      page_size: 1,
      page_offset: 0,
      filter_type: 'rock'
    });

    if (error1) {
      console.error('RPC WITH filter_type failed:', error1.message);
    } else {
      console.log('RPC WITH filter_type succeeded! Results count:', data1.length);
    }

    console.log('\nTesting RPC call WITHOUT filter_type...');
    const { data: data2, error: error2 } = await supabase.rpc('search_minerals', {
      search_query: null,
      filter_class: null,
      filter_system: null,
      hardness_min_v: null,
      hardness_max_v: null,
      page_size: 1,
      page_offset: 0
    });

    if (error2) {
      console.error('RPC WITHOUT filter_type failed:', error2.message);
    } else {
      console.log('RPC WITHOUT filter_type succeeded! Results count:', data2.length);
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

testRpc();
