import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { assertContactDelivery, configuredNotifiers } from '@/lib/contact/notifiers'
import { assertLeadStorage, leadStoreConfig } from '@/lib/leads/config'
import { adminAuthConfig, assertAdminConfiguration } from '@/lib/admin/config'
import { configuredLeadRepository } from '@/lib/leads/repository'
import {
  assertReleasableArtwork,
  assertReleasableCopy,
  findPendingArtwork,
} from '@/i18n/release-gate'
import { isSpecimenEnabled } from '@/lib/specimen'
import { isIndexable, siteUrl } from '@/lib/site'
import {
  DELIVERY_HOSTS,
  configuredDatabaseHost,
  guardedFetch,
  isGuardedHost,
} from '../../scripts/delivery-guard.mjs'
import {
  CASES,
  DRAFT_COPY,
  SERVER_ONLY_VALUES,
  SIMULATION,
  STRIPPED,
  browserOutputLeaks,
  simulationEnv,
} from '../../scripts/production-simulation.mjs'

// Synthetic stand-ins for configuration a runner might carry. None of it is real.
const inherited = {
  PATH: '/usr/bin',
  NODE_OPTIONS: '--max-old-space-size=4096',
  LEAK_CHECK_TERMS_B64: 'synthetic-terms',
  SITE_URL: 'https://synthetic-real-origin.example',
  RESEND_API_KEY: 'synthetic-real-key',
  CONTACT_EMAIL_TO: 'synthetic-real@inbox.example',
  CONTACT_EMAIL_FROM: 'synthetic-real@sender.example',
  TELEGRAM_BOT_TOKEN: 'synthetic-token',
  TELEGRAM_CHAT_ID: '1',
  CONTACT_OUTBOX_FILE: '/tmp/synthetic-outbox.jsonl',
  CONTACT_LEADS_FILE: '/tmp/synthetic-leads.json',
  SUPABASE_URL: 'https://synthetic-real-project.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_synthetic-real-key',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-real-service-role',
  NEXT_PUBLIC_SUPABASE_URL: 'https://synthetic-real-project.supabase.co',
  POSTGRES_URL: 'postgres://synthetic-real@db.example/postgres',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic-real-key',
  ADMIN_USER_ID: '11111111-1111-4111-8111-111111111111',
  ALLOW_DRAFT_COPY_IN_PRODUCTION: '1',
}

describe('production simulation environment', () => {
  const env = simulationEnv(inherited, { guardLog: '/tmp/synthetic-guard.log' })

  it('simulates Vercel Production', () => {
    expect(env).toMatchObject({ VERCEL: '1', VERCEL_ENV: 'production' })
    expect(isIndexable(env)).toBe(true)
    expect(isSpecimenEnabled(env)).toBe(false)
    expect(siteUrl(env).protocol).toBe('https:')
  })

  it('uses only dummy values on the reserved .example domain', () => {
    for (const name of ['SITE_URL', 'CONTACT_EMAIL_TO', 'CONTACT_EMAIL_FROM'] as const) {
      expect(env[name], name).toMatch(/production-simulation\.example>?$/)
    }
    expect(env.RESEND_API_KEY).toBe(SIMULATION.RESEND_API_KEY)
    expect(env.RESEND_API_KEY).toMatch(/not_a_real_key/)
    expect(new URL(env.SUPABASE_URL!).hostname).toBe('leads.production-simulation.example')
    expect(env.SUPABASE_SECRET_KEY).toBe('sb_secret_ci_simulation_not_a_real_key')
  })

  it('never carries inherited credentials, the outbox or the draft-copy override', () => {
    for (const value of Object.values(env)) {
      expect(value).not.toMatch(/synthetic-real|synthetic-token|synthetic-outbox/)
    }
    for (const name of [
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHAT_ID',
      'CONTACT_OUTBOX_FILE',
      'CONTACT_LEADS_FILE',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'POSTGRES_URL',
    ]) {
      expect(env[name], name).toBeUndefined()
    }
    expect(
      Object.keys(env)
        .filter((name) => name.includes('SUPABASE'))
        .sort(),
    ).toEqual(['SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_URL'])
    expect(env.SUPABASE_PUBLISHABLE_KEY).toBe('sb_publishable_ci_simulation_not_a_real_key')
    expect(env.ADMIN_USER_ID).toBe(SIMULATION.ADMIN_USER_ID)
    expect(env.ADMIN_USER_ID).not.toBe(inherited.ADMIN_USER_ID)
    expect(env.ALLOW_DRAFT_COPY_IN_PRODUCTION).toBeUndefined()
    expect(STRIPPED).toContain('ALLOW_DRAFT_COPY_IN_PRODUCTION')
  })

  it('keeps the leak-check secret and the runner’s Node options, and preloads the guard', () => {
    expect(env.LEAK_CHECK_TERMS_B64).toBe('synthetic-terms')
    expect(env.NODE_OPTIONS).toMatch(
      /^--max-old-space-size=4096 --import=file:.*delivery-guard\.mjs$/,
    )
    expect(env.MG_DELIVERY_GUARD_LOG).toBe('/tmp/synthetic-guard.log')
  })

  it('satisfies the production gates with Resend as the only notifier', () => {
    expect(() => assertContactDelivery(env)).not.toThrow()
    expect(configuredNotifiers(env).map((n) => n.name)).toEqual(['resend'])
  })

  it('satisfies the lead storage gate with Supabase, never the local file', () => {
    expect(() => assertLeadStorage(env)).not.toThrow()
    expect(leadStoreConfig(env)?.url).toBe('https://leads.production-simulation.example')
    expect(configuredLeadRepository(env)?.name).toBe('supabase')
    // The network guard refuses the dummy project, so it can never be reached.
    expect(configuredDatabaseHost(env)).toBe('leads.production-simulation.example')
    expect(isGuardedHost(configuredDatabaseHost(env), configuredDatabaseHost(env))).toBe(true)
  })
})

