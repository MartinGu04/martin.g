import 'server-only'

/*
 * Where Contact inquiries are stored: the `leads` table in the site's Supabase project,
 * reached only from the server with a Supabase secret API key. Both variables are server-side
 * environment variables (never NEXT_PUBLIC_), read at request time, never logged.
 *
 *   SUPABASE_URL          the project's API URL, https://<project-ref>.supabase.co
 *   SUPABASE_SECRET_KEY   a secret API key, sb_secret_... (not the publishable key, and not
 *                         the legacy service_role JWT)
 */

type Env = Record<string, string | undefined>

/** The variables lead storage needs; a production build requires both. */
export const LEAD_STORE_VARIABLES = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'] as const

/** The prefix of Supabase's secret API keys. Publishable keys and JWTs are refused. */
export const SECRET_KEY_PREFIX = 'sb_secret_'

export interface LeadStoreConfig {
  url: string
  secretKey: string
}

/**
 * The project's API URL as an origin: https, or http for a local Supabase stack only
 * (`supabase start`). Null for anything else, including a path, credentials or a query.
 */
export function supabaseOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) return null
  if (url.username || url.password || url.search || url.hash) return null
  if (url.pathname !== '/') return null
  return url.origin
}

export function isSecretKey(value: string | undefined): boolean {
  const key = value?.trim() ?? ''
  return key.startsWith(SECRET_KEY_PREFIX) && key.length > SECRET_KEY_PREFIX.length
}

/** What is wrong with the configuration, by variable name. Never contains a value. */
export function leadStoreProblems(env: Env = process.env): string[] {
  const problems: string[] = []
  if (!env.SUPABASE_URL?.trim()) problems.push('SUPABASE_URL is missing')
  else if (!supabaseOrigin(env.SUPABASE_URL))
    problems.push('SUPABASE_URL is not the project URL (https://<project-ref>.supabase.co)')
  if (!env.SUPABASE_SECRET_KEY?.trim()) problems.push('SUPABASE_SECRET_KEY is missing')
  else if (!isSecretKey(env.SUPABASE_SECRET_KEY))
    problems.push(`SUPABASE_SECRET_KEY is not a secret API key (${SECRET_KEY_PREFIX}...)`)
  return problems
}

/** The Supabase configuration, or null while it is incomplete or invalid. */
export function leadStoreConfig(env: Env = process.env): LeadStoreConfig | null {
  if (leadStoreProblems(env).length > 0) return null
  return { url: supabaseOrigin(env.SUPABASE_URL)!, secretKey: env.SUPABASE_SECRET_KEY!.trim() }
}

/**
 * Supabase is the source of truth for inquiries, so a production deployment must be able to
 * store them: a Vercel production build fails unless both variables are set and valid. The
 * error names the variables, never a value. Preview and local builds only build; their form
 * answers "unavailable" until storage is configured.
 */
export function assertLeadStorage(env: Env = process.env): void {
  if (env.VERCEL_ENV !== 'production') return
  const problems = leadStoreProblems(env)
  if (problems.length === 0) return
  throw new Error(
    `[leads] No lead storage configured for the contact form: ${problems.join('; ')} (docs/ARCHITECTURE.md, "Leads (Supabase)").`,
  )
}
