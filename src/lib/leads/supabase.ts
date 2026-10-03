import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { LeadStoreConfig } from './config'
import type { Database } from './database'

const TIMEOUT_MS = 8000

/**
 * The elevated Supabase client: server only, authenticated with the secret API key, which
 * bypasses row level security. Built with `@supabase/supabase-js` itself, not an SSR client,
 * so it can never pick up a visitor's cookies or session. No auth state at all: nothing is
 * persisted, refreshed or read from a URL. Never import this from a client component (the
 * `server-only` import makes that a build error).
 *
 * Requests go through the global fetch at call time (so the production simulation's network
 * guard sees them), with a timeout and outside Next's data cache.
 */
export function createLeadsAdminClient(config: LeadStoreConfig): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(TIMEOUT_MS)
        return fetch(input, {
          ...init,
          cache: 'no-store',
          signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
        })
      },
    },
  })
}
