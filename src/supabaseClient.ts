import { createClient } from '@supabase/supabase-js'
import { fetchAuthSession } from 'aws-amplify/auth'

// Credenciais vêm do arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase! Verifique o arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
