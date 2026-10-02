import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EM_DASH } from '../../scripts/lint-policy.mjs'
import { contrast } from '../support/contrast'
import { locales } from '@/i18n/config'
import { contactCopy, projectKinds, timelines } from '@/i18n/dictionaries/contact'
import { privacyCopy } from '@/i18n/dictionaries/privacy'
import { accessibilityCopy } from '@/i18n/dictionaries/accessibility'
import { worlds } from '@/content/worlds'
import {
  cleanValue,
  emptyValues,
  errorMessage,
  normalizeLink,
  readValues,
  validate,
  type ContactValues,
} from '@/lib/contact/validate'
import { isLikelySpam, minFillMs } from '@/lib/contact/spam'
import { claim, resetDedupe, settle } from '@/lib/contact/dedupe'
import {
  assertContactDelivery,
  configuredNotifiers,
  formatInquiry,
  inquirySubject,
} from '@/lib/contact/notifiers'
import { sendInquiry } from '@/lib/contact/action'
import { initialContactState } from '@/lib/contact/state'

const valid: ContactValues = {
  ...emptyValues,
  name: 'Dana Example',
  email: 'dana@example.com',
  goal: 'A booking system for a small studio',
  details: 'Bookings live in three spreadsheets and nobody knows which one is right.',
}

function form(values: Partial<Record<string, string>>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) if (value !== undefined) data.set(key, value)
  return data
}

function leaves(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object' || value === null) return []
  return Object.values(value).flatMap(leaves)
}

function shape(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  if (Array.isArray(value)) return [`${prefix}[]`]
  return Object.entries(value).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k))
}

describe('Phase 6 copy', () => {
  it('has the same shape in both locales, no empty strings and no em dashes', () => {
    for (const copy of [contactCopy, privacyCopy, accessibilityCopy]) {
      expect(shape(copy.he).sort()).toEqual(shape(copy.en).sort())
      for (const locale of locales) {
        for (const text of leaves(copy[locale])) {
          expect(text.trim()).not.toBe('')
          expect(text).not.toContain(EM_DASH)
        }
      }
    }
    for (const locale of locales) {
      expect(Object.keys(contactCopy[locale].form.kind.options)).toEqual(projectKinds)
      expect(Object.keys(contactCopy[locale].form.timeline.options)).toEqual(timelines)
      expect(privacyCopy[locale].sections.length).toBe(privacyCopy.en.sections.length)
      expect(accessibilityCopy[locale].sections.length).toBe(accessibilityCopy.en.sections.length)
    }
  })

  it('keeps the closing scene’s action and the success state as directed', () => {
    expect(contactCopy.en.cta).toBe('Start a project')
    expect(contactCopy.he.cta).toBe('מתחילים פרויקט')
    expect(contactCopy.en.success.title).toBe('Got it.')
    expect(contactCopy.he.success.title).toBe('קיבלתי.')
  })

  it('makes no conformance, certification or response-time claim', () => {
    for (const locale of locales) {
      const text = [
        ...leaves(contactCopy[locale]),
        ...leaves(accessibilityCopy[locale]),
        ...leaves(privacyCopy[locale]),
      ]
        .join(' ')
        .toLowerCase()
      for (const claim of [
        'fully compliant',
        'fully accessible',
        'certified',
        'conforms to',
        'within 24',
        'business days',
        'we collect nothing',
        'נגיש במלואו',
        'תוך 24',
        'ימי עסקים',
      ])
        expect(text, claim).not.toContain(claim)
    }
    // Agency clichés are not the action.
    for (const cliche of ['discovery call', 'get a quote', 'let’s connect', "let's connect"])
      expect(contactCopy.en.cta.toLowerCase()).not.toContain(cliche)
  })

  it('names every service the site actually uses on the privacy page', () => {
    const items = privacyCopy.en.sections.flatMap((s) => [...s.body, ...(s.list ?? [])]).join(' ')
    for (const service of ['Vercel', 'Resend', 'Enable', 'cdn.enable.co.il', 'NEXT_LOCALE'])
      expect(items).toContain(service)
    expect(items).toMatch(/no analytics/i)
  })

  it('shows errors legibly on the contact page’s graphite world', () => {
    for (const surface of [worlds.graphite.colors.surface0, worlds.graphite.colors.surface1]) {
      expect(contrast('#ffa38f', surface)).toBeGreaterThanOrEqual(4.5)
      // The amber action: dark text on amber.
      expect(contrast(worlds.graphite.colors.accent, surface)).toBeGreaterThanOrEqual(3)
    }
    expect(
      contrast(worlds.graphite.colors.surface0, worlds.graphite.colors.accent),
    ).toBeGreaterThan(4.5)
  })
})

