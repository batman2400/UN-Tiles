import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

function clearStaleAuthLock() {
  if (typeof window === 'undefined') return

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return

    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) return
      const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
      window.localStorage.removeItem(`lock:sb-${projectRef}-auth-token`)
    } catch {
      // Ignore cleanup errors.
    }
  }
}

export function createClient() {
  if (client) return client
  clearStaleAuthLock()
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Prevent long lock-acquire waits that can cause refresh flicker in dev.
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    }
  )
  return client
}
