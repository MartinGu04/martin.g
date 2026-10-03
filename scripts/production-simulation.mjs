/**
 * Production simulation: real `pnpm build`s with the Vercel production flags, run in CI
 * (the `production-simulation` job) so a production-only guard can never first fail on the
 * real Vercel Production deployment.
 *
 *   node scripts/production-simulation.mjs      (or: pnpm build:production-simulation)
 *
 * Every production-only branch that can run at build time runs here: the copy and social
 * artwork release gates, the contact delivery and lead storage gates, the required
 * canonical origin, the specimen's absence, robots and indexing, and the production-only
 * security headers. Cases:
 *
 *   1. without Contact delivery    the build must fail, naming the missing variables
 *   2. without lead storage        the build must fail, naming the Supabase variables
 *   3. without the admin's         the build must fail, naming SUPABASE_PUBLISHABLE_KEY
 *      configuration               and ADMIN_USER_ID
 *   4. without SITE_URL            the build must fail, asking for the origin
 *   5. a site card pending         the build must fail, naming the card awaiting approval
 *   6. project copy unreadable     the build must fail closed rather than publish the
 *                                  code's copy over the editor's (the read is refused)
 *   7. complete                    the build must succeed (leak check and built-HTML policy
 *                                  included); its browser output must carry none of the
 *                                  server configuration; the built server is then started
 *                                  and checked, the admin included (it must send a visitor
 *                                  to sign in, privately, without any request to Supabase),
 *                                  and each locale must show its own saved project copy
 *
 * Copy awaiting review: the copy gate runs after the configuration gates, so cases 1 to 5
 * are decided while copy is still draft. If the complete build is refused only for draft
 * copy, it is built again with the explicit, logged override so every other check still
 * runs, and the run then fails anyway, naming the copy: a real Production deployment would
 * be refused until Martin approves it.
 *
 * Values are CI-only dummies on the reserved `.example` domain, never real credentials:
 * any real SITE_URL, Resend, Supabase, Telegram, outbox, lead file, draft-copy override or
 * simulated pending artwork inherited from the environment is removed first. The build
 * never sends or stores anything (that happens only when a visitor submits the form, and
 * the smoke checks make GET requests only); to prove it, scripts/delivery-guard.mjs is
 * preloaded into every process and refuses and records any request to the Resend or
 * Telegram APIs or to Supabase, and the run fails if one was attempted. The one exception
 * is the build's read of the editor's project copy, which the guard answers itself with
 * SIMULATED_TRANSLATIONS (synthetic rows), so the simulation proves that saved copy reaches
 * the right locale, still without any network.
 *
 * The leak check is untouched: `pnpm build` runs it with VERCEL=1, so it fails closed
 * without LEAK_CHECK_TERMS_B64 (the real secret in CI). It leaves .next as a production
 * build: run `pnpm build` again before `pnpm test:e2e`.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
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
  SUPABASE_URL: 'https://leads.production-simulation.example',
  SUPABASE_SECRET_KEY: 'sb_secret_ci_simulation_not_a_real_key',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ci_simulation_not_a_real_key',
  ADMIN_USER_ID: '00000000-0000-4000-8000-00000000c1c1',
  NEXT_TELEMETRY_DISABLED: '1',
})

/**
 * Synthetic saved copy for the project editor's table: ON in both languages, each
 * distinct, so the smoke checks can prove each locale shows its own row only.
 */
