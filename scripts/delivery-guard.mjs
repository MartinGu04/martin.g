/**
 * Delivery guard for the production simulation (scripts/production-simulation.mjs).
 *
 * Preloaded with `node --import` into every Node process of the simulated build and server
 * (NODE_OPTIONS is inherited by Next's workers). It refuses any request to the contact
 * notifiers' hosts and records it, so the simulation can prove that its dummy Resend values
 * never reached a delivery service. The notifiers use the global fetch
 * (src/lib/contact/notifiers.ts); the site has no other HTTP client.
 *
 * Writes one line per event to the file named by MG_DELIVERY_GUARD_LOG:
 *   loaded <pid>          the guard is active in this process
 *   blocked <host>        a delivery request was refused
 */
import { appendFileSync } from 'node:fs'

export const DELIVERY_HOSTS = ['api.resend.com', 'api.telegram.org']

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

/** A fetch that refuses the delivery hosts and passes everything else to `fetch`. */
export function guardedFetch(fetch, record) {
  return function deliveryGuardFetch(input, init) {
    const host = hostOf(input)
    if (host && DELIVERY_HOSTS.includes(host)) {
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
  globalThis.fetch = guardedFetch(globalThis.fetch, record)
  record(`loaded ${process.pid}`)
}
