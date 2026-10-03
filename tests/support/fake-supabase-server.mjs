/**
 * A stand-in for a Supabase project, for the admin's unit and end-to-end tests: Auth (email
 * and password sign-in, the user, refresh, sign-out) and the small part of the Data API
 * (PostgREST) the site uses on `leads`, `lead_notes` and `project_translations`. The real
 * @supabase/ssr and
 * supabase-js code runs against it; no test ever reaches a real Supabase project.
 *
 * It enforces what matters to the site's security model: the Data API answers only the
 * secret key (the publishable key, like a browser role, has no table privileges), a session
 * is valid only while it exists (sign-out ends it), notes need an existing lead and a
 * non-blank body of at most 4000 characters, deleting a lead deletes its notes, and project
 * copy is one row per (project, locale) with the table's checks. It also stands in for a
 * Vercel Deploy Hook (POST /__deploy-hook), counting the builds it was asked to start.
 *
 *   node tests/support/fake-supabase-server.mjs     (the e2e suite starts it; see
 *                                                    playwright.config.ts)
 *
 * Leads are written to E2E_LEADS (a JSON array of table rows) after every change, so the
 * Contact e2e tests can read back what a submission stored.
 */
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ADMIN, FAKE_PORT, OTHER, PUBLISHABLE_KEY, SECRET_KEY } from './admin-fixtures.mjs'

const NOTE_MAX = 4000

/** The checks of supabase/migrations/..._project_translations.sql. */
function translationProblem(row) {
  const text = (value, max) =>
    typeof value === 'string' && value.trim().length >= 1 && value.length <= max
  if (typeof row.project_id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.project_id))
    return 'project_translations_project_id_check'
  if (!['he', 'en'].includes(row.locale)) return 'project_translations_locale_check'
  if (!text(row.title, 120)) return 'project_translations_title_check'
  if (!text(row.summary, 500)) return 'project_translations_summary_check'
  return null
}