export const SIMULATED_TRANSLATIONS = Object.freeze([
  {
    project_id: 'on',
    locale: 'en',
    title: 'Simulated English title',
    summary: 'Simulated English text, saved in the project editor.',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    project_id: 'on',
    locale: 'he',
    title: 'כותרת עברית מדומה',
    summary: 'טקסט עברי מדומה, שנשמר בעורך הפרויקטים.',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
])

/** Inherited configuration that must never reach the simulation. */
export const STRIPPED = Object.freeze([
  'SITE_URL',
  'RESEND_API_KEY',
  'CONTACT_EMAIL_TO',
  'CONTACT_EMAIL_FROM',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'ADMIN_USER_ID',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'CONTACT_OUTBOX_FILE',
  'CONTACT_LEADS_FILE',
  'CONTACT_MIN_FILL_MS',
  'ALLOW_DRAFT_COPY_IN_PRODUCTION',
  'RELEASE_GATE_SIMULATE_PENDING_SITE_CARDS',
  'MG_SIMULATED_TRANSLATIONS',
  'VERCEL_DEPLOY_HOOK_URL',
  'VERCEL_URL',
  'VERCEL_BRANCH_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
])

/**
 * Any other database configuration a runner or an integration might carry (for example
 * SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL or POSTGRES_URL) is removed too.
 */
export const STRIPPED_PATTERN = /SUPABASE|^POSTGRES_/

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
  for (const name of Object.keys(env)) if (STRIPPED_PATTERN.test(name)) delete env[name]
  Object.assign(env, SIMULATION)
  env.MG_SIMULATED_TRANSLATIONS = JSON.stringify(SIMULATED_TRANSLATIONS)
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
    name: 'refuses a production build without lead storage',
    overrides: { SUPABASE_URL: undefined, SUPABASE_SECRET_KEY: undefined },
    expectFailure: [
      /\[leads\] No lead storage configured for the contact form: SUPABASE_URL is missing; SUPABASE_SECRET_KEY is missing/,
    ],
  },
  {
    name: "refuses a production build without the admin's configuration",
    overrides: { SUPABASE_PUBLISHABLE_KEY: undefined, ADMIN_USER_ID: undefined },
    expectFailure: [
      /\[admin\] The admin is not configured: SUPABASE_PUBLISHABLE_KEY is missing; ADMIN_USER_ID is missing/,
    ],
  },
  {
    name: 'refuses a production build without SITE_URL',
    overrides: { SITE_URL: undefined },
    expectFailure: [/\[site\] A production build needs SITE_URL/],
  },
  {
    // The cards in the repository are approved; this marks the Hebrew one pending, as a
    // new render awaiting review would be (src/i18n/release-gate.ts).
    name: 'refuses a production build with a site card awaiting approval',
    overrides: { RELEASE_GATE_SIMULATE_PENDING_SITE_CARDS: 'he' },
    expectFailure: [/\[release-gate\] Social artwork awaiting approval: site-card:he\./],
  },
  {
    // Without the guard's synthetic rows the read is refused, as an unreachable database
    // or a missing table would refuse it. The refusal is expected here, so it is recorded
    // in the case's own guard log. The read happens while pages are generated, after the
    // copy gate, so this case alone sets the logged draft-copy override: the case must
    // reach the read whatever the copy's review state.
    name: 'refuses a production build when the saved project copy cannot be read',
    overrides: { MG_SIMULATED_TRANSLATIONS: undefined, ALLOW_DRAFT_COPY_IN_PRODUCTION: '1' },
    expectFailure: [/\[content\] Project translations could not be read \(\w+\)/],
    expectBlocked: true,
  },
  { name: 'builds with the complete dummy configuration', overrides: {} },
])

/** The copy gate's refusal; the list names what awaits review. */
export const DRAFT_COPY =
  /\[release-gate\] Draft copy awaiting review: ([^\n]+?)\. Approve the copy/

/** Server-only configuration that must never appear in what a browser receives. */
export const SERVER_ONLY_VALUES = Object.freeze([
  ['RESEND_API_KEY', SIMULATION.RESEND_API_KEY],
  ['SUPABASE_URL', SIMULATION.SUPABASE_URL],
  ['SUPABASE_SECRET_KEY', SIMULATION.SUPABASE_SECRET_KEY],
  ['SUPABASE_PUBLISHABLE_KEY', SIMULATION.SUPABASE_PUBLISHABLE_KEY],
  ['ADMIN_USER_ID', SIMULATION.ADMIN_USER_ID],
  ['the Supabase host', new URL(SIMULATION.SUPABASE_URL).hostname],
])

function walkFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walkFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  )
}

/**
 * The simulation's dummy server values found in browser output: the static assets every
 * visitor downloads and the prerendered pages and payloads. Returns a list of problems.
 */
