import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertContactDelivery, configuredNotifiers } from '@/lib/contact/notifiers'
import { assertReleasableArtwork, findPendingArtwork } from '@/i18n/release-gate'
import { isSpecimenEnabled } from '@/lib/specimen'
import { isIndexable, siteUrl } from '@/lib/site'
import { DELIVERY_HOSTS, guardedFetch } from '../../scripts/delivery-guard.mjs'
import { CASES, SIMULATION, STRIPPED, simulationEnv } from '../../scripts/production-simulation.mjs'

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
  })

  it('never carries inherited credentials, the outbox or the draft-copy override', () => {
    for (const value of Object.values(env)) {
      expect(value).not.toMatch(/synthetic-real|synthetic-token|synthetic-outbox/)
    }
    for (const name of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'CONTACT_OUTBOX_FILE']) {
      expect(env[name], name).toBeUndefined()
    }
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
