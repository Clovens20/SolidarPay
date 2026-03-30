import { createClient } from '@supabase/supabase-js'

let _supabase = null

function getClient() {
  if (_supabase) return _supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    )
  }
  _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

/**
 * Client lazy : évite de planter `next build` (ex. Vercel) au chargement du module
 * quand les env ne sont pas encore disponibles pour certaines étapes.
 * L’erreur n’apparaît qu’au premier usage réel du client.
 */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient()
      const value = client[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  }
)

// Helper function to get user session
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}