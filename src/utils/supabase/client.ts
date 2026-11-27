import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return { supabaseUrl, supabaseAnonKey }
}

export function createClient() {
  if (client) return client

  const env = getSupabaseEnv()
  if (!env) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your project environment.'
    )
  }

  // Keep Supabase's default Web Locks coordination enabled so multi-tab
  // refresh-token rotation never logs users out mid-checkout.
  client = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey)
  return client
}
