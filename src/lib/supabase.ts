import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Erreur explicite plutôt qu'un plantage silencieux plus loin dans l'app.
  console.error(
    'Configuration Supabase manquante : renseignez VITE_SUPABASE_URL et ' +
      'VITE_SUPABASE_ANON_KEY dans un fichier .env.local (voir .env.example).',
  )
}

// createClient valide le format de l'URL et lève une exception si elle est
// vide/invalide : on retombe sur une URL factice syntaxiquement valide tant
// que Supabase n'est pas configuré, pour que l'app affiche un message clair
// au lieu d'un écran blanc.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
