import 'server-only'
import { appendFile } from 'node:fs/promises'
import type { Locale } from '@/i18n/config'
import { contactCopy } from '@/i18n/dictionaries/contact'
import { isProjectKind, isTimeline, normalizeLink, type ContactValues } from './validate'

/*
 * Where an inquiry goes. No database: each inquiry is handed to the configured notifiers
 * and kept nowhere else. Credentials are server-side environment variables only (never
 * NEXT_PUBLIC_), read at request time, and never echoed in errors or logs.
 *
 *   Resend (email, the primary channel)   RESEND_API_KEY, CONTACT_EMAIL_TO, CONTACT_EMAIL_FROM
 *   Telegram (an optional phone ping)     TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   Outbox file (local and CI tests)      CONTACT_OUTBOX_FILE; refused on Vercel
 *
 * The privacy page (src/i18n/dictionaries/privacy.ts) names Resend. Turning Telegram on
 * means updating that copy first.
 */

export interface Inquiry {
  values: ContactValues
  locale: Locale
  receivedAt: Date
}

export interface ContactNotifier {
  readonly name: string
  send(inquiry: Inquiry): Promise<void>
}

/** Thrown with a status only; the caller logs the notifier and the status, nothing else. */
export class DeliveryError extends Error {
  constructor(
    readonly notifier: string,
    readonly status: number | 'network',
  ) {
    super(`${notifier} delivery failed (${status})`)
  }
}

const TIMEOUT_MS = 8000

/** The inquiry as plain text, labelled in English for Martin. Never HTML. */
export function formatInquiry({ values, locale, receivedAt }: Inquiry): string {
  const form = contactCopy.en.form
  const kind = isProjectKind(values.kind) ? form.kind.options[values.kind] : ''
  const timeline = isTimeline(values.timeline) ? form.timeline.options[values.timeline] : ''
  const link = values.link ? (normalizeLink(values.link) ?? '') : ''
  const lines: [string, string][] = [
    ['Name', values.name],
    ['Email', values.email],
    [form.kind.legend, kind],
    [form.goal.label, values.goal],
    [form.business.label, values.business],
    [form.link.label, link],
    [form.timeline.legend, timeline],
  ]
  return [
    ...lines.filter(([, value]) => value).map(([label, value]) => `${label}\n${value}\n`),
    `${form.details.label}\n${values.details}\n`,
    `Sent from the ${locale === 'he' ? 'Hebrew' : 'English'} site, ${receivedAt.toISOString()}`,
  ].join('\n')
}

export function inquirySubject({ values }: Inquiry): string {
  return `New project inquiry: ${values.name}`.slice(0, 160)
}

async function post(notifier: string, url: string, init: RequestInit): Promise<void> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new DeliveryError(notifier, 'network')
  }
  if (!response.ok) throw new DeliveryError(notifier, response.status)
}

export function resendNotifier(config: {
  apiKey: string
  to: string
  from: string
}): ContactNotifier {
  return {
    name: 'resend',
    send: (inquiry) =>
      post('resend', 'https://api.resend.com/emails', {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.from,
          to: [config.to],
          reply_to: inquiry.values.email,
          subject: inquirySubject(inquiry),
          text: formatInquiry(inquiry),
        }),
      }),
  }
}

export function telegramNotifier(config: { token: string; chatId: string }): ContactNotifier {
  return {
    name: 'telegram',
    send: (inquiry) =>
      post('telegram', `https://api.telegram.org/bot${config.token}/sendMessage`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          // Plain text (no parse mode), within Telegram's 4096 character limit.
          text: `${inquirySubject(inquiry)}\n\n${formatInquiry(inquiry)}`.slice(0, 4000),
          link_preview_options: { is_disabled: true },
        }),
      }),
  }
}

/** Appends each inquiry as one JSON line to a local file, for end-to-end tests. */
export function outboxNotifier(file: string): ContactNotifier {
  return {
    name: 'outbox',
    send: async (inquiry) => {
      await appendFile(file, `${JSON.stringify({ ...inquiry, receivedAt: inquiry.receivedAt })}\n`)
    },
  }
}

type Env = Record<string, string | undefined>

/** Every notifier whose configuration is complete. Empty means sending is unavailable. */
export function configuredNotifiers(env: Env = process.env): ContactNotifier[] {
  const notifiers: ContactNotifier[] = []
  const { RESEND_API_KEY, CONTACT_EMAIL_TO, CONTACT_EMAIL_FROM } = env
  if (RESEND_API_KEY && CONTACT_EMAIL_TO && CONTACT_EMAIL_FROM)
    notifiers.push(
      resendNotifier({ apiKey: RESEND_API_KEY, to: CONTACT_EMAIL_TO, from: CONTACT_EMAIL_FROM }),
    )
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = env
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
    notifiers.push(telegramNotifier({ token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID }))
  // The test outbox never runs on Vercel, so it can never stand in for real delivery.
  if (env.CONTACT_OUTBOX_FILE && !env.VERCEL)
    notifiers.push(outboxNotifier(env.CONTACT_OUTBOX_FILE))
  return notifiers
}

/**
 * A production deployment must be able to deliver, or the site's only conversion path
 * would be a dead end: a Vercel production build fails without a configured notifier.
 * Preview and local builds only build; their form answers "unavailable" until configured.
 */
export function assertContactDelivery(env: Env = process.env): void {
  if (env.VERCEL_ENV !== 'production') return
  if (configuredNotifiers(env).length > 0) return
  throw new Error(
    '[contact] No delivery configured for the contact form. Set RESEND_API_KEY, CONTACT_EMAIL_TO and CONTACT_EMAIL_FROM (docs/ARCHITECTURE.md, "Contact").',
  )
}