describe('contact validation', () => {
  it('accepts a complete inquiry', () => {
    expect(validate(valid)).toEqual({})
  })

  it('requires name, email, goal and details, in form order', () => {
    expect(Object.entries(validate(emptyValues))).toEqual([
      ['name', { code: 'nameRequired' }],
      ['email', { code: 'emailRequired' }],
      ['goal', { code: 'goalRequired' }],
      ['details', { code: 'detailsRequired' }],
    ])
  })

  it('checks email, length, links and choices', () => {
    expect(validate({ ...valid, email: 'not-an-email' }).email?.code).toBe('emailInvalid')
    expect(validate({ ...valid, email: 'a@b.c' }).email?.code).toBe('emailInvalid')
    expect(validate({ ...valid, email: 'x@y.com\nBcc: z@q.com' }).email?.code).toBe('emailInvalid')
    expect(validate({ ...valid, details: 'Too short' }).details).toEqual({
      code: 'detailsShort',
      limit: 20,
    })
    expect(validate({ ...valid, details: 'x'.repeat(4001) }).details).toEqual({
      code: 'tooLong',
      limit: 4000,
    })
    expect(validate({ ...valid, link: 'javascript:alert(1)' }).link?.code).toBe('linkInvalid')
    expect(validate({ ...valid, link: 'example.com' })).toEqual({})
    expect(validate({ ...valid, kind: 'website', timeline: 'soon' })).toEqual({})
    expect(validate({ ...valid, kind: 'anything' }).kind?.code).toBe('optionInvalid')
  })

  it('makes links absolute and refuses anything but http(s)', () => {
    expect(normalizeLink('example.com')).toBe('https://example.com/')
    expect(normalizeLink('http://example.co.il/page')).toBe('http://example.co.il/page')
    expect(normalizeLink('ftp://example.com')).toBeNull()
    expect(normalizeLink('data:text/html,hi')).toBeNull()
    expect(normalizeLink('https://user:pass@example.com')).toBeNull()
    expect(normalizeLink('localhost')).toBeNull()
  })

  it('cleans control and bidi override characters, keeps lines in the message', () => {
    expect(cleanValue('  Dana\u0000 \u202eExample\r\n')).toBe('Dana Example')
    expect(cleanValue('line one\r\nline two\u0007', true)).toBe('line one\nline two')
    expect(cleanValue(42)).toBe('')
    const data = form({ name: '  Dana  ', details: 'a\n\n\n\n\n\nb', unknown: 'ignored' })
    const values = readValues(data)
    expect(values.name).toBe('Dana')
    expect(values.details).toBe('a\n\n\nb')
    expect(values).not.toHaveProperty('unknown')
  })

  it('fills limits into localized messages', () => {
    expect(errorMessage(contactCopy.he.form.errors.tooLong, { code: 'tooLong', limit: 200 })).toBe(
      'עד 200 תווים, בבקשה.',
    )
  })
})