describe('production simulation cases', () => {
  const env = (name: string) =>
    simulationEnv(inherited, { overrides: CASES.find((c) => c.name.includes(name))!.overrides })

  it('without Contact delivery, the gate refuses with the message the build must show', () => {
    const testCase = CASES.find((c) => c.name.includes('Contact delivery'))!
    let message = ''
    try {
      assertContactDelivery(env('Contact delivery'))
    } catch (error) {
      message = (error as Error).message
    }
    for (const pattern of testCase.expectFailure!) expect(message).toMatch(pattern)
  })

  it('without lead storage, the gate refuses with the message the build must show', () => {
    const testCase = CASES.find((c) => c.name.includes('lead storage'))!
    const caseEnv = env('lead storage')
    expect(caseEnv.SUPABASE_URL).toBeUndefined()
    expect(caseEnv.SUPABASE_SECRET_KEY).toBeUndefined()
    // Every other gate is satisfied, so this one names the reason.
    expect(() => assertContactDelivery(caseEnv)).not.toThrow()
    expect(() => assertLeadStorage(caseEnv)).toThrow(testCase.expectFailure![0])
  })

  it("without the admin's configuration, the gate refuses with the message the build must show", () => {
    const testCase = CASES.find((c) => c.name.includes("admin's configuration"))!
    const caseEnv = env("admin's configuration")
    expect(caseEnv.SUPABASE_PUBLISHABLE_KEY).toBeUndefined()
    expect(caseEnv.ADMIN_USER_ID).toBeUndefined()
    expect(() => assertLeadStorage(caseEnv)).not.toThrow()
    expect(() => assertAdminConfiguration(caseEnv)).toThrow(testCase.expectFailure![0])
    // The complete configuration satisfies it, with synthetic values only.
    const complete = simulationEnv(inherited, { overrides: {} })
    expect(() => assertAdminConfiguration(complete)).not.toThrow()
    expect(adminAuthConfig(complete)?.url).toBe('https://leads.production-simulation.example')
  })

  it('recognizes the copy gate’s refusal, so draft copy can never pass unnoticed', () => {
    let message = ''
    try {
      vi.stubEnv('VERCEL_ENV', 'production')
      vi.stubEnv('ALLOW_DRAFT_COPY_IN_PRODUCTION', '')
      assertReleasableCopy(['dictionary:synthetic', 'privacy:synthetic'])
    } catch (error) {
      message = (error as Error).message
    } finally {
      vi.unstubAllEnvs()
    }
    expect(message.match(DRAFT_COPY)?.[1]).toBe('dictionary:synthetic, privacy:synthetic')
  })

  it('without SITE_URL, the origin refuses with the message the build must show', () => {
    const testCase = CASES.find((c) => c.name.includes('SITE_URL'))!
    expect(() => siteUrl(env('SITE_URL'))).toThrow(testCase.expectFailure![0])
  })

  it('with a site card pending, the artwork gate refuses with the message the build must show', () => {
    const testCase = CASES.find((c) => c.name.includes('awaiting approval'))!
    const caseEnv = env('awaiting approval')
    expect(() => assertReleasableArtwork(findPendingArtwork(caseEnv), caseEnv)).toThrow(
      testCase.expectFailure![0],
    )
    // The complete configuration carries no simulated pending card.
    const complete = simulationEnv(
      { ...inherited, RELEASE_GATE_SIMULATE_PENDING_SITE_CARDS: 'he,en' },
      { overrides: {} },
    )
    expect(findPendingArtwork(complete)).toEqual([])
  })

  it('ends with the complete configuration, which must build', () => {
    expect(CASES.at(-1)).toMatchObject({ overrides: {} })
    expect(CASES.at(-1)!.expectFailure).toBeUndefined()
  })
})

