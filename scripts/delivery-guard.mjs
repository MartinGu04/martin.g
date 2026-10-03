/**
 * Network guard for the production simulation (scripts/production-simulation.mjs).
 *
 * Preloaded with `node --import` into every Node process of the simulated build and server
 * (NODE_OPTIONS is inherited by Next's workers). It refuses any request to the contact
 * notifiers' hosts and to Supabase (any *.supabase.co, .com or .in host, and whatever host
 * SUPABASE_URL names, the simulation's dummy one included) and records it, so the simulation
 * can prove that neither its dummy Resend values nor its dummy Supabase values ever reached
 * a real service, and that the build stored no lead. The notifiers and the Supabase client
 * use the global fetch at call time (src/lib/contact/notifiers.ts, src/lib/leads/supabase.ts);
 * the site has no other HTTP client.
 *
 * Writes one line per event to the file named by MG_DELIVERY_GUARD_LOG:
 *   loaded <pid>          the guard is active in this process
 *   blocked <host>        a delivery or database request was refused
 */
import { appendFileSync } from 'node:fs'

export const DELIVERY_HOSTS = ['api.resend.com', 'api.telegram.org']

/** Supabase's own domains: the project API and the platform. */
export const DATABASE_HOST_SUFFIXES = ['.supabase.co', '.supabase.com', '.supabase.in']

/** The host of a configured SUPABASE_URL, if any. */
export function configuredDatabaseHost(env) {
  try {
    return env.SUPABASE_URL ? new URL(env.SUPABASE_URL).hostname : null
  } catch {
    return null
  }
}

/**
 * Whether a request to `host` must be refused.
 *
 * @param {string | null | undefined} host
 * @param {string | null} [databaseHost]
 */
export function isGuardedHost(host, databaseHost = null) {
  if (!host) return false
  if (DELIVERY_HOSTS.includes(host)) return true
  if (databaseHost && host === databaseHost) return true
  return DATABASE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) || host === suffix.slice(1))
}

function hostOf(input) {
  try {
    if (typeof input === 'string') return new URL(input).hostname
    if (input instanceof URL) return input.hostname
    if (input && typeof input.url === 'string') return new URL(input.url).hostname
  } catch {
    return null
  }
  return null
}

/**
 * A fetch that refuses the guarded hosts and passes everything else to `fetch`.
 *
 * @param {typeof globalThis.fetch} fetch
 * @param {(line: string) => void} record
 * @param {string | null} [databaseHost]
 */
export function guardedFetch(fetch, record, databaseHost = null) {
  return function deliveryGuardFetch(input, init) {
    const host = hostOf(input)
    if (isGuardedHost(host, databaseHost)) {
      record(`blocked ${host}`)
      return Promise.reject(
        new Error(
          `[delivery-guard] Refused a request to ${host} during the production simulation.`,
        ),
      )
    }
    return fetch(input, init)
  }
}

const log = process.env.MG_DELIVERY_GUARD_LOG
if (log) {
  const record = (line) => appendFileSync(log, `${line}\n`)
  globalThis.fetch = guardedFetch(globalThis.fetch, record, configuredDatabaseHost(process.env))
  record(`loaded ${process.pid}`)
}
