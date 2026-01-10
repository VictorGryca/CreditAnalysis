import { createClient } from '@supabase/supabase-js'

// SUBSTITUA pelos seus valores do Supabase (Settings > API)
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
