/**
 * Production simulation: real `pnpm build`s with the Vercel production flags, run in CI
 * (the `production-simulation` job) so a production-only guard can never first fail on the
 * real Vercel Production deployment.
 *
 *   node scripts/production-simulation.mjs      (or: pnpm build:production-simulation)
 *
 * Every production-only branch that can run at build time runs here: the copy release gate,
 * the contact delivery gate, the required canonical origin, the specimen's absence, robots
 * and indexing, and the production-only security headers. Cases:
 *
 *   1. without Contact delivery    the build must fail, naming the missing variables
 *   2. without SITE_URL            the build must fail, asking for the origin
 *   3. complete                    the build must succeed (leak check and built-HTML policy
 *                                  included); the built server is then started and checked
 *
 * Values are CI-only dummies on the reserved `.example` domain, never real credentials:
 * any real SITE_URL, Resend, Telegram, outbox or draft-copy override inherited from the
 * environment is removed first. The build never sends anything (delivery happens only when
 * a visitor submits the form, and the smoke checks make GET requests only); to prove it,
 * scripts/delivery-guard.mjs is preloaded into every process and refuses and records any
 * request to the Resend or Telegram APIs, and the run fails if one was attempted.
 *
 * The leak check is untouched: `pnpm build` runs it with VERCEL=1, so it fails closed
 * without LEAK_CHECK_TERMS_B64 (the real secret in CI). It leaves .next as a production
 * build: run `pnpm build` again before `pnpm test:e2e`.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The simulated Vercel Production environment. Dummy values only. */
export const SIMULATION = Object.freeze({
  VERCEL: '1',
  VERCEL_ENV: 'production',
  SITE_URL: 'https://production-simulation.example',
  RESEND_API_KEY: 're_ci_simulation_not_a_real_key',
  CONTACT_EMAIL_TO: 'inquiries@production-simulation.example',
  CONTACT_EMAIL_FROM: 'MARTIN.G <sender@production-simulation.example>',
  NEXT_TELEMETRY_DISABLED: '1',
})

/** Inherited configuration that must never reach the simulation. */
export const STRIPPED = Object.freeze([
  'SITE_URL',
  'RESEND_API_KEY',
  'CONTACT_EMAIL_TO',
  'CONTACT_EMAIL_FROM',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'CONTACT_OUTBOX_FILE',
  'CONTACT_MIN_FILL_MS',
  'ALLOW_DRAFT_COPY_IN_PRODUCTION',
  'VERCEL_URL',
  'VERCEL_BRANCH_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
])

/**
 * The environment of one case: the inherited one without STRIPPED, plus SIMULATION, plus
 * `overrides` (a value of `undefined` removes the variable), with the delivery guard
 * preloaded and logging to `guardLog`.
 *
 * @param {Record<string, string | undefined>} base
 * @param {{ overrides?: Record<string, string | undefined>, guardLog?: string }} [options]
 * @returns {Record<string, string | undefined>}
 */
export function simulationEnv(base, { overrides = {}, guardLog } = {}) {
  const env = { ...base }
  for (const name of STRIPPED) delete env[name]
  Object.assign(env, SIMULATION)
  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) delete env[name]
    else env[name] = value
  }
  const guard = pathToFileURL(path.join(root, 'scripts', 'delivery-guard.mjs')).href
  env.NODE_OPTIONS = [base.NODE_OPTIONS, `--import=${guard}`].filter(Boolean).join(' ')
  if (guardLog) env.MG_DELIVERY_GUARD_LOG = guardLog
  return env
}

export const CASES = Object.freeze([
  {
    name: 'refuses a production build without Contact delivery',
    overrides: {
      RESEND_API_KEY: undefined,
      CONTACT_EMAIL_TO: undefined,
      CONTACT_EMAIL_FROM: undefined,
    },
    expectFailure: [
      /\[contact\] No delivery configured for the contact form\. Missing: RESEND_API_KEY, CONTACT_EMAIL_TO, CONTACT_EMAIL_FROM/,
    ],
  },
  {
    name: 'refuses a production build without SITE_URL',
    overrides: { SITE_URL: undefined },
    expectFailure: [/\[site\] A production build needs SITE_URL/],
  },
  { name: 'builds with the complete dummy configuration', overrides: {} },
])

