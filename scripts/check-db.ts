import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function check() {
  const { count, error } = await supabase
    .from('minerals')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error checking minerals:', error.message)
  } else {
    console.log('TOTAL_MINERALS_IN_DB:', count)
  }
}

check()