export function browserOutputLeaks(buildDir) {
  const files = [
    ...walkFiles(path.join(buildDir, 'static')),
    ...walkFiles(path.join(buildDir, 'server', 'app')).filter((f) =>
      /\.(html|rsc|body|meta|json)$/.test(f),
    ),
  ]
  const problems = []
  for (const file of files) {
    const text = readFileSync(file, 'latin1')
    for (const [name, value] of SERVER_ONLY_VALUES) {
      if (text.includes(value)) problems.push(`${path.relative(buildDir, file)} carries ${name}`)
    }
  }
  if (files.length === 0) problems.push('no browser output found to check')
  return problems
}

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
    for (const [name, value] of SERVER_ONLY_VALUES)
      expect(!html.includes(value), `${p}: the page carries ${name}`)
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

  // The editor's saved copy, each locale its own, never the other's.
  const [en, he] = SIMULATED_TRANSLATIONS
  for (const [p, own, other] of [
    ['/en', en, he],
    ['/en/work/on', en, he],
    ['/he', he, en],
    ['/he/work/on', he, en],
  ]) {
    const html = await (await get(p)).text()
    expect(html.includes(own.title), `${p}: does not show its saved title`)
    expect(!html.includes(other.title), `${p}: shows the other locale's saved title`)
  }
  const homeEn = await (await get('/en')).text()
  expect(homeEn.includes(en.summary), '/en: does not show its saved summary')

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

  expect(!sitemap.includes('/admin'), 'the sitemap lists the admin')

  // The admin: a visitor without a session is sent to sign in before anything renders,
  // and every admin response is private. No request reaches Supabase (the guard).
  for (const p of ['/admin', '/admin/leads/00000000-0000-4000-8000-000000000001']) {
    const response = await get(p)
    expect(response.status === 307, `${p} answers ${response.status}, not 307`)
    expect(response.headers.get('location') === '/admin/login', `${p} does not go to sign in`)
    expect(response.headers.get('x-robots-tag') === 'noindex, nofollow', `${p}: not noindex`)
    expect(/private/.test(response.headers.get('cache-control') ?? ''), `${p}: cacheable`)
  }
  const login = await get('/admin/login')
  expect(login.status === 200, `/admin/login answers ${login.status}`)
  expect(login.headers.get('x-robots-tag') === 'noindex, nofollow', '/admin/login: not noindex')
  expect(/no-store/.test(login.headers.get('cache-control') ?? ''), '/admin/login: cacheable')
  const loginHtml = await login.text()
  expect(
    /<meta name="robots" content="noindex, nofollow/.test(loginHtml),
    '/admin/login: no robots meta',
  )
  expect(!loginHtml.includes('not configured'), '/admin/login: the admin is not configured')

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
  let awaitingReview = null
  try {
    for (const testCase of CASES) {
      const caseLog = testCase.expectBlocked ? path.join(work, 'expected-refusals.log') : guardLog
      const env = simulationEnv(process.env, { overrides: testCase.overrides, guardLog: caseLog })
      console.log(`\nproduction-simulation: ${testCase.name}`)
      let { status, output } = runBuild(env)
      if (testCase.expectFailure) {
        const reasons = testCase.expectFailure.filter((re) => !re.test(output))
        if (testCase.expectBlocked && !guardEvents(caseLog).some((e) => e.startsWith('blocked')))
          failures.push(`${testCase.name}: the guard refused nothing`)
        if (status === 0) failures.push(`${testCase.name}: the build succeeded`)
        else if (reasons.length > 0)
          failures.push(`${testCase.name}: failed for another reason:\n${tail(output)}`)
        else console.log('  refused, as required')
        continue
      }
      let serveEnv = env
      const draft = status !== 0 ? output.match(DRAFT_COPY) : null
      if (draft) {
        awaitingReview = draft[1]
        console.log(
          `  refused: draft copy awaiting review (${awaitingReview}). Building again with the override, so every other check still runs.`,
        )
        serveEnv = simulationEnv(process.env, {
          overrides: { ...testCase.overrides, ALLOW_DRAFT_COPY_IN_PRODUCTION: '1' },
          guardLog,
        })
        ;({ status, output } = runBuild(serveEnv))
      }
      if (status !== 0) {
        failures.push(`${testCase.name}: the build failed:\n${tail(output, 80)}`)
        continue
      }
      console.log(tail(output, 6))
      const leaks = browserOutputLeaks(path.join(root, '.next'))
      if (leaks.length > 0) failures.push(`${testCase.name}:\n  ${leaks.join('\n  ')}`)
      else console.log('  browser output carries no server configuration')
      const server = await startServer(serveEnv, Number(process.env.SIMULATION_PORT ?? 3400))
      try {
        const problems = await smokeChecks(server.base)
        if (problems.length > 0) failures.push(`${testCase.name}:\n  ${problems.join('\n  ')}`)
        else
          console.log(
            '  built, served and checked: origin, social cards, robots, sitemap, headers, specimen, admin',
          )
      } finally {
        server.stop()
      }
    }

    const events = guardEvents(guardLog)
    const blocked = events.filter((e) => e.startsWith('blocked'))
    if (!events.some((e) => e.startsWith('loaded')))
      failures.push('the delivery guard never loaded, so delivery was not proven absent')
    if (!events.some((e) => e.startsWith('served')))
      failures.push('the complete build never read the saved project copy')
    if (blocked.length > 0)
      failures.push(`a delivery or database request was attempted: ${blocked.join(', ')}`)
    else {
      const processes = events.filter((e) => e.startsWith('loaded')).length
      console.log(
        `\n  delivery guard: active in ${processes} processes, no delivery or database request attempted (the project copy read answered with synthetic rows)`,
      )
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }

  if (awaitingReview && failures.length === 0) {
    console.error(
      `\nproduction-simulation: every check passed, but Vercel Production would refuse this build: draft copy awaiting review (${awaitingReview}). Approve the copy before merging.`,
    )
    process.exit(1)
  }
  if (awaitingReview)
    failures.push(`Vercel Production would also refuse draft copy: ${awaitingReview}`)
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
