/*
 * Duplicate-submit protection on the server: one inquiry is delivered once, however often
 * it is sent (a double click, a resent form without JavaScript, a retry after a slow
 * answer). Keys live in memory for ten minutes, per server instance: a best effort that
 * needs no database. The form's own guard (one submission at a time) comes first.
 */
const TTL_MS = 10 * 60 * 1000
const MAX_KEYS = 500

type Entry = { state: 'pending' | 'sent'; at: number }
const seen = new Map<string, Entry>()

function prune(now: number) {
  for (const [key, entry] of seen) {
    if (now - entry.at > TTL_MS || seen.size > MAX_KEYS) seen.delete(key)
    else break
  }
}

/** Claims a key for delivery. False when it is already being delivered or was delivered. */
export function claim(key: string, now = Date.now()): boolean {
  prune(now)
  const entry = seen.get(key)
  if (entry && now - entry.at <= TTL_MS) return false
  seen.set(key, { state: 'pending', at: now })
  return true
}

export function settle(key: string, delivered: boolean, now = Date.now()) {
  if (delivered) seen.set(key, { state: 'sent', at: now })
  else seen.delete(key)
}

/** Tests only. */
export function resetDedupe() {
  seen.clear()
}
