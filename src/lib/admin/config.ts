import 'server-only'
import { leadStoreProblems, supabaseOrigin } from '@/lib/leads/config'

/*
 * The private admin (/admin, Phase 8B). Four server-side environment variables, none of
 * them NEXT_PUBLIC_: the browser never talks to Supabase, so it needs none of them.
 *
 *   SUPABASE_URL               the project's API URL (shared with lead storage)
 *   SUPABASE_PUBLISHABLE_KEY   sb_publishable_...: Supabase Auth only (sign in, session).
 *                              Deliberately server-side: grants nothing on the tables.
 *   SUPABASE_SECRET_KEY        sb_secret_...: the CRM's data access (shared with leads)
 *   ADMIN_USER_ID              the Supabase Auth user id (a UUID) of the one admin
 *
 * Signing in proves who someone is; only ADMIN_USER_ID decides who is the admin. Never an
 * email address and never user_metadata, which the user can change.
 */

type Env = Record<string, string | undefined>

export const ADMIN_VARIABLES = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'ADMIN_USER_ID',
] as const

export const PUBLISHABLE_KEY_PREFIX = 'sb_publishable_'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

export function isPublishableKey(value: string | undefined): boolean {
  const key = value?.trim() ?? ''
  return key.startsWith(PUBLISHABLE_KEY_PREFIX) && key.length > PUBLISHABLE_KEY_PREFIX.length
}

export interface AdminAuthConfig {
  url: string
  publishableKey: string
  adminUserId: string
  /** Cookies are Secure on Vercel (https); local and e2e servers are plain http. */
  secureCookies: boolean
}

/** Problems with the two admin-only variables. Never contains a value. */
function adminOnlyProblems(env: Env): string[] {
  const problems: string[] = []
  if (!env.SUPABASE_PUBLISHABLE_KEY?.trim()) problems.push('SUPABASE_PUBLISHABLE_KEY is missing')
  else if (!isPublishableKey(env.SUPABASE_PUBLISHABLE_KEY))
    problems.push(
      `SUPABASE_PUBLISHABLE_KEY is not a publishable API key (${PUBLISHABLE_KEY_PREFIX}...)`,
    )
  if (!env.ADMIN_USER_ID?.trim()) problems.push('ADMIN_USER_ID is missing')
  else if (!isUuid(env.ADMIN_USER_ID.trim()))
    problems.push('ADMIN_USER_ID is not a Supabase Auth user id (a UUID)')
  return problems
}

/** What is wrong with the admin configuration, by variable name. Never contains a value. */
export function adminProblems(env: Env = process.env): string[] {
  return [...leadStoreProblems(env), ...adminOnlyProblems(env)]
}

/** The admin's authentication configuration, or null while anything is missing or invalid. */
export function adminAuthConfig(env: Env = process.env): AdminAuthConfig | null {
  if (adminProblems(env).length > 0) return null
  return {
    url: supabaseOrigin(env.SUPABASE_URL)!,
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY!.trim(),
    adminUserId: env.ADMIN_USER_ID!.trim().toLowerCase(),
    secureCookies: Boolean(env.VERCEL),
  }
}

/**
 * Once the admin ships, a Vercel production build fails unless all four variables are set
 * and valid. The error names the variables, never a value. Preview and local builds only
 * build; their admin answers "not configured" until set.
 */
export function assertAdminConfiguration(env: Env = process.env): void {
  if (env.VERCEL_ENV !== 'production') return
  // SUPABASE_URL and SUPABASE_SECRET_KEY are already required by assertLeadStorage.
  const problems = adminOnlyProblems(env)
  if (problems.length === 0) return
  throw new Error(
    `[admin] The admin is not configured: ${problems.join('; ')} (docs/ARCHITECTURE.md, "Admin CRM (Phase 8B)").`,
  )
}
