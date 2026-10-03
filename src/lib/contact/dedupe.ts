import { createHash } from 'node:crypto'
import type { ContactValues } from './validate'

/*
 * Duplicate-submit protection: one inquiry is stored and notified once, however often it is
 * sent (a double click, a resent form without JavaScript, a retry after a slow answer, two
 * server instances at once, a restart). The key is the lead's `dedupe_key`, which the
 * database holds unique (src/lib/leads), so the first submission wins everywhere and every
 * repeat is answered as already received. The form's own guard (one submission at a time)
 * comes first.
 */

const SUBMISSION_ID = /^[a-z0-9-]{16,64}$/i

/**
 * `id:<submission id>` from the form's random id, or, without JavaScript (no id), a hash of
 * the sender and the message, so the same sender and message count as one inquiry. At most
 * 69 characters (the column allows 96).
 */
export function dedupeKey(id: string, values: Pick<ContactValues, 'email' | 'description'>) {
  if (SUBMISSION_ID.test(id)) return `id:${id}`
  return `hash:${createHash('sha256').update(`${values.email}\n${values.description}`).digest('hex')}`
}
