/**
 * Network guard for the production simulation (scripts/production-simulation.mjs).
 *
 * Preloaded with `node --import` into every Node process of the simulated build and server
 * (NODE_OPTIONS is inherited by Next's workers). It refuses any request to the contact
 * notifiers' hosts and to Supabase (any *.supabase.co, .com or .in host, and whatever host
 * SUPABASE_URL names, the simulation's dummy one included) and records it, so the simulation
 * can prove that neither its dummy Resend values nor its dummy Supabase values ever reached
 * a real service, and that the build stored no lead. The notifiers and the Supabase client
 * use the global fetch at call time (src/lib/contact/notifiers.ts, src/lib/leads/supabase.ts,
 * src/lib/projects/translations.ts); the site has no other HTTP client.
 *
 * One request is answered instead of refused: a Production build reads the project copy
 * saved in the admin's editor (GET /rest/v1/project_translations on SUPABASE_URL's host).
 * When MG_SIMULATED_TRANSLATIONS holds synthetic rows (JSON), the guard answers exactly
 * that read with them, here, without any network. Any other method, path or host is
 * refused as before.
 *
 * Writes one line per event to the file named by MG_DELIVERY_GUARD_LOG:
 *   loaded <pid>          the guard is active in this process
 *   blocked <host>        a delivery or database request was refused
 *   served <path>         the build's project copy read was answered with synthetic rows
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

/** The one read the guard answers itself. */
export const SIMULATED_READ_PATH = '/rest/v1/project_translations'

function urlOf(input) {
  try {
    if (typeof input === 'string') return new URL(input)
    if (input instanceof URL) return input
    if (input && typeof input.url === 'string') return new URL(input.url)
  } catch {
    return null
  }
  return null
}

function methodOf(input, init) {
  return (
    init?.method ?? (input && typeof input.method === 'string' ? input.method : 'GET')
  ).toUpperCase()
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
 * A fetch that refuses the guarded hosts and passes everything else to `fetch`. With
 * `simulatedRows`, the project copy read on the configured database host is answered
 * with them instead.
 *
 * @param {typeof globalThis.fetch} fetch
 * @param {(line: string) => void} record
 * @param {string | null} [databaseHost]
 * @param {unknown[] | null} [simulatedRows]
 */
export function guardedFetch(fetch, record, databaseHost = null, simulatedRows = null) {
  return function deliveryGuardFetch(input, init) {
    const host = hostOf(input)
    const url = urlOf(input)
    if (
      simulatedRows &&
      databaseHost &&
      host === databaseHost &&
      url?.pathname === SIMULATED_READ_PATH &&
      methodOf(input, init) === 'GET'
    ) {
      record(`served ${SIMULATED_READ_PATH}`)
      return Promise.resolve(
        new Response(JSON.stringify(simulatedRows), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
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

/** The synthetic project copy rows, or null. */
export function simulatedRowsOf(env) {
  if (!env.MG_SIMULATED_TRANSLATIONS) return null
  try {
    const rows = JSON.parse(env.MG_SIMULATED_TRANSLATIONS)
    return Array.isArray(rows) ? rows : null
  } catch {
    return null
  }
}

const log = process.env.MG_DELIVERY_GUARD_LOG
if (log) {
  const record = (line) => appendFileSync(log, `${line}\n`)
  globalThis.fetch = guardedFetch(
    globalThis.fetch,
    record,
    configuredDatabaseHost(process.env),
    simulatedRowsOf(process.env),
  )
  record(`loaded ${process.pid}`)
}