/** Checks of the running production build. Returns a list of problems. */
export async function smokeChecks(base, origin = SIMULATION.SITE_URL) {
  const problems = []
  const expect = (ok, message) => ok || problems.push(message)
  const get = (p) => fetch(new URL(p, base), { redirect: 'manual' })

  const entry = await get('/')
  expect(entry.status === 307, `/ answers ${entry.status}, not 307`)
  expect(entry.headers.get('location')?.endsWith('/he'), '/ does not redirect to /he')

  for (const p of [
    '/he',
    '/en',
    '/en/work/on',
    '/he/contact',
    '/en/privacy',
    '/he/accessibility',
  ]) {
    const response = await get(p)
    expect(response.status === 200, `${p} answers ${response.status}`)
    const headers = response.headers
    expect(
      headers.get('strict-transport-security') === 'max-age=63072000; includeSubDomains',
      `${p}: no production HSTS`,
    )
    expect(headers.get('x-robots-tag') === null, `${p}: production is marked noindex`)
    expect(
      headers.get('content-security-policy')?.includes('upgrade-insecure-requests'),
      `${p}: the CSP does not upgrade insecure requests`,
    )
    const html = await response.text()
    expect(
      html.includes(`<link rel="canonical" href="${origin}${p}"/>`),
      `${p}: canonical is not on ${origin}`,
    )
    expect(
      html.includes(`<meta property="og:url" content="${origin}${p}"/>`),
      `${p}: og:url is not on ${origin}`,
    )
    expect(!html.includes('localhost'), `${p}: mentions localhost`)
    expect(!/<meta name="robots"/.test(html), `${p}: has a robots meta`)
  }
  const home = await (await get('/he')).text()
  expect(home.includes(`"@id":"${origin}/#website"`), 'structured data is not on the origin')
  const caseStudy = await (await get('/en/work/on')).text()
  expect(
    caseStudy.includes(`<meta property="og:image" content="${origin}/_next/static/media/`),
    'the case study image is not on the origin',
  )
  for (const locale of ['he', 'en']) {
    const html = await (await get(`/${locale}`)).text()
    const card = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? ''
    expect(
      card.startsWith(`${origin}/_next/static/media/martin-g-${locale}.`),
      `/${locale}: the social card is not the ${locale} card on the origin`,
    )
  }

  const robots = await (await get('/robots.txt')).text()
  expect(/User-Agent: \*\s+Allow: \//.test(robots), 'robots.txt does not allow crawling')
  expect(
    robots.includes(`Sitemap: ${origin}/sitemap.xml`),
    'robots.txt names no sitemap on the origin',
  )

  const sitemap = await (await get('/sitemap.xml')).text()
  const urls = [...sitemap.matchAll(/(?:<loc>|href=")([^<"]+)/g)].map((m) => m[1])
  expect(urls.length > 0, 'the sitemap is empty')
  expect(
    urls.every((url) => url.startsWith(`${origin}/`)),
    `the sitemap has URLs outside ${origin}`,
  )
  expect(!sitemap.includes('/system'), 'the sitemap lists the specimen')

  for (const p of ['/he/system', '/en/system/scenes']) {
    const response = await get(p)
    expect(response.status === 404, `${p} answers ${response.status}, not 404 in production`)
  }
  return problems
}

function guardEvents(file) {
  return existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []
}

function runBuild(env) {
  const result = spawnSync('pnpm', ['build'], {
    cwd: root,
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20 * 60 * 1000,
  })
  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

const tail = (text, lines = 40) => text.trimEnd().split('\n').slice(-lines).join('\n')

async function startServer(env, port) {
  const server = spawn('pnpm', ['exec', 'next', 'start', '-p', String(port)], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let output = ''
  server.stdout.on('data', (d) => (output += d))
  server.stderr.on('data', (d) => (output += d))
  const base = `http://localhost:${port}`
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(`next start exited:\n${tail(output)}`)
    try {
      await fetch(`${base}/robots.txt`)
      return { base, stop: () => process.kill(-server.pid, 'SIGTERM') }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  process.kill(-server.pid, 'SIGTERM')
  throw new Error(`next start did not answer:\n${tail(output)}`)
}

async function main() {
  const work = mkdtempSync(path.join(tmpdir(), 'mg-production-simulation-'))
  const guardLog = path.join(work, 'delivery-guard.log')
  const failures = []
  try {
    for (const testCase of CASES) {
      const env = simulationEnv(process.env, { overrides: testCase.overrides, guardLog })
      console.log(`\nproduction-simulation: ${testCase.name}`)
      const { status, output } = runBuild(env)
      if (testCase.expectFailure) {
        const reasons = testCase.expectFailure.filter((re) => !re.test(output))
        if (status === 0) failures.push(`${testCase.name}: the build succeeded`)
        else if (reasons.length > 0)
          failures.push(`${testCase.name}: failed for another reason:\n${tail(output)}`)
        else console.log('  refused, as required')
      } else if (status !== 0) {
        failures.push(`${testCase.name}: the build failed:\n${tail(output, 80)}`)
      } else {
        console.log(tail(output, 6))
        const server = await startServer(env, Number(process.env.SIMULATION_PORT ?? 3400))
        try {
          const problems = await smokeChecks(server.base)
          if (problems.length > 0) failures.push(`${testCase.name}:\n  ${problems.join('\n  ')}`)
          else
            console.log(
              '  built, served and checked: origin, social cards, robots, sitemap, headers, specimen',
            )
        } finally {
          server.stop()
        }
      }
    }

    const events = guardEvents(guardLog)
    const blocked = events.filter((e) => e.startsWith('blocked'))
    if (!events.some((e) => e.startsWith('loaded')))
      failures.push('the delivery guard never loaded, so delivery was not proven absent')
    if (blocked.length > 0) failures.push(`delivery was attempted: ${blocked.join(', ')}`)
    else {
      const processes = events.filter((e) => e.startsWith('loaded')).length
      console.log(`\n  delivery guard: active in ${processes} processes, no delivery attempted`)
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }

  if (failures.length > 0) {
    console.error(
      `\nproduction-simulation: ${failures.length} failure(s)\n\n${failures.join('\n\n')}`,
    )
    process.exit(1)
  }
  console.log('\nproduction-simulation: all cases passed')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main()
}
