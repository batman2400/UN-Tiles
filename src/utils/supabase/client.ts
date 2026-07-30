import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return { supabaseUrl, supabaseAnonKey }
}

function clearStaleAuthLock() {
  if (typeof window === 'undefined') return

  try {
    const env = getSupabaseEnv()
    if (!env) return

    const projectRef = new URL(env.supabaseUrl).hostname.split('.')[0]
    const lockKey = `lock:sb-${projectRef}-auth-token`
    const rawLock = window.localStorage.getItem(lockKey)
    if (!rawLock) return

    const parsedLock = JSON.parse(rawLock)
    const expiresAt = Number(parsedLock?.expiresAt ?? parsedLock?.expires_at ?? 0)

    if (!expiresAt || expiresAt < Date.now()) {
      window.localStorage.removeItem(lockKey)
    }
  } catch {
    // If lock value is corrupted, remove it so auth can recover immediately.
    try {
      const env = getSupabaseEnv()
      if (!env) return
      const projectRef = new URL(env.supabaseUrl).hostname.split('.')[0]
      window.localStorage.removeItem(`lock:sb-${projectRef}-auth-token`)
    } catch {
      // Ignore cleanup errors.
    }
  }
}

export function createClient() {
  if (client) return client

  const env = getSupabaseEnv()
  if (!env) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.'
    )
  }

  clearStaleAuthLock()
  client = createBrowserClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      auth: {
        // Prevent long lock-acquire waits that can cause refresh flicker in dev.
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    }
  )
  return client
}

