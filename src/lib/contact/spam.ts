/*
 * Basic spam protection that needs no third party and no CAPTCHA: a trap field that people
 * never see, and the time the form was open. Spam is answered like a real submission (so
 * nothing tells software what failed) but is never delivered. Rate limiting belongs to the
 * edge (a Vercel WAF rule, docs/ARCHITECTURE.md), not to a stateless function.
 */

/** People take longer than this to fill in the form; software that posts at once does not. */
export const DEFAULT_MIN_FILL_MS = 3000

export function minFillMs(env: Record<string, string | undefined> = process.env): number {
  const configured = Number(env.CONTACT_MIN_FILL_MS)
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_MIN_FILL_MS
}

export function isLikelySpam({
  trap,
  startedAt,
  now,
  minMs,
}: {
  trap: string
  /** Missing without JavaScript: then only the trap applies. */
  startedAt: string
  now: number
  minMs: number
}): boolean {
  if (trap.trim() !== '') return true
  if (!startedAt) return false
  const started = Number(startedAt)
  // A malformed or future stamp is not trusted, and not punished either.
  if (!Number.isFinite(started) || started > now) return false
  return now - started < minMs
}