const json = (value, status = 200, headers = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

/** Synthetic leads, newest first after sorting: 30, enough for two pages. */
export function seedLeads(now = Date.now()) {
  const statuses = ['new', 'contacted', 'talking', 'proposal_sent', 'won', 'lost']
  const kinds = ['website', 'landing', 'app', 'existing', 'other', null]
  const people = [
    ['Noa Example', 'Studio Example'],
    ['Dana Example', null],
    ['Eli Example', 'Bakery Example'],
    ['דנה לדוגמה', 'סטודיו לדוגמה'],
    ['Maya Example', 'Clinic Example'],
  ]
  return Array.from({ length: 30 }, (_, i) => {
    const [name, business] = people[i % people.length]
    const created = new Date(now - (i + 1) * 3_600_000).toISOString()
    return {
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      created_at: created,
      updated_at: created,
      locale: i % 3 === 0 ? 'he' : 'en',
      name: `${name} ${i + 1}`,
      email: `seed-${i + 1}@leads.example`,
      phone: i % 2 === 0 ? `050-12345${String(i).padStart(2, '0')}` : null,
      kind: kinds[i % kinds.length],
      description: `A synthetic inquiry, number ${i + 1}, for the admin's tests.`,
      business: business ? `${business} ${i + 1}` : null,
      link: i % 4 === 0 ? `https://site-${i + 1}.example/` : null,
      timeline: i % 2 === 0 ? 'quarter' : null,
      status: statuses[i % statuses.length],
      dedupe_key: `id:seed-lead-${String(i + 1).padStart(12, '0')}`,
      notification_status: i % 7 === 3 ? 'failed' : i % 11 === 5 ? 'pending' : 'sent',
      notification_sent_at: i % 7 === 3 || i % 11 === 5 ? null : created,
    }
  })
}

/**
 * The fake project. `handle(request)` answers a Fetch API Request, so unit tests can use
 * it as `fetch` directly; `listen(port)` serves it over HTTP for the e2e suite.
 *
 * @typedef {{ id: string, email: string, password: string }} FakeUser
 * @typedef {Record<string, any> & { id: string }} Row
 * @param {{ leads?: Row[], leadsFile?: string | null, users?: FakeUser[] }} [options]
 */
export function createFakeSupabase({
  leads = seedLeads(),
  leadsFile = null,
  users = [ADMIN, OTHER],
  translations = [],
} = {}) {
  /**
   * @type {{
   *   leads: Row[],
   *   notes: Row[],
   *   translations: Record<string, any>[],
   *   deploys: number,
   *   sessions: Map<string, { userId: string, refreshToken: string, expiresAt: number }>,
   *   requests: { method: string, path: string, apikey: string | null }[],
   * }}
   */
  const state = {
    leads: [...leads],
    notes: [],
    translations: translations.map((row) => ({ ...row })),
    deploys: 0,
    /** access token -> { userId, refreshToken, expiresAt } */
    sessions: new Map(),
    requests: [],
  }

  const persist = () => {
    if (leadsFile) writeFileSync(leadsFile, `${JSON.stringify(state.leads, null, 2)}\n`)
  }
  persist()

  const userObject = (user) => ({
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00.000Z',
  })

  const issueSession = (user) => {
    const now = Math.floor(Date.now() / 1000)
    const sessionId = randomUUID()
    const accessToken = [
      base64url({ alg: 'HS256', typ: 'JWT' }),
      base64url({
        sub: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: user.email,
        session_id: sessionId,
        iat: now,
        exp: now + 3600,
      }),
      'synthetic-signature',
    ].join('.')
    const refreshToken = randomUUID()
    state.sessions.set(accessToken, { userId: user.id, refreshToken, expiresAt: now + 3600 })
    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: now + 3600,
      refresh_token: refreshToken,
      user: userObject(user),
    }
  }

  const authError = (status, code, msg) => json({ code: status, error_code: code, msg }, status)

  const bearer = (request) => request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''

  async function auth(request, url) {
    const route = url.pathname.slice('/auth/v1'.length)
    if (route === '/token' && request.method === 'POST') {
      const body = await request.json()
      const grant = url.searchParams.get('grant_type')
      if (grant === 'password') {
        const user = users.find((u) => u.email === body.email && u.password === body.password)
        return user
          ? json(issueSession(user))
          : authError(400, 'invalid_credentials', 'Invalid login credentials')
      }
      if (grant === 'refresh_token') {
        const entry = [...state.sessions].find(([, s]) => s.refreshToken === body.refresh_token)
        if (!entry) return authError(400, 'refresh_token_not_found', 'Invalid Refresh Token')
        state.sessions.delete(entry[0])
        return json(issueSession(users.find((u) => u.id === entry[1].userId)))
      }
      return authError(400, 'validation_failed', 'Unsupported grant type')
    }
    if (route === '/user' && request.method === 'GET') {
      const session = state.sessions.get(bearer(request))
      if (!session) return authError(403, 'session_not_found', 'Session not found')
      if (session.expiresAt <= Math.floor(Date.now() / 1000))
        return authError(403, 'bad_jwt', 'JWT expired')
      return json(userObject(users.find((u) => u.id === session.userId)))
    }
    if (route === '/logout' && request.method === 'POST') {
      state.sessions.delete(bearer(request))
      return new Response(null, { status: 204 })
    }
    return authError(404, 'not_found', 'Not found')
  }

  const pgError = (status, code, message) =>
    json({ code, message, details: null, hint: null }, status)

  /** `col=eq.value` filters from the query string. */
  const eqFilters = (url) =>
    [...url.searchParams]
      .filter(
        ([key, value]) =>
          !['select', 'order', 'limit', 'on_conflict', 'columns'].includes(key) &&
          value.startsWith('eq.'),
      )
      .map(([key, value]) => [key, value.slice(3)])

  const project = (rows, url) => {
    const select = url.searchParams.get('select')
    if (!select || select === '*') return rows
    const columns = select.split(',').map((c) => c.trim())
    return rows.map((row) => Object.fromEntries(columns.map((c) => [c, row[c]])))
  }

  const wantsRepresentation = (request) =>
    (request.headers.get('prefer') ?? '').includes('return=representation')

  async function rest(request, url) {
    // Only the secret key reaches the tables: the publishable key acts as a browser role,
    // which has no privileges at all.
    const key = request.headers.get('apikey')
    if (key !== SECRET_KEY) return pgError(401, '42501', 'permission denied')
    const table = url.pathname.slice('/rest/v1/'.length)
    if (table === 'project_translations') return translationsTable(request, url)
    if (table !== 'leads' && table !== 'lead_notes') return pgError(404, '42P01', 'not found')
    const rows = table === 'leads' ? state.leads : state.notes
    const filters = eqFilters(url)
    const matches = (row) => filters.every(([key, value]) => String(row[key]) === value)

    if (request.method === 'GET') {
      let result = rows.filter(matches)
      const order = url.searchParams.get('order')
      if (order) {
        const [column, direction] = order.split('.')
        result = [...result].sort((a, b) =>
          direction === 'desc'
            ? String(b[column]).localeCompare(String(a[column]))
            : String(a[column]).localeCompare(String(b[column])),
        )
      }
      const limit = Number(url.searchParams.get('limit'))
      if (limit > 0) result = result.slice(0, limit)
      return json(project(result, url))
    }

    if (request.method === 'POST') {
      const body = await request.json()
      const now = new Date().toISOString()
      if (table === 'leads') {
        if (state.leads.some((l) => l.dedupe_key === body.dedupe_key)) return json([], 201)
        const row = {
          id: randomUUID(),
          created_at: now,
          updated_at: now,
          status: 'new',
          notification_status: 'pending',
          notification_sent_at: null,
          ...body,
        }
        state.leads.push(row)
        persist()
        return wantsRepresentation(request)
          ? json(project([row], url), 201)
          : new Response(null, { status: 201 })
      }
      if (!state.leads.some((l) => l.id === body.lead_id))
        return pgError(
          409,
          '23503',
          'insert or update on table "lead_notes" violates foreign key constraint',
        )
      if (typeof body.body !== 'string' || !body.body.trim() || body.body.length > NOTE_MAX)
        return pgError(400, '23514', 'new row violates check constraint "lead_notes_body_check"')
      const note = {
        id: randomUUID(),
        lead_id: body.lead_id,
        body: body.body,
        created_at: now,
        updated_at: now,
      }
      state.notes.push(note)
      return wantsRepresentation(request)
        ? json(project([note], url), 201)
        : new Response(null, { status: 201 })
    }

    if (request.method === 'PATCH') {
      const body = await request.json()
      const updated = rows.filter(matches)
      for (const row of updated) Object.assign(row, body)
      if (table === 'leads') persist()
      return wantsRepresentation(request)
        ? json(project(updated, url))
        : new Response(null, { status: 204 })
    }

    if (request.method === 'DELETE') {
      const removed = rows.filter(matches)
      if (table === 'leads') {
        state.leads = state.leads.filter((row) => !matches(row))
        // on delete cascade
        state.notes = state.notes.filter((n) => !removed.some((l) => l.id === n.lead_id))
        persist()
      } else state.notes = state.notes.filter((row) => !matches(row))
      return new Response(null, { status: 204 })
    }
    return pgError(405, 'PGRST000', 'method not allowed')
  }

  /** `project_translations`: read, and the upsert on (project_id, locale) the editor uses. */
  async function translationsTable(request, url) {
    const filters = eqFilters(url)
    const matches = (row) => filters.every(([key, value]) => String(row[key]) === value)
    if (request.method === 'GET') return json(project(state.translations.filter(matches), url))
    if (request.method === 'POST') {
      const prefer = request.headers.get('prefer') ?? ''
      const conflict = url.searchParams.get('on_conflict')
      const body = await request.json()
      const now = new Date().toISOString()
      const written = []
      for (const input of Array.isArray(body) ? body : [body]) {
        const problem = translationProblem(input)
        if (problem) return pgError(400, '23514', `new row violates check constraint "${problem}"`)
        const existing = state.translations.find(
          (row) => row.project_id === input.project_id && row.locale === input.locale,
        )
        if (existing) {
          if (!prefer.includes('resolution=merge-duplicates') || conflict !== 'project_id,locale')
            return pgError(409, '23505', 'duplicate key value violates unique constraint')
          Object.assign(existing, input)
          written.push(existing)
        } else {
          const row = { created_at: now, updated_at: now, ...input }
          state.translations.push(row)
          written.push(row)
        }
      }
      return wantsRepresentation(request)
        ? json(project(written, url), 201)
        : new Response(null, { status: 201 })
    }
    return pgError(405, 'PGRST000', 'method not allowed')
  }

  /** Test-only: seed a lead (for one test's own data) or read the notes. Never in the app. */
  async function fixtures(request, url) {
    if (url.pathname === '/__fixtures/leads' && request.method === 'POST') {
      const body = await request.json()
      const now = new Date().toISOString()
      const row = {
        id: randomUUID(),
        created_at: now,
        updated_at: now,
        locale: 'en',
        phone: null,
        kind: null,
        business: null,
        link: null,
        timeline: null,
        status: 'new',
        dedupe_key: `id:fixture-${randomUUID()}`,
        notification_status: 'sent',
        notification_sent_at: now,
        ...body,
      }
      state.leads.push(row)
      persist()
      return json(row, 201)
    }
    if (url.pathname === '/__fixtures/notes' && request.method === 'GET') {
      const leadId = url.searchParams.get('lead_id')
      return json(state.notes.filter((n) => n.lead_id === leadId))
    }
    if (url.pathname === '/__fixtures/session' && request.method === 'POST') {
      const body = await request.json()
      const user = users.find((u) => u.email === body.email && u.password === body.password)
      return user ? json(issueSession(user)) : json({}, 400)
    }
    if (url.pathname === '/__fixtures/translations' && request.method === 'GET')
      return json(state.translations)
    if (url.pathname === '/__deploy-hook' && request.method === 'POST') {
      state.deploys += 1
      return json({ job: { id: `synthetic-${state.deploys}`, state: 'PENDING' } }, 201)
    }
    if (url.pathname === '/__fixtures/deploys' && request.method === 'GET')
      return json({ deploys: state.deploys })
    if (url.pathname === '/__health') return json({ ok: true })
    return json({}, 404)
  }

  async function handle(input, init) {
    const request = input instanceof Request ? input : new Request(input, init)
    const url = new URL(request.url)
    state.requests.push({
      method: request.method,
      path: url.pathname,
      apikey: request.headers.get('apikey'),
    })
    if (url.pathname.startsWith('/auth/v1/')) {
      if (![PUBLISHABLE_KEY, SECRET_KEY].includes(request.headers.get('apikey') ?? ''))
        return authError(401, 'no_api_key', 'Invalid API key')
      return auth(request, url)
    }
    if (url.pathname.startsWith('/rest/v1/')) return rest(request, url)
    if (url.pathname.startsWith('/__')) return fixtures(request, url)
    return json({}, 404)
  }

  function listen(port = FAKE_PORT) {
    const server = createServer(async (req, res) => {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = chunks.length ? Buffer.concat(chunks) : undefined
      const request = new Request(`http://127.0.0.1:${port}${req.url}`, {
        method: req.method,
        headers: Object.entries(req.headers).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((x) => [k, x]) : v === undefined ? [] : [[k, v]],
        ),
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
      })
      try {
        const response = await handle(request)
        res.writeHead(response.status, Object.fromEntries(response.headers))
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end('{"message":"fake server error"}')
      }
    })
    return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
  }

  return { state, handle, listen }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  // Every run starts from the same synthetic seed, written to E2E_LEADS.
  await createFakeSupabase({ leadsFile: process.env.E2E_LEADS || null }).listen(FAKE_PORT)
  console.log(`fake supabase on http://127.0.0.1:${FAKE_PORT}`)
}
