import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendInquiry } from '@/lib/contact/action'
import { initialContactState } from '@/lib/contact/state'
import { emptyValues, type ContactValues } from '@/lib/contact/validate'
import {
  assertLeadStorage,
  leadStoreConfig,
  leadStoreProblems,
  supabaseOrigin,
} from '@/lib/leads/config'
import { configuredLeadRepository, toNewLead } from '@/lib/leads/repository'
import { checkBrowserOutput, checkNextPublic } from '../../scripts/lint-policy.mjs'
import { FAKE_SECRET_KEY, FAKE_SUPABASE_URL, fakeBackends } from '../support/fake-supabase'

/*
 * The Contact action with Supabase as the durable record and Resend as the notification.
 * The real Supabase client and Resend notifier run against fakeBackends() at the fetch
 * boundary: no request leaves the process, and no real database is ever used.
 */

const valid: ContactValues = {
  ...emptyValues,
  name: 'Dana Example',
  email: 'dana@example.com',
  description: 'A clear website for a new studio that explains what we offer.',
}

const submission = 'a1b2c3d4-e5f6-4711-9abc-def012345678'

function form(values: Partial<Record<string, string>>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) if (value !== undefined) data.set(key, value)
  return data
}

describe('Contact action with Supabase and Resend', () => {
  let backends: ReturnType<typeof fakeBackends>
  let logged: () => string

  beforeEach(() => {
    backends = fakeBackends()
    vi.stubGlobal('fetch', backends.fetch)
    vi.stubEnv('CONTACT_MIN_FILL_MS', '0')
    vi.stubEnv('SUPABASE_URL', FAKE_SUPABASE_URL)
    vi.stubEnv('SUPABASE_SECRET_KEY', FAKE_SECRET_KEY)
    vi.stubEnv('RESEND_API_KEY', 're_synthetic_key')
    vi.stubEnv('CONTACT_EMAIL_TO', 'to@example.com')
    vi.stubEnv('CONTACT_EMAIL_FROM', 'from@example.com')
    // Never the local stand-ins: only Supabase and Resend.
    vi.stubEnv('CONTACT_LEADS_FILE', '')
    vi.stubEnv('CONTACT_OUTBOX_FILE', '')
    vi.stubEnv('TELEGRAM_BOT_TOKEN', '')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logged = () => [...error.mock.calls, ...warn.mock.calls].flat().map(String).join('\n')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const send = (values: Partial<Record<string, string>>) =>
    sendInquiry(initialContactState, form(values))
  const resendCalls = () => backends.requests.filter((r) => r.url.hostname === 'api.resend.com')
  const inserts = () =>
    backends.requests.filter((r) => r.method === 'POST' && r.url.pathname === '/rest/v1/leads')

  /** Nothing the visitor typed, and no secret, may appear in a log. */
  const expectCleanLogs = () => {
    const text = logged()
    for (const secret of [
      valid.email,
      valid.description,
      valid.name,
      FAKE_SECRET_KEY,
      're_synthetic_key',
    ])
      expect(text).not.toContain(secret)
    expect(text).not.toContain('synthetic outage detail')
  }

  it('persists a valid inquiry, then notifies, and marks the lead sent', async () => {
    const state = await send({
      ...valid,
      phone: '+972 50 123 4567',
      kind: 'landing',
      business: 'Studio Example',
      link: 'example.com',
      timeline: 'quarter',
      submission,
      locale: 'he',
    })
    expect(state).toEqual({ status: 'sent' })
    expect(backends.rows).toHaveLength(1)
    expect(backends.rows[0]).toMatchObject({
      locale: 'he',
      name: 'Dana Example',
      email: 'dana@example.com',
      phone: '+972 50 123 4567',
      kind: 'landing',
      description: valid.description,
      business: 'Studio Example',
      link: 'https://example.com/',
      timeline: 'quarter',
      dedupe_key: `id:${submission}`,
      notification_status: 'sent',
    })
    expect(Date.parse(String(backends.rows[0]!.notification_sent_at))).not.toBeNaN()
    expect(Date.parse(String(backends.rows[0]!.updated_at))).not.toBeNaN()
    // Stored before the notification was sent.
    const order = backends.requests.map((r) => `${r.method} ${r.url.hostname}`)
    expect(order).toEqual([
      'POST synthetic-project.supabase.example',
      'POST api.resend.com',
      'PATCH synthetic-project.supabase.example',
    ])
    expectCleanLogs()
  })

  it('stores blank optional fields as null, never as empty strings', async () => {
    await send({ ...valid, submission })
    const body = inserts()[0]!.body as Record<string, unknown>
    for (const field of ['phone', 'kind', 'business', 'link', 'timeline'])
      expect(body[field], field).toBeNull()
    expect(Object.values(body)).not.toContain('')
  })

  it('stores only the inquiry, its locale and its key: no request metadata', async () => {
    const data = form({ ...valid, submission, locale: 'en', homepage: '', started: '1' })
    data.set('user_agent', 'synthetic agent')
    data.set('ip', '192.0.2.1')
    await sendInquiry(initialContactState, data)
    const body = inserts()[0]!.body as Record<string, unknown>
    expect(Object.keys(body).sort()).toEqual(
      [
        'business',
        'dedupe_key',
        'description',
        'email',
        'kind',
        'link',
        'locale',
        'name',
        'phone',
        'timeline',
      ].sort(),
    )
    expect(JSON.stringify(body)).not.toMatch(/192\.0\.2\.1|synthetic agent/)
  })

  it('talks to Supabase as the server: the secret key, an idempotent insert, no session', async () => {
    await send({ ...valid, submission })
    const insert = inserts()[0]!
    expect(insert.url.searchParams.get('on_conflict')).toBe('dedupe_key')
    expect(insert.headers.get('prefer')).toMatch(/resolution=ignore-duplicates/)
    expect(insert.headers.get('apikey')).toBe(FAKE_SECRET_KEY)
    // No visitor session can ride along: the only credential is the secret key itself
    // (supabase-js repeats it as the bearer, which the API gateway accepts for its own key).
    expect([null, `Bearer ${FAKE_SECRET_KEY}`]).toContain(insert.headers.get('authorization'))
    expect(insert.headers.get('cookie')).toBeNull()
    // Only the Data API: no auth, session or realtime traffic.
    for (const request of backends.requests.filter((r) => r.url.hostname !== 'api.resend.com'))
      expect(request.url.pathname).toBe('/rest/v1/leads')
  })

  it('does not create a second lead or a second notification for the same submission', async () => {
    const data = { ...valid, submission, locale: 'en' }
    expect((await send(data)).status).toBe('sent')
    expect((await send(data)).status).toBe('sent')
    // Two at once, as from two instances: the unique key still decides.
    const both = await Promise.all([send(data), send(data)])
    expect(both.map((s) => s.status)).toEqual(['sent', 'sent'])
    expect(backends.rows).toHaveLength(1)
    expect(resendCalls()).toHaveLength(1)
  })

  it('treats the same message without an id (no JavaScript) as one lead', async () => {
    await send(valid)
    await send(valid)
    expect(backends.rows).toHaveLength(1)
    expect(backends.rows[0]!.dedupe_key).toMatch(/^hash:[0-9a-f]{64}$/)
    expect(resendCalls()).toHaveLength(1)
  })

  it('stores nothing and sends nothing for spam, answered like a delivery', async () => {
    vi.stubEnv('CONTACT_MIN_FILL_MS', '3000')
    const trapped = await send({ ...valid, homepage: 'spam' })
    const instant = await send({ ...valid, started: String(Date.now()) })
    expect([trapped.status, instant.status]).toEqual(['sent', 'sent'])
    expect(backends.requests).toEqual([])
    expect(backends.rows).toEqual([])
  })

  it('stores nothing and sends nothing for an invalid inquiry', async () => {
    const state = await send({ name: 'Dana', email: 'nope', phone: 'call me' })
    expect(state.status).toBe('invalid')
    expect(backends.requests).toEqual([])
  })

  it('answers failed, values kept, when the database fails; nothing is notified', async () => {
    for (const outage of ['error', 'network'] as const) {
      backends.database = outage
      const state = await send({ ...valid, submission })
      expect(state).toEqual({ status: 'failed', values: expect.objectContaining(valid) })
      expect(JSON.stringify(state)).not.toMatch(/57P01|outage|fetch failed/)
    }
    expect(resendCalls()).toEqual([])
    expect(logged()).toMatch(/\[contact\] Lead create failed in supabase \(57P01\)\./)
    expect(logged()).toMatch(/\[contact\] Lead create failed in supabase \(network\)\./)
    expectCleanLogs()

    // The visitor's retry, once the database is back, is stored and notified once.
    backends.database = 'ok'
    expect((await send({ ...valid, submission })).status).toBe('sent')
    expect(backends.rows).toHaveLength(1)
    expect(resendCalls()).toHaveLength(1)
  })

  it('keeps the lead and answers sent when the notification fails, marking it failed', async () => {
    backends.resend = 'error'
    const state = await send({ ...valid, submission })
    // The inquiry is stored, so it has reached MARTIN.G: the visitor is not asked to resend.
    expect(state).toEqual({ status: 'sent' })
    expect(backends.rows).toHaveLength(1)
    expect(backends.rows[0]).toMatchObject({
      notification_status: 'failed',
      notification_sent_at: null,
    })
    expect(logged()).toMatch(/\[contact\] resend delivery failed \(502\)\./)
    expect(logged()).not.toContain('upstream detail')
    expectCleanLogs()

    // A resend of the same form is already received: no second lead, no new attempt.
    expect((await send({ ...valid, submission })).status).toBe('sent')
    expect(backends.rows).toHaveLength(1)
    expect(resendCalls()).toHaveLength(1)
  })

  it('answers sent when only recording the notification fails; the lead stays pending', async () => {
    backends.databaseUpdate = 'error'
    expect((await send({ ...valid, submission })).status).toBe('sent')
    expect(backends.rows[0]).toMatchObject({ notification_status: 'pending' })
    expect(logged()).toMatch(/\[contact\] Lead update failed in supabase \(08006\)\./)
    expectCleanLogs()
  })

  it('answers unavailable, storing and sending nothing, without lead storage', async () => {
    vi.stubEnv('SUPABASE_URL', '')
    const state = await send({ ...valid, submission })
    expect(state.status).toBe('unavailable')
    expect(backends.requests).toEqual([])
    expect(logged()).toMatch(/lead storage: missing, notification: ok/)
    expectCleanLogs()
  })

  it('answers unavailable without a notifier, storing nothing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    expect((await send({ ...valid, submission })).status).toBe('unavailable')
    expect(backends.requests).toEqual([])
    expect(logged()).toMatch(/lead storage: ok, notification: missing/)
  })
})

describe('lead mapping', () => {
  it('maps an inquiry to the table, blanks to null and the link made absolute', () => {
    expect(toNewLead(valid, 'en', 'id:x')).toEqual({
      locale: 'en',
      name: valid.name,
      email: valid.email,
      phone: null,
      kind: null,
      description: valid.description,
      business: null,
      link: null,
      timeline: null,
      dedupe_key: 'id:x',
    })
    expect(toNewLead({ ...valid, link: 'example.co.il/x' }, 'he', 'k').link).toBe(
      'https://example.co.il/x',
    )
  })
})

describe('lead storage configuration', () => {
  const complete = { SUPABASE_URL: FAKE_SUPABASE_URL, SUPABASE_SECRET_KEY: FAKE_SECRET_KEY }

  it('accepts the project URL and a secret API key only', () => {
    expect(leadStoreConfig(complete)).toEqual({
      url: FAKE_SUPABASE_URL,
      secretKey: FAKE_SECRET_KEY,
    })
    expect(supabaseOrigin('https://abc.supabase.co/')).toBe('https://abc.supabase.co')
    expect(supabaseOrigin('http://127.0.0.1:54321')).toBe('http://127.0.0.1:54321')
    for (const url of [
      'http://abc.supabase.co',
      'https://abc.supabase.co/rest/v1',
      'https://user:pass@abc.supabase.co',
      'abc.supabase.co',
      '',
    ])
      expect(supabaseOrigin(url), url).toBeNull()
    for (const key of [
      'sb_publishable_synthetic',
      'eyJhbGciOiJIUzI1NiJ9.synthetic.jwt',
      'sb_secret_',
      '',
    ])
      expect(leadStoreConfig({ ...complete, SUPABASE_SECRET_KEY: key }), key).toBeNull()
  })

  it('names problems by variable, never by value', () => {
    expect(leadStoreProblems({})).toEqual([
      'SUPABASE_URL is missing',
      'SUPABASE_SECRET_KEY is missing',
    ])
    const problems = leadStoreProblems({
      SUPABASE_URL: 'http://synthetic-host.example/path',
      SUPABASE_SECRET_KEY: 'sb_publishable_synthetic_value',
    }).join(' ')
    expect(problems).toMatch(/SUPABASE_URL is not the project URL/)
    expect(problems).toMatch(/SUPABASE_SECRET_KEY is not a secret API key \(sb_secret_\.\.\.\)/)
    expect(problems).not.toMatch(/synthetic-host|synthetic_value/)
  })

  it('fails a Vercel production build without valid storage, and nothing else', () => {
    expect(() => assertLeadStorage({})).not.toThrow()
    expect(() => assertLeadStorage({ VERCEL: '1', VERCEL_ENV: 'preview' })).not.toThrow()
    expect(() => assertLeadStorage({ VERCEL_ENV: 'production' })).toThrow(
      /\[leads\] No lead storage configured for the contact form: SUPABASE_URL is missing; SUPABASE_SECRET_KEY is missing/,
    )
    expect(() =>
      assertLeadStorage({
        VERCEL_ENV: 'production',
        ...complete,
        SUPABASE_SECRET_KEY: 'eyJsynthetic',
      }),
    ).toThrow(/SUPABASE_SECRET_KEY is not a secret API key/)
    expect(() => assertLeadStorage({ VERCEL_ENV: 'production', ...complete })).not.toThrow()
  })

  it('uses the local file store only off Vercel, and Supabase whenever configured', () => {
    expect(configuredLeadRepository({})).toBeNull()
    expect(configuredLeadRepository({ CONTACT_LEADS_FILE: '/tmp/x' })?.name).toBe('file')
    expect(configuredLeadRepository({ CONTACT_LEADS_FILE: '/tmp/x', VERCEL: '1' })).toBeNull()
    expect(configuredLeadRepository({ ...complete, CONTACT_LEADS_FILE: '/tmp/x' })?.name).toBe(
      'supabase',
    )
  })
})

describe('the server-only boundary', () => {
  const root = path.resolve(__dirname, '../..')
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    )

  it('keeps every leads module server-only, and no client component imports one', () => {
    for (const file of walk(path.join(root, 'src/lib/leads'))) {
      if (file.endsWith('database.ts')) continue // types and constants only
      expect(readFileSync(file, 'utf8'), file).toMatch(/^import 'server-only'$/m)
    }
    for (const file of walk(path.join(root, 'src')).filter((f) => /\.tsx?$/.test(f))) {
      const source = readFileSync(file, 'utf8')
      if (!/^['"]use client['"]/m.test(source)) continue
      // The table types and constants (database.ts) are pure; nothing else may be imported.
      expect(source, file).not.toMatch(/@\/lib\/leads\/(?!database')|@supabase\//)
    }
  })

  it('fails a build whose browser output carries Supabase configuration or its client', () => {
    // The privacy page may name the service; nothing else may reach the browser.
    expect(checkBrowserOutput('<p>Supabase hosts the private database</p>')).toEqual([])
    for (const leak of [
      'headers:{apikey:"sb_secret_synthetic"}',
      'createClient(url,"sb_publishable_synthetic")',
      'process.env.SUPABASE_URL',
      '"X-Client-Info":"supabase-js/2"',
      'fetch("https://synthetic.supabase.co/rest/v1/leads")',
    ])
      expect(
        checkBrowserOutput(leak).map((p) => p.rule),
        leak,
      ).toContain('server-config')
    expect(checkNextPublic('const url = process.env.NEXT_PUBLIC_SUPABASE_URL')).toHaveLength(1)
  })

  it('never names a browser Supabase variable', () => {
    const example = readFileSync(path.join(root, '.env.example'), 'utf8')
    expect(example).toMatch(/^SUPABASE_URL=$/m)
    expect(example).toMatch(/^SUPABASE_SECRET_KEY=$/m)
    expect(example).not.toMatch(/NEXT_PUBLIC_[A-Z0-9]|SUPABASE_ANON|sb_publishable_[a-z0-9]/)
  })
})
