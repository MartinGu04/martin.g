import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EM_DASH } from '../../scripts/lint-policy.mjs'
import { contrast } from '../support/contrast'
import { locales } from '@/i18n/config'
import { contactCopy, projectKinds, timelines } from '@/i18n/dictionaries/contact'
import { privacyCopy, privacyReview } from '@/i18n/dictionaries/privacy'
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
import { dedupeKey } from '@/lib/contact/dedupe'
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
  description: 'A clear website for a new studio that explains what we offer.',
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
    for (const service of [
      'Vercel',
      'Supabase',
      'Resend',
      'Enable',
      'cdn.enable.co.il',
      'NEXT_LOCALE',
    ])
      expect(items).toContain(service)
    expect(items).toMatch(/no analytics/i)
    // The form's fields, as they are now.
    expect(items).toContain(
      'asks for your name, your email address and a few words about the project',
    )
    expect(items).toContain(
      'a phone number, the kind of project, a business or project name, a relevant link and when you would like to start',
    )
    expect(items).not.toMatch(/problem/i)
    const he = privacyCopy.he.sections.flatMap((s) => s.body).join(' ')
    expect(he).toContain('שם, כתובת אימייל וכמה מילים על הפרויקט')
    expect(he).toContain('מספר טלפון')
  })

  it('describes stored inquiries as they are now (Phase 8), with no invented retention', () => {
    for (const locale of locales) {
      const text = privacyCopy[locale].sections
        .flatMap((s) => [...s.body, ...(s.list ?? [])])
        .join(' ')
      expect(text).toContain('Supabase')
      expect(text).toContain('Resend')
      // The no-database architecture is gone; no period or automatic deletion is claimed.
      expect(text).not.toMatch(/does not keep messages in a database|לא שומר הודעות במסד נתונים/)
      expect(text).not.toMatch(/\b\d+\s*(days?|months?|years?)\b.*(delet|kept|stored)/i)
      expect(text).not.toMatch(/automatically deleted|deleted automatically|נמחקת אוטומטית/i)
    }
    expect(privacyCopy.en.sections[1]!.body.join(' ')).toContain(
      'stored without your IP address or any other information about your device',
    )
  })

  it('keeps new privacy wording a draft until Martin approves it', () => {
    // Phase 8 changed the storage wording; it must not reach production unreviewed.
    expect(privacyReview).toEqual({ en: 'draft', he: 'draft' })
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

  it('requires name, email and the project description, in form order', () => {
    expect(Object.entries(validate(emptyValues))).toEqual([
      ['name', { code: 'nameRequired' }],
      ['email', { code: 'emailRequired' }],
      ['description', { code: 'descriptionRequired' }],
    ])
  })

  it('takes a phone number only if given, in any reasonable format', () => {
    for (const phone of [
      '050-1234567',
      '0501234567',
      '+972 50 123 4567',
      '+972-50-1234567',
      '(212) 555-0100',
      '+44 20 7946 0958',
      '03.123.4567',
    ])
      expect(validate({ ...valid, phone }), phone).toEqual({})
    for (const phone of ['12345', 'call me', '050-123-abc', '+1 (555) 0100 ext 7', '1'.repeat(16)])
      expect(validate({ ...valid, phone }).phone?.code, phone).toBe('phoneInvalid')
    expect(validate({ ...valid, phone: '' })).toEqual({})
  })

  it('offers exactly the new project types and timelines', () => {
    expect(projectKinds).toEqual(['website', 'landing', 'app', 'existing', 'other'])
    expect(timelines).toEqual(['asap', 'month', 'quarter', 'later', 'undecided'])
    expect(contactCopy.en.form.kind.options).toEqual({
      website: 'Website',
      landing: 'Landing page',
      app: 'System / app',
      existing: 'I have an existing website or system',
      other: 'Something else / Not sure yet',
    })
    expect(contactCopy.he.form.timeline.options).toEqual({
      asap: 'בהקדם',
      month: 'בחודש הקרוב',
      quarter: 'תוך 1–3 חודשים',
      later: 'בעוד יותר מ־3 חודשים',
      undecided: 'עדיין אין תאריך',
    })
    for (const kind of [...projectKinds, ...timelines])
      expect(validate({ ...valid, kind, timeline: '' }).kind === undefined).toBe(
        (projectKinds as readonly string[]).includes(kind),
      )
  })

  it('checks email, length, links and choices', () => {
    expect(validate({ ...valid, email: 'not-an-email' }).email?.code).toBe('emailInvalid')
    expect(validate({ ...valid, email: 'a@b.c' }).email?.code).toBe('emailInvalid')
    expect(validate({ ...valid, email: 'x@y.com\nBcc: z@q.com' }).email?.code).toBe('emailInvalid')
    expect(validate({ ...valid, description: 'A website' })).toEqual({})
    expect(validate({ ...valid, description: 'x'.repeat(4001) }).description).toEqual({
      code: 'tooLong',
      limit: 4000,
    })
    expect(validate({ ...valid, link: 'javascript:alert(1)' }).link?.code).toBe('linkInvalid')
    expect(validate({ ...valid, link: 'example.com' })).toEqual({})
    expect(validate({ ...valid, kind: 'landing', timeline: 'quarter' })).toEqual({})
    expect(validate({ ...valid, timeline: 'soon' }).timeline?.code).toBe('optionInvalid')
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
    const data = form({
      name: '  Dana  ',
      description: 'a\n\n\n\n\n\nb',
      goal: 'a field that no longer exists',
      unknown: 'ignored',
    })
    const values = readValues(data)
    expect(values.name).toBe('Dana')
    expect(values.description).toBe('a\n\n\nb')
    expect(Object.keys(values)).toEqual([
      'name',
      'email',
      'phone',
      'kind',
      'description',
      'business',
      'link',
      'timeline',
    ])
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

  it('keys an inquiry by its submission id, or without one by sender and message', () => {
    const id = 'a1b2c3d4-e5f6-4711-9abc-def012345678'
    expect(dedupeKey(id, valid)).toBe(`id:${id}`)
    const hashed = dedupeKey('', valid)
    expect(hashed).toMatch(/^hash:[0-9a-f]{64}$/)
    expect(dedupeKey('', { ...valid })).toBe(hashed)
    expect(dedupeKey('', { ...valid, description: 'Another message' })).not.toBe(hashed)
    // A malformed id is not trusted as a key.
    expect(dedupeKey('short', valid)).toBe(hashed)
    expect(dedupeKey('x'.repeat(65), valid)).toBe(hashed)
    // Within the column's limit.
    expect(dedupeKey('a'.repeat(64), valid).length).toBeLessThanOrEqual(96)
    expect(hashed.length).toBeLessThanOrEqual(96)
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

  it('requires Resend in production, naming only the missing variables', () => {
    expect(() =>
      assertContactDelivery({
        VERCEL_ENV: 'production',
        TELEGRAM_BOT_TOKEN: 'synthetic-token',
        TELEGRAM_CHAT_ID: '1',
      }),
    ).toThrow(/Missing: RESEND_API_KEY, CONTACT_EMAIL_TO, CONTACT_EMAIL_FROM/)
    let message = ''
    try {
      assertContactDelivery({
        VERCEL_ENV: 'production',
        RESEND_API_KEY: 'synthetic-secret-key',
        CONTACT_EMAIL_TO: ' ',
        CONTACT_EMAIL_FROM: 'c@d.co',
      })
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toMatch(/Missing: CONTACT_EMAIL_TO \(/)
    expect(message).not.toContain('synthetic-secret-key')
  })

  it('formats a plain-text message with a header-safe subject', () => {
    const inquiry = {
      values: {
        ...valid,
        phone: '+972 50 123 4567',
        kind: 'landing',
        timeline: 'quarter',
        link: 'example.com',
      },
      locale: 'he' as const,
      receivedAt: new Date('2026-10-02T10:00:00Z'),
    }
    const text = formatInquiry(inquiry)
    expect(text).toContain('Phone\n+972 50 123 4567')
    expect(text).toContain('What kind of project is it?\nLanding page')
    expect(text).toContain('When would you like to start?\nWithin 1–3 months')
    expect(text).toContain(`Tell me a little about the project\n${valid.description}`)
    expect(text).toContain('https://example.com/')
    // Only the current fields: nothing from the earlier form.
    expect(text).not.toMatch(/problem|trying to build/i)
    expect(text).toContain('Sent from the Hebrew site')
    expect(text).not.toMatch(/<[a-z]/i)
    expect(inquirySubject(inquiry)).toBe('New project inquiry: Dana Example')
    expect(inquirySubject(inquiry)).not.toMatch(/[\r\n]/)
  })
})

describe('the server action', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'contact-'))
    vi.stubEnv('CONTACT_MIN_FILL_MS', '0')
    // The local lead store (a file); Supabase itself is covered in contact-leads.test.ts.
    vi.stubEnv('CONTACT_LEADS_FILE', path.join(dir, 'leads.json'))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const leads = () => {
    try {
      return JSON.parse(readFileSync(path.join(dir, 'leads.json'), 'utf8')) as Record<
        string,
        unknown
      >[]
    } catch {
      return []
    }
  }

  const outbox = () => {
    try {
      return readFileSync(path.join(dir, 'outbox.jsonl'), 'utf8').trim().split('\n').filter(Boolean)
    } catch {
      return []
    }
  }

  it('returns field errors and the values, and sends nothing', async () => {
    vi.stubEnv('CONTACT_OUTBOX_FILE', path.join(dir, 'outbox.jsonl'))
    const state = await sendInquiry(
      initialContactState,
      form({ name: 'Dana', email: 'nope', phone: 'call me' }),
    )
    expect(state.status).toBe('invalid')
    expect(Object.keys(state.errors ?? {})).toEqual(['email', 'phone', 'description'])
    expect(state.values?.name).toBe('Dana')
    expect(outbox()).toEqual([])
    expect(leads()).toEqual([])
  })

  it('answers unavailable without a configured notifier, without logging the inquiry', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = await sendInquiry(initialContactState, form(valid))
    expect(leads()).toEqual([])
    expect(state.status).toBe('unavailable')
    expect(state.values?.email).toBe(valid.email)
    const logged = error.mock.calls.flat().join(' ')
    expect(logged).not.toContain(valid.email)
    expect(logged).not.toContain(valid.description)
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
    expect(leads()).toHaveLength(1)
    expect(leads()[0]).toMatchObject({ locale: 'en', notification_status: 'sent' })
  })

  it('treats the same message without an id (no JavaScript) as one inquiry', async () => {
    vi.stubEnv('CONTACT_OUTBOX_FILE', path.join(dir, 'outbox.jsonl'))
    await sendInquiry(initialContactState, form(valid))
    await sendInquiry(initialContactState, form(valid))
    expect(outbox()).toHaveLength(1)
    expect(leads()).toHaveLength(1)
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
    expect(leads()).toEqual([])
  })

  it('sends the Resend message plain text, with the visitor as reply-to', async () => {
    vi.stubEnv('RESEND_API_KEY', 'secret-key')
    vi.stubEnv('CONTACT_EMAIL_TO', 'to@example.com')
    vi.stubEnv('CONTACT_EMAIL_FROM', 'from@example.com')
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const data = form({ ...valid, submission: 'retry-0000-0000-0000-000000000001' })
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
    expect(body.text).toContain(valid.description)
    expect(body.text).not.toMatch(/What is the problem|trying to build/)
  })
})
