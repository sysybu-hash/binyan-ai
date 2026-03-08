import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcruhxnkjxbwhhqawptl.supabase.co'
const supabaseKey = 'sb_publishable_YsaC4j2m-X3FvxzVH5sajw_GIFy9emd'

export const supabase = createClient(supabaseUrl, supabaseKey)
