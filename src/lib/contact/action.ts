'use server'

import { createHash } from 'node:crypto'
import { defaultLocale, isLocale } from '@/i18n/config'
import { claim, settle } from './dedupe'
import { configuredNotifiers, DeliveryError } from './notifiers'
import { isLikelySpam, minFillMs } from './spam'
import { hiddenFields, type ContactState } from './state'
import { hasErrors, readValues, validate, type ContactValues } from './validate'

const SUBMISSION_ID = /^[a-z0-9-]{16,64}$/i

function dedupeKey(id: string, values: ContactValues): string {
  if (SUBMISSION_ID.test(id)) return `id:${id}`
  // Without JavaScript there is no id: the same sender and message count as one inquiry.
  return `hash:${createHash('sha256').update(`${values.email}\n${values.details}`).digest('hex')}`
}

/**
 * The project inquiry, sent from /[locale]/contact. Works as a plain form POST without
 * JavaScript (progressive enhancement) and as an action with it. The server is the
 * authority: every value is cleaned and validated here, whatever the browser checked.
 * Logs never contain the inquiry, only which notifier failed and its status.
 */
export async function sendInquiry(_previous: ContactState, data: FormData): Promise<ContactState> {
  const values = readValues(data)
  const localeValue = data.get(hiddenFields.locale)
  const locale = isLocale(localeValue) ? localeValue : defaultLocale

  const spam = isLikelySpam({
    trap: String(data.get(hiddenFields.trap) ?? ''),
    startedAt: String(data.get(hiddenFields.startedAt) ?? ''),
    now: Date.now(),
    minMs: minFillMs(),
  })
  // Answered like a delivered inquiry, so nothing tells the sender what was detected.
  if (spam) return { status: 'sent' }

  const errors = validate(values)
  if (hasErrors(errors)) return { status: 'invalid', errors, values }

  const notifiers = configuredNotifiers()
  if (notifiers.length === 0) {
    console.error('[contact] No delivery configured; the inquiry was not sent.')
    return { status: 'unavailable', values }
  }

  const key = dedupeKey(String(data.get(hiddenFields.submission) ?? ''), values)
  if (!claim(key)) return { status: 'sent' }

  const inquiry = { values, locale, receivedAt: new Date() }
  const results = await Promise.allSettled(notifiers.map((notifier) => notifier.send(inquiry)))
  for (const result of results) {
    if (result.status === 'rejected') {
      const reason = result.reason
      console.error(
        reason instanceof DeliveryError
          ? `[contact] ${reason.notifier} delivery failed (${reason.status}).`
          : '[contact] A delivery failed.',
      )
    }
  }
  const delivered = results.some((result) => result.status === 'fulfilled')
  settle(key, delivered)
  return delivered ? { status: 'sent' } : { status: 'failed', values }
}
