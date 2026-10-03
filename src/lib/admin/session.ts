import 'server-only'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AdminAuthConfig } from './config'

/*
 * Supabase Auth for the admin, on the server only (@supabase/ssr): the session lives in
 * cookies, scoped to /admin, httpOnly (no browser script ever reads them; there is no
 * browser Supabase client) and SameSite=Lax. This client knows the publishable key only:
 * it can sign in, read and refresh the session, and sign out. It has no access to the
 * leads (no table privileges for anon or authenticated); CRM data goes through the
 * elevated client in src/lib/leads/supabase.ts, and only after requireAdmin().
 */

export interface CookieToSet {
  name: string
  value: string
  options?: Record<string, unknown>
}

/** Where the session cookies come from and go to: next/headers, or a proxy request. */
export interface CookieJar {
  getAll(): { name: string; value: string }[]
  /** May be unable to write (a Server Component); token refreshes are then the proxy's. */
  setAll(cookies: CookieToSet[]): void
}

/** Admin cookies are sent only to /admin, never with a public page's request. */
export const ADMIN_COOKIE_PATH = '/admin'

export function createAuthClient(config: AdminAuthConfig, jar: CookieJar): SupabaseClient {
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (cookies) => jar.setAll(cookies),
    },
    cookieOptions: {
      path: ADMIN_COOKIE_PATH,
      httpOnly: true,
      sameSite: 'lax',
      secure: config.secureCookies,
    },
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(8000)
        return fetch(input, {
          ...init,
          cache: 'no-store',
          signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
        })
      },
    },
  })
}

export type AdminCheck =
  | { status: 'admin'; user: User }
  /** No session, an expired or revoked one, or the auth service could not confirm it. */
  | { status: 'anonymous' }
  /** A real Supabase user who is not ADMIN_USER_ID. */
  | { status: 'forbidden' }

/**
 * Who holds this session, confirmed by Supabase Auth (getUser asks the auth server; a
 * cookie alone is never trusted), and whether it is exactly the configured admin. The only
 * authorization rule: user.id === ADMIN_USER_ID.
 */
export async function checkAdmin(client: SupabaseClient, adminUserId: string): Promise<AdminCheck> {
  let user: User | null = null
  try {
    const { data, error } = await client.auth.getUser()
    if (!error) user = data.user
  } catch {
    user = null
  }
  if (!user) return { status: 'anonymous' }
  return user.id.toLowerCase() === adminUserId ? { status: 'admin', user } : { status: 'forbidden' }
}

/** Ends this browser's session (this device only) and clears its cookies where writable. */
export async function endSession(client: SupabaseClient): Promise<void> {
  try {
    await client.auth.signOut({ scope: 'local' })
  } catch {
    // Signing out is best effort; the cookies are cleared by the client either way.
  }
}