describe('spam and duplicate protection', () => {
  it('drops trap fills and instant posts, never people without JavaScript', () => {
    const now = 1_000_000
    expect(isLikelySpam({ trap: 'x', startedAt: '', now, minMs: 3000 })).toBe(true)
    expect(isLikelySpam({ trap: '', startedAt: String(now - 500), now, minMs: 3000 })).toBe(true)
    expect(isLikelySpam({ trap: '', startedAt: String(now - 5000), now, minMs: 3000 })).toBe(false)
    expect(isLikelySpam({ trap: '', startedAt: '', now, minMs: 3000 })).toBe(false)
    expect(isLikelySpam({ trap: '', startedAt: 'nonsense', now, minMs: 3000 })).toBe(false)
    expect(isLikelySpam({ trap: '', startedAt: String(now + 9999), now, minMs: 3000 })).toBe(false)
  })

  it('reads the minimum fill time from the environment, defaulting to three seconds', () => {
    expect(minFillMs({})).toBe(3000)
    expect(minFillMs({ CONTACT_MIN_FILL_MS: '0' })).toBe(0)
    expect(minFillMs({ CONTACT_MIN_FILL_MS: '-5' })).toBe(3000)
  })

  it('delivers one key once, and again only after a failure', () => {
    resetDedupe()
    expect(claim('k', 0)).toBe(true)
    expect(claim('k', 1)).toBe(false)
    settle('k', false, 2)
    expect(claim('k', 3)).toBe(true)
    settle('k', true, 4)
    expect(claim('k', 5)).toBe(false)
    expect(claim('k', 4 + 11 * 60 * 1000)).toBe(true)
  })
})

