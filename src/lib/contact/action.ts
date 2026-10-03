'use server'

import { defaultLocale, isLocale } from '@/i18n/config'
import { configuredLeadRepository, LeadStoreError, toNewLead } from '@/lib/leads/repository'
import { dedupeKey } from './dedupe'
import { configuredNotifiers, DeliveryError, type ContactNotifier, type Inquiry } from './notifiers'
import { isLikelySpam, minFillMs } from './spam'
import { hiddenFields, type ContactState } from './state'
import { hasErrors, readValues, validate } from './validate'

/** Every configured notifier, at once. True when at least one delivered. */
async function notify(notifiers: ContactNotifier[], inquiry: Inquiry): Promise<boolean> {
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
  return results.some((result) => result.status === 'fulfilled')
}

function storeFailure(error: unknown): string {
  return error instanceof LeadStoreError
    ? `[contact] Lead ${error.operation} failed in ${error.store} (${error.code}).`
    : `[contact] Lead storage failed.`
}

/**
 * The project inquiry, sent from /[locale]/contact. Works as a plain form POST without
 * JavaScript (progressive enhancement) and as an action with it. The server is the
 * authority: every value is cleaned and validated here, whatever the browser checked.
 *
 *   spam                      answered as received; nothing stored or sent
 *   invalid                   field errors; nothing stored or sent
 *   valid                     stored as a lead (the durable record, src/lib/leads), then
 *                             notified (Resend); the lead records whether that worked
 *   already stored            the same dedupe key: answered as received, nothing repeated
 *   storage failed            "failed" with the values kept, so the visitor can retry;
 *                             nothing is sent (no notification without a record)
 *   notification failed       still "sent": the inquiry is stored, so it has reached
 *                             MARTIN.G; the lead is marked notification failed
 *
 * Logs never contain the inquiry or a secret, only which step failed and its code.
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

  const leads = configuredLeadRepository()
  const notifiers = configuredNotifiers()
  if (!leads || notifiers.length === 0) {
    console.error(
      `[contact] Contact is not configured (lead storage: ${leads ? 'ok' : 'missing'}, notification: ${notifiers.length > 0 ? 'ok' : 'missing'}); the inquiry was not accepted.`,
    )
    return { status: 'unavailable', values }
  }

  const key = dedupeKey(String(data.get(hiddenFields.submission) ?? ''), values)
  let stored
  try {
    stored = await leads.create(toNewLead(values, locale, key))
  } catch (error) {
    console.error(storeFailure(error))
    return { status: 'failed', values }
  }
  if (stored.outcome === 'duplicate') return { status: 'sent' }

  const receivedAt = new Date()
  const delivered = await notify(notifiers, { values, locale, receivedAt })
  try {
    await leads.markNotification(stored.id, delivered ? 'sent' : 'failed', new Date())
  } catch (error) {
    // The lead stays, with notification_status 'pending': visible as not yet confirmed.
    console.error(storeFailure(error))
  }
  return { status: 'sent' }
}