describe('delivery guard', () => {
  it('refuses the notifier hosts and passes everything else through', async () => {
    const recorded: string[] = []
    const calls: unknown[] = []
    const passthrough = async (input: unknown) => {
      calls.push(input)
      return new Response('ok')
    }
    const guarded = guardedFetch(passthrough, (line: string) => recorded.push(line))
    expect(DELIVERY_HOSTS).toEqual(['api.resend.com', 'api.telegram.org'])
    await expect(guarded('https://api.resend.com/emails')).rejects.toThrow(/delivery-guard/)
    await expect(
      guarded(new URL('https://api.telegram.org/botsynthetic/sendMessage')),
    ).rejects.toThrow(/delivery-guard/)
    await expect(guarded(new Request('https://api.resend.com/emails'))).rejects.toThrow()
    expect(await (await guarded('http://localhost:3000/he')).text()).toBe('ok')
    expect(recorded).toEqual([
      'blocked api.resend.com',
      'blocked api.telegram.org',
      'blocked api.resend.com',
    ])
    expect(calls).toEqual(['http://localhost:3000/he'])
  })

  it('refuses Supabase and the configured database host', async () => {
    const recorded: string[] = []
    const passthrough = async () => new Response('ok')
    const guarded = guardedFetch(
      passthrough,
      (line: string) => recorded.push(line),
      'leads.production-simulation.example',
    )
    for (const url of [
      'https://synthetic.supabase.co/rest/v1/leads',
      'https://api.supabase.com/v1/projects',
      'https://synthetic.supabase.in/rest/v1/leads',
      'https://leads.production-simulation.example/rest/v1/leads',
    ])
      await expect(guarded(url, { method: 'POST' })).rejects.toThrow(/delivery-guard/)
    expect(recorded).toEqual([
      'blocked synthetic.supabase.co',
      'blocked api.supabase.com',
      'blocked synthetic.supabase.in',
      'blocked leads.production-simulation.example',
    ])
    expect(isGuardedHost('notsupabase.co')).toBe(false)
    expect(isGuardedHost('example.com')).toBe(false)
  })

  it('stops the real Supabase client in a preloaded process, so no lead can be stored', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'mg-guard-test-'))
    try {
      const log = path.join(dir, 'guard.log')
      const env = simulationEnv({ PATH: process.env.PATH }, { guardLog: log })
      const script = `
        import { createClient } from '@supabase/supabase-js'
        const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
        const { data, error } = await client.from('leads').insert({ name: 'synthetic' }).select('id')
        console.log(JSON.stringify({ data, refused: /delivery-guard/.test(String(error?.message)) }))
      `
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
        cwd: path.resolve(__dirname, '../..'),
        env: env as NodeJS.ProcessEnv,
        encoding: 'utf8',
      })
      expect(result.status, result.stderr).toBe(0)
      expect(JSON.parse(result.stdout.trim().split('\n').at(-1)!)).toEqual({
        data: null,
        refused: true,
      })
      expect(readFileSync(log, 'utf8')).toContain('blocked leads.production-simulation.example')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('browser output check', () => {
  it('finds the server-only dummy values in static assets and prerendered pages', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'mg-browser-output-'))
    try {
      mkdirSync(path.join(dir, 'static', 'chunks'), { recursive: true })
      mkdirSync(path.join(dir, 'server', 'app'), { recursive: true })
      writeFileSync(path.join(dir, 'static', 'chunks', 'clean.js'), 'console.log(1)')
      writeFileSync(path.join(dir, 'server', 'app', 'en.html'), '<p>Privacy: Supabase</p>')
      expect(browserOutputLeaks(dir)).toEqual([])
      writeFileSync(
        path.join(dir, 'static', 'chunks', 'leaky.js'),
        `fetch("${SIMULATION.SUPABASE_URL}", {headers:{apikey:"${SIMULATION.SUPABASE_SECRET_KEY}"}})`,
      )
      const problems = browserOutputLeaks(dir)
      expect(problems).toContain(
        `${path.join('static', 'chunks', 'leaky.js')} carries SUPABASE_SECRET_KEY`,
      )
      expect(problems).toContain(
        `${path.join('static', 'chunks', 'leaky.js')} carries SUPABASE_URL`,
      )
      expect(SERVER_ONLY_VALUES.map(([name]) => name)).toContain('RESEND_API_KEY')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('is active in a preloaded Node process and records a refused delivery', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'mg-guard-test-'))
    try {
      const log = path.join(dir, 'guard.log')
      const env = simulationEnv({ PATH: process.env.PATH }, { guardLog: log })
      const result = spawnSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          "await fetch('https://api.resend.com/emails', { method: 'POST' }).then(() => process.exit(3), (e) => { console.log(e.message); process.exit(0) })",
        ],
        { env: env as NodeJS.ProcessEnv, encoding: 'utf8' },
      )
      expect(result.status, result.stderr).toBe(0)
      expect(result.stdout).toMatch(/Refused a request to api\.resend\.com/)
      const events = readFileSync(log, 'utf8').trim().split('\n')
      expect(events[0]).toMatch(/^loaded \d+$/)
      expect(events).toContain('blocked api.resend.com')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
