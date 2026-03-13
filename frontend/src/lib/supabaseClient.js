import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const supabaseSingletonKey = '__god_boilerplate_supabase_client__'

function createSupabaseSingleton() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Guard against malformed env values to avoid crashing the whole app during module evaluation.
  try {
    new URL(supabaseUrl)
  } catch {
    console.error('Invalid VITE_SUPABASE_URL. Expected a full https://<project>.supabase.co URL.')
    return null
  }

  const existingClient = globalThis[supabaseSingletonKey]

  if (existingClient) {
    return existingClient
  }

  let client

  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    return null
  }

  globalThis[supabaseSingletonKey] = client
  return client
}

const supabase = createSupabaseSingleton()

export { supabase }