// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Les variables viennent de ton fichier .env.production (pour le build) 
// ou .env.local (pour ton dev local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// On crée le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