describe('delivery boundary', () => {
  it('configures only complete notifiers, and never the test outbox on Vercel', () => {
    expect(configuredNotifiers({})).toEqual([])
    expect(configuredNotifiers({ RESEND_API_KEY: 'k', CONTACT_EMAIL_TO: 'a@b.co' })).toEqual([])
    const names = (env: Record<string, string>) => configuredNotifiers(env).map((n) => n.name)
    expect(
      names({ RESEND_API_KEY: 'k', CONTACT_EMAIL_TO: 'a@b.co', CONTACT_EMAIL_FROM: 'c@d.co' }),
    ).toEqual(['resend'])
    expect(names({ TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' })).toEqual(['telegram'])
    expect(names({ CONTACT_OUTBOX_FILE: '/tmp/x' })).toEqual(['outbox'])
    expect(names({ CONTACT_OUTBOX_FILE: '/tmp/x', VERCEL: '1' })).toEqual([])
  })

  it('refuses a Vercel production build that could not deliver', () => {
    expect(() => assertContactDelivery({})).not.toThrow()
    expect(() => assertContactDelivery({ VERCEL_ENV: 'preview' })).not.toThrow()
    expect(() => assertContactDelivery({ VERCEL_ENV: 'production' })).toThrow(/No delivery/)
    expect(() =>
      assertContactDelivery({
        VERCEL_ENV: 'production',
        RESEND_API_KEY: 'k',
        CONTACT_EMAIL_TO: 'a@b.co',
        CONTACT_EMAIL_FROM: 'c@d.co',
      }),
    ).not.toThrow()
  })

  it('formats a plain-text message with a header-safe subject', () => {
    const inquiry = {
      values: { ...valid, kind: 'website', timeline: 'later', link: 'example.com' },
      locale: 'he' as const,
      receivedAt: new Date('2026-10-02T10:00:00Z'),
    }
    const text = formatInquiry(inquiry)
    expect(text).toContain('Website or digital experience')
    expect(text).toContain('Later on')
    expect(text).toContain('https://example.com/')
    expect(text).toContain('Sent from the Hebrew site')
    expect(text).not.toMatch(/<[a-z]/i)
    expect(inquirySubject(inquiry)).toBe('New project inquiry: Dana Example')
    expect(inquirySubject(inquiry)).not.toMatch(/[\r\n]/)
  })
})

describe('the server action', () => {
  let dir: string
  beforeEach(() => {
    resetDedupe()
    dir = mkdtempSync(path.join(tmpdir(), 'contact-'))
    vi.stubEnv('CONTACT_MIN_FILL_MS', '0')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const outbox = () => {
    try {
      return readFileSync(path.join(dir, 'outbox.jsonl'), 'utf8').trim().split('\n').filter(Boolean)
    } catch {
      return []
    }
  }

  it('returns field errors and the values, and sends nothing', async () => {
    vi.stubEnv('CONTACT_OUTBOX_FILE', path.join(dir, 'outbox.jsonl'))
    const state = await sendInquiry(initialContactState, form({ name: 'Dana', email: 'nope' }))
    expect(state.status).toBe('invalid')
    expect(Object.keys(state.errors ?? {})).toEqual(['email', 'goal', 'details'])
    expect(state.values?.name).toBe('Dana')
    expect(outbox()).toEqual([])
  })

  it('answers unavailable without a configured notifier, without logging the inquiry', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = await sendInquiry(initialContactState, form(valid))
    expect(state.status).toBe('unavailable')
    expect(state.values?.email).toBe(valid.email)
    const logged = error.mock.calls.flat().join(' ')
    expect(logged).not.toContain(valid.email)
    expect(logged).not.toContain(valid.details)
  })

  it('delivers once per submission id', async () => {
    vi.stubEnv('CONTACT_OUTBOX_FILE', path.join(dir, 'outbox.jsonl'))
    const data = form({
      ...valid,
      submission: 'a1b2c3d4-e5f6-4711-9abc-def012345678',
      locale: 'en',
    })
    expect((await sendInquiry(initialContactState, data)).status).toBe('sent')
    expect((await sendInquiry(initialContactState, data)).status).toBe('sent')
    expect(outbox()).toHaveLength(1)
    expect(JSON.parse(outbox()[0]!).values.email).toBe(valid.email)
  })

  it('treats the same message without an id (no JavaScript) as one inquiry', async () => {
    vi.stubEnv('CONTACT_OUTBOX_FILE', path.join(dir, 'outbox.jsonl'))
    await sendInquiry(initialContactState, form(valid))
    await sendInquiry(initialContactState, form(valid))
    expect(outbox()).toHaveLength(1)
  })

  it('answers spam like a delivery and delivers nothing', async () => {
    vi.stubEnv('CONTACT_OUTBOX_FILE', path.join(dir, 'outbox.jsonl'))
    vi.stubEnv('CONTACT_MIN_FILL_MS', '3000')
    const trapped = await sendInquiry(initialContactState, form({ ...valid, homepage: 'spam' }))
    const instant = await sendInquiry(
      initialContactState,
      form({ ...valid, started: String(Date.now()) }),
    )
    expect([trapped.status, instant.status]).toEqual(['sent', 'sent'])
    expect(outbox()).toEqual([])
  })

  it('reports a failed delivery without internal details, and allows a retry', async () => {
    vi.stubEnv('RESEND_API_KEY', 'secret-key')
    vi.stubEnv('CONTACT_EMAIL_TO', 'to@example.com')
    vi.stubEnv('CONTACT_EMAIL_FROM', 'from@example.com')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn(async () => new Response('upstream detail', { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)
    const data = form({ ...valid, submission: 'retry-0000-0000-0000-000000000001' })
    const failed = await sendInquiry(initialContactState, data)
    expect(failed).toEqual({ status: 'failed', values: expect.objectContaining(valid) })
    expect(JSON.stringify(failed)).not.toContain('upstream detail')
    expect(error.mock.calls.flat().join(' ')).toMatch(/resend delivery failed \(502\)/)
    expect(error.mock.calls.flat().join(' ')).not.toContain('secret-key')

    fetchMock.mockImplementation(async () => new Response('{}', { status: 200 }))
    expect((await sendInquiry(initialContactState, data)).status).toBe('sent')
    const [url, init] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(String(init.body))
    expect(body).toMatchObject({
      to: ['to@example.com'],
      from: 'from@example.com',
      reply_to: valid.email,
    })
    expect(body).not.toHaveProperty('html')
  })
})
