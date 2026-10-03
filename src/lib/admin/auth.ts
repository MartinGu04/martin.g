import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { adminAuthConfig, type AdminAuthConfig } from './config'
import { checkAdmin, createAuthClient, endSession, type CookieJar } from './session'

export const ADMIN_HOME = '/admin'
export const ADMIN_LOGIN = '/admin/login'

/** The request's cookies; writes succeed in Server Actions and are skipped while rendering. */
async function requestJar(): Promise<CookieJar> {
  const store = await cookies()
  return {
    getAll: () => store.getAll(),
    setAll: (list) => {
      try {
        for (const { name, value, options } of list) store.set(name, value, options)
      } catch {
        // A Server Component cannot set cookies: the proxy (src/proxy.ts) refreshes them.
      }
    },
  }
}

/** The auth client for this request, or null when the admin is not configured here. */
export async function adminAuthClient(): Promise<{
  client: SupabaseClient
  config: AdminAuthConfig
} | null> {
  const config = adminAuthConfig()
  if (!config) return null
  return { client: createAuthClient(config, await requestJar()), config }
}

/**
 * The one authorization boundary of the admin. Every protected page and every mutating
 * Server Action calls it first, whatever the proxy already checked:
 *
 *   1. a valid Supabase Auth user, confirmed by the auth server
 *   2. user.id === ADMIN_USER_ID
 *
 * Anyone else is sent to /admin/login before anything is read: no session, or the admin
 * not configured in this environment; a signed-in user who is not the admin is also signed
 * out. Returns the admin user.
 */
export async function requireAdmin(): Promise<User> {
  const auth = await adminAuthClient()
  if (!auth) redirect(ADMIN_LOGIN)
  const check = await checkAdmin(auth.client, auth.config.adminUserId)
  if (check.status === 'admin') return check.user
  if (check.status === 'forbidden') await endSession(auth.client)
  redirect(ADMIN_LOGIN)
}

/** For the login page only: whether this request already belongs to the admin. */
export async function isSignedInAdmin(): Promise<boolean> {
  const auth = await adminAuthClient()
  if (!auth) return false
  return (await checkAdmin(auth.client, auth.config.adminUserId)).status === 'admin'
}
