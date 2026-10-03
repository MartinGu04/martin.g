import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  ADMIN,
  ADMIN_E2E_ENV,
  FAKE_URL,
  OTHER,
  PUBLISHABLE_KEY,
  SECRET_KEY,
} from '../support/admin-fixtures.mjs'
import { createFakeSupabase } from '../support/fake-supabase-server.mjs'

/*
 * The admin's auth boundary, Server Actions, CRM data layer, view logic and proxy, with the
 * real Supabase clients against tests/support/fake-supabase-server.mjs at the fetch
 * boundary. next/headers, next/navigation and next/cache are replaced by small stand-ins.
 */

// -- Next stand-ins ---------------------------------------------------------------------

class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirect ${to}`)
  }
}
class NotFound extends Error {}

const jar = new Map<string, string>()
const cookieStore = {
  getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
  set: (name: string, value: string, options?: { maxAge?: number }) => {
    if (!value || options?.maxAge === 0) jar.delete(name)
    else jar.set(name, value)
  },
}
const revalidated: string[] = []

vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirected(to)
  },
  notFound: () => {
    throw new NotFound()
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidated.push(p) }))

const { adminProblems, assertAdminConfiguration, adminAuthConfig, isUuid } =
  await import('@/lib/admin/config')
const { requireAdmin, isSignedInAdmin } = await import('@/lib/admin/auth')
const { signIn, signOut, updateLeadStatus, addLeadNote } = await import('@/lib/admin/actions')
const { checkAdmin, createAuthClient } = await import('@/lib/admin/session')
const { configuredCrmRepository, CrmError, LEAD_LIST_COLUMNS } = await import('@/lib/admin/crm')
const view = await import('@/lib/admin/leads-view')
const { adminProxy, isAdminPath } = await import('@/lib/admin/proxy')
const { proxy } = await import('@/proxy')
const { initialActionState, initialSignInState, SIGN_IN_ERROR } = await import('@/lib/admin/state')
const { themeIssues } = await import('@/lib/theme')
const { adminTheme } = await import('@/components/admin/theme')

// -- Helpers ----------------------------------------------------------------------------

let fake: ReturnType<typeof createFakeSupabase>
let errors: () => string

function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

async function caught<T>(promise: Promise<T>): Promise<T | Redirected | NotFound> {
  try {
    return await promise
  } catch (error) {
    if (error instanceof Redirected || error instanceof NotFound) return error
    throw error
  }
}

async function signInAs(user: { email: string; password: string }) {
  return caught(signIn(initialSignInState, form({ email: user.email, password: user.password })))
}

const restRequests = () => fake.state.requests.filter((r) => r.path.startsWith('/rest/'))
const firstLead = () => fake.state.leads[0]!

beforeEach(() => {
  jar.clear()
  revalidated.length = 0
  fake = createFakeSupabase()
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => fake.handle(input, init))
  for (const [key, value] of Object.entries(ADMIN_E2E_ENV)) vi.stubEnv(key, value)
  vi.stubEnv('VERCEL', '')
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  errors = () => error.mock.calls.flat().map(String).join('\n')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// -- Configuration ----------------------------------------------------------------------

describe('admin configuration', () => {
  it('needs the URL, both keys and the admin user id, each valid', () => {
    expect(adminProblems(ADMIN_E2E_ENV)).toEqual([])
    expect(adminAuthConfig(ADMIN_E2E_ENV)).toMatchObject({
      url: FAKE_URL,
      publishableKey: PUBLISHABLE_KEY,
      adminUserId: ADMIN.id,
      secureCookies: false,
    })
    expect(adminAuthConfig({ ...ADMIN_E2E_ENV, VERCEL: '1' })?.secureCookies).toBe(true)
    expect(adminProblems({})).toEqual([
      'SUPABASE_URL is missing',
      'SUPABASE_SECRET_KEY is missing',
      'SUPABASE_PUBLISHABLE_KEY is missing',
      'ADMIN_USER_ID is missing',
    ])
    const wrong = adminProblems({
      ...ADMIN_E2E_ENV,
      SUPABASE_PUBLISHABLE_KEY: 'sb_secret_synthetic_value_in_the_wrong_place',
      ADMIN_USER_ID: 'owner@studio.example',
    }).join(' ')
    expect(wrong).toMatch(/SUPABASE_PUBLISHABLE_KEY is not a publishable API key/)
    expect(wrong).toMatch(/ADMIN_USER_ID is not a Supabase Auth user id/)
    expect(wrong).not.toMatch(/synthetic_value|owner@/)
  })

  it('fails a Vercel production build closed without the admin variables, and nothing else', () => {
    expect(() => assertAdminConfiguration({})).not.toThrow()
    expect(() => assertAdminConfiguration({ VERCEL: '1', VERCEL_ENV: 'preview' })).not.toThrow()
    expect(() => assertAdminConfiguration({ VERCEL_ENV: 'production' })).toThrow(
      /\[admin\] The admin is not configured: SUPABASE_PUBLISHABLE_KEY is missing; ADMIN_USER_ID is missing/,
    )
    expect(() =>
      assertAdminConfiguration({ ...ADMIN_E2E_ENV, VERCEL_ENV: 'production' }),
    ).not.toThrow()
  })

  it('recognizes user ids as UUIDs only', () => {
    expect(isUuid(ADMIN.id)).toBe(true)
    for (const value of ['', 'admin', ADMIN.email, `${ADMIN.id}x`, null, 42])
      expect(isUuid(value)).toBe(false)
  })
})

// -- Authentication and authorization ---------------------------------------------------

describe('requireAdmin', () => {
  it('sends a visitor without a session to sign in, reading nothing', async () => {
    const result = await caught(requireAdmin())
    expect(result).toBeInstanceOf(Redirected)
    expect((result as Redirected).to).toBe('/admin/login')
    expect(restRequests()).toEqual([])
  })

  it('lets the admin through, confirmed by the auth server', async () => {
    expect(await signInAs(ADMIN)).toEqual(new Redirected('/admin'))
    const user = await requireAdmin()
    expect(user.id).toBe(ADMIN.id)
    expect(fake.state.requests.some((r) => r.path === '/auth/v1/user')).toBe(true)
    expect(await isSignedInAdmin()).toBe(true)
  })

  it('refuses a real user who is not the admin, and signs them out', async () => {
    // A session for the other account, as a cookie would carry it.
    const client = createAuthClient(adminAuthConfig()!, {
      getAll: cookieStore.getAll,
      setAll: (list) => list.forEach(({ name, value }) => cookieStore.set(name, value)),
    })
    await client.auth.signInWithPassword({ email: OTHER.email, password: OTHER.password })
    expect(jar.size).toBeGreaterThan(0)
    expect(fake.state.sessions.size).toBe(1)

    expect(await caught(requireAdmin())).toEqual(new Redirected('/admin/login'))
    expect(fake.state.sessions.size).toBe(0)
    expect(jar.size).toBe(0)
    expect(restRequests()).toEqual([])
  })

  it('never authorizes by email or metadata: only the id decides', async () => {
    const lookalike = { id: OTHER.id, email: ADMIN.email, password: 'synthetic-lookalike-1' }
    fake = createFakeSupabase({ users: [ADMIN, lookalike] })
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      fake.handle(input, init),
    )
    const client = createAuthClient(adminAuthConfig()!, {
      getAll: cookieStore.getAll,
      setAll: (list) => list.forEach(({ name, value }) => cookieStore.set(name, value)),
    })
    await client.auth.signInWithPassword({ email: lookalike.email, password: lookalike.password })
    expect((await checkAdmin(client, ADMIN.id)).status).toBe('forbidden')
  })

  it('treats an ended session as no session', async () => {
    await signInAs(ADMIN)
    fake.state.sessions.clear()
    expect(await caught(requireAdmin())).toEqual(new Redirected('/admin/login'))
  })

  it('sends everyone to sign in when the admin is not configured here', async () => {
    vi.stubEnv('ADMIN_USER_ID', '')
    expect(await caught(requireAdmin())).toEqual(new Redirected('/admin/login'))
    expect(fake.state.requests).toEqual([])
  })
})

describe('sign in and sign out', () => {
  it('signs the admin in with httpOnly session cookies, and redirects to the leads', async () => {
    expect(await signInAs(ADMIN)).toEqual(new Redirected('/admin'))
    expect([...jar.keys()].some((name) => name.startsWith('sb-'))).toBe(true)
  })

  it('answers every refusal the same way, keeping only the email', async () => {
    const answers = [
      await signInAs({ email: ADMIN.email, password: 'wrong' }),
      await signInAs({ email: 'nobody@studio.example', password: 'whatever' }),
      await signInAs(OTHER),
      await caught(signIn(initialSignInState, form({ email: '', password: '' }))),
    ]
    for (const answer of answers) {
      expect(answer).toMatchObject({ status: 'error' })
      expect(JSON.stringify(answer)).not.toMatch(/password|credentials|exist|admin/i)
    }
    expect(answers[1]).toEqual({ status: 'error', email: 'nobody@studio.example' })
    // The other account was signed out at once: no session survives, no cookie remains.
    expect(fake.state.sessions.size).toBe(0)
    expect(jar.size).toBe(0)
    expect(SIGN_IN_ERROR).toBe('That email and password combination did not work.')
  })

  it('is unavailable, without contacting Supabase, when not configured', async () => {
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
    expect(await signInAs(ADMIN)).toEqual({ status: 'unavailable', email: ADMIN.email })
    expect(fake.state.requests).toEqual([])
  })

  it('signs out: the session ends and the cookies are cleared', async () => {
    await signInAs(ADMIN)
    expect(fake.state.sessions.size).toBe(1)
    expect(await caught(signOut())).toEqual(new Redirected('/admin/login'))
    expect(fake.state.sessions.size).toBe(0)
    expect(jar.size).toBe(0)
  })
})

// -- Status -----------------------------------------------------------------------------

describe('updateLeadStatus', () => {
  it('requires the admin itself, before reading anything', async () => {
    const result = await caught(
      updateLeadStatus(initialActionState, form({ lead: firstLead().id, status: 'won' })),
    )
    expect(result).toEqual(new Redirected('/admin/login'))
    await signInAs(OTHER)
    expect(
      await caught(
        updateLeadStatus(initialActionState, form({ lead: firstLead().id, status: 'won' })),
      ),
    ).toEqual(new Redirected('/admin/login'))
    expect(restRequests()).toEqual([])
    expect(firstLead().status).toBe('new')
  })

  it('updates a valid status and updated_at', async () => {
    await signInAs(ADMIN)
    const lead = firstLead()
    const before = lead.updated_at
    const state = await updateLeadStatus(
      initialActionState,
      form({ lead: lead.id, status: 'proposal_sent' }),
    )
    expect(state).toMatchObject({ status: 'success', message: 'Status changed to Proposal sent.' })
    expect(lead.status).toBe('proposal_sent')
    expect(Date.parse(lead.updated_at)).toBeGreaterThan(Date.parse(before))
    expect(revalidated).toEqual(['/admin', `/admin/leads/${lead.id}`])
  })

  it('rejects an unknown status, a malformed id and a missing lead, changing nothing', async () => {
    await signInAs(ADMIN)
    const lead = firstLead()
    for (const status of ['archived', 'NEW', '', "won'; drop table leads;--"]) {
      const state = await updateLeadStatus(initialActionState, form({ lead: lead.id, status }))
      expect(state).toMatchObject({ status: 'error', message: 'Choose one of the statuses.' })
    }
    expect(
      await updateLeadStatus(initialActionState, form({ lead: 'not-an-id', status: 'won' })),
    ).toMatchObject({ status: 'error', message: 'This lead could not be found.' })
    expect(
      await updateLeadStatus(
        initialActionState,
        form({ lead: '0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f', status: 'won' }),
      ),
    ).toMatchObject({ status: 'error', message: 'This lead no longer exists.' })
    expect(lead.status).toBe('new')
    expect(restRequests().filter((r) => r.method === 'PATCH')).toHaveLength(1)
  })

  it('reports a database failure without its detail, and logs only a code', async () => {
    await signInAs(ADMIN)
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_a_key_the_database_refuses')
    const state = await updateLeadStatus(
      initialActionState,
      form({ lead: firstLead().id, status: 'won' }),
    )
    expect(state).toMatchObject({
      status: 'error',
      message: 'The CRM is not available right now. Nothing was changed.',
    })
    expect(errors()).toMatch(/\[admin\] Status update failed \(42501\)\./)
    expect(errors()).not.toMatch(/sb_secret|leads\.example|permission denied/)
  })
})

// -- Notes ------------------------------------------------------------------------------

describe('addLeadNote', () => {
  it('requires the admin itself', async () => {
    expect(
      await caught(addLeadNote(initialActionState, form({ lead: firstLead().id, note: 'Hi' }))),
    ).toEqual(new Redirected('/admin/login'))
    expect(fake.state.notes).toEqual([])
  })

  it('adds a valid note to the right lead, as plain text', async () => {
    await signInAs(ADMIN)
    const [a, b] = fake.state.leads
    const state = await addLeadNote(
      initialActionState,
      form({ lead: a!.id, note: '  Called back.\r\n<b>Proposal</b> on Sunday.\u202e  ' }),
    )
    expect(state).toMatchObject({ status: 'success', message: 'Note added.' })
    expect(fake.state.notes).toHaveLength(1)
    expect(fake.state.notes[0]).toMatchObject({
      lead_id: a!.id,
      body: 'Called back.\n<b>Proposal</b> on Sunday.',
    })
    const crm = configuredCrmRepository()!
    expect(await crm.listNotes(a!.id)).toHaveLength(1)
    expect(await crm.listNotes(b!.id)).toEqual([])
  })

  it('rejects a blank note and an overlong one, keeping the earlier counter', async () => {
    await signInAs(ADMIN)
    const previous = { status: 'success' as const, done: 7 }
    for (const note of ['', '   ', '\n\n\t']) {
      expect(await addLeadNote(previous, form({ lead: firstLead().id, note }))).toEqual({
        status: 'error',
        message: 'Write a note before adding it.',
        done: 7,
      })
    }
    expect(
      await addLeadNote(previous, form({ lead: firstLead().id, note: 'x'.repeat(4001) })),
    ).toEqual({
      status: 'error',
      message: 'Notes can be up to 4,000 characters.',
      done: 7,
    })
    expect(
      (await addLeadNote(previous, form({ lead: firstLead().id, note: 'x'.repeat(4000) }))).status,
    ).toBe('success')
    expect(fake.state.notes).toHaveLength(1)
  })

  it('refuses a note for a missing lead (the foreign key)', async () => {
    await signInAs(ADMIN)
    const state = await addLeadNote(
      initialActionState,
      form({ lead: '0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f', note: 'Hello' }),
    )
    expect(state).toMatchObject({ status: 'error', message: 'This lead no longer exists.' })
  })
})

// -- CRM data layer ---------------------------------------------------------------------

describe('CRM repository', () => {
  it('lists the newest leads with a bound, the list columns only, with the secret key', async () => {
    const crm = configuredCrmRepository()!
    const rows = await crm.listRecentLeads(5)
    expect(rows).toHaveLength(5)
    const times = rows.map((r) => Date.parse(r.created_at))
    expect([...times].sort((a, b) => b - a)).toEqual(times)
    expect(Object.keys(rows[0]!).sort()).toEqual(LEAD_LIST_COLUMNS.split(', ').sort())
    const request = restRequests().at(-1)!
    expect(request.apikey).toBe(SECRET_KEY)
  })

  it('gets a lead by id, or null', async () => {
    const crm = configuredCrmRepository()!
    expect((await crm.getLead(firstLead().id))?.email).toBe(firstLead().email)
    expect(await crm.getLead('0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f')).toBeNull()
  })

  it('throws a coded error, and the browser key reads nothing', async () => {
    const crm = configuredCrmRepository({
      ...ADMIN_E2E_ENV,
      SUPABASE_SECRET_KEY: 'sb_secret_wrong',
    })!
    await expect(crm.listRecentLeads(10)).rejects.toEqual(new CrmError('list', '42501'))
    const publishable = await fake.handle(
      new Request(`${FAKE_URL}/rest/v1/leads?select=*`, { headers: { apikey: PUBLISHABLE_KEY } }),
    )
    expect(publishable.status).toBe(401)
  })

  it('deleting a lead deletes its notes', async () => {
    const crm = configuredCrmRepository()!
    const [a, b] = fake.state.leads
    await crm.addNote(a!.id, 'one')
    await crm.addNote(b!.id, 'two')
    await fake.handle(
      new Request(`${FAKE_URL}/rest/v1/leads?id=eq.${a!.id}`, {
        method: 'DELETE',
        headers: { apikey: SECRET_KEY },
      }),
    )
    expect(fake.state.notes.map((n) => n.body)).toEqual(['two'])
  })
})

// -- View logic -------------------------------------------------------------------------

describe('dashboard view logic', () => {
  const rows = fakeRows()
  function fakeRows() {
    return createFakeSupabase().state.leads.map((row) =>
      Object.fromEntries(LEAD_LIST_COLUMNS.split(', ').map((c) => [c, row[c as keyof typeof row]])),
    ) as unknown as Parameters<typeof view.filterLeads>[0]
  }

  it('counts real values only', () => {
    const summary = view.summarize(rows)
    expect(summary.total).toBe(30)
    expect(summary.new + summary.inProgress + summary.won + summary.lost).toBe(30)
    expect(summary.inProgress).toBe(
      rows.filter((r) => ['contacted', 'talking', 'proposal_sent'].includes(r.status)).length,
    )
    expect(summary.notificationIssues).toBe(
      rows.filter((r) => r.notification_status !== 'sent').length,
    )
    expect(view.summarize([])).toEqual({
      total: 0,
      new: 0,
      inProgress: 0,
      won: 0,
      lost: 0,
      notificationIssues: 0,
    })
  })

  it('reads the query from the URL, ignoring anything unknown', () => {
    expect(view.parseLeadQuery({})).toEqual({
      status: null,
      locale: null,
      notification: null,
      q: '',
      page: 1,
    })
    expect(
      view.parseLeadQuery({
        status: 'won',
        locale: 'he',
        notification: 'issues',
        q: ' bakery ',
        page: '3',
      }),
    ).toEqual({ status: 'won', locale: 'he', notification: 'issues', q: 'bakery', page: 3 })
    expect(
      view.parseLeadQuery({
        status: 'deleted',
        locale: 'fr',
        notification: 'x',
        page: '-2',
        q: 'y'.repeat(300),
      }),
    ).toEqual({ status: null, locale: null, notification: null, q: 'y'.repeat(100), page: 1 })
    expect(view.queryString(view.parseLeadQuery({ status: 'active', q: 'a b', page: '2' }))).toBe(
      '?q=a+b&status=active&page=2',
    )
  })

  it('filters by status, pipeline, locale and notification', () => {
    const q = (params: Record<string, string>) =>
      view.filterLeads(rows, view.parseLeadQuery(params))
    expect(q({ status: 'won' }).every((r) => r.status === 'won')).toBe(true)
    expect(new Set(q({ status: 'active' }).map((r) => r.status))).toEqual(
      new Set(['contacted', 'talking', 'proposal_sent']),
    )
    expect(q({ locale: 'he' }).every((r) => r.locale === 'he')).toBe(true)
    expect(q({ notification: 'issues' }).every((r) => r.notification_status !== 'sent')).toBe(true)
    expect(q({ notification: 'failed' }).every((r) => r.notification_status === 'failed')).toBe(
      true,
    )
    expect(
      q({ status: 'won', locale: 'he' }).every((r) => r.status === 'won' && r.locale === 'he'),
    ).toBe(true)
  })

  it('searches name, email, phone, business and message as literal text', () => {
    const search = (text: string) => view.filterLeads(rows, view.parseLeadQuery({ q: text }))
    expect(search('ELI EXAMPLE 3').map((r) => r.name)).toEqual(['Eli Example 3'])
    expect(search('seed-12@').map((r) => r.email)).toEqual(['seed-12@leads.example'])
    expect(search('Bakery Example 8').map((r) => r.name)).toEqual(['Eli Example 8'])
    expect(search('number 17,').map((r) => r.name)).toEqual(['Dana Example 17'])
    expect(search('לדוגמה 4').map((r) => r.name)).toEqual(['דנה לדוגמה 4'])
    expect(search('050 1234510').map((r) => r.name)).toEqual(['Noa Example 11'])
    for (const hostile of ['%', '*', ',or(status.eq.won)', 'name.ilike.*', "') or 1=1 --"])
      expect(search(hostile), hostile).toEqual([])
  })

  it('pages with a bound, never past the end', () => {
    const page = (n: number) => view.paginate(rows, n)
    expect(page(1)).toMatchObject({ page: 1, pages: 2, total: 30, from: 1, to: 25 })
    expect(page(1).items).toHaveLength(view.PAGE_SIZE)
    expect(page(2)).toMatchObject({ page: 2, from: 26, to: 30 })
    expect(page(99).page).toBe(2)
    expect(view.paginate([], 1)).toMatchObject({ page: 1, pages: 1, from: 0, to: 0, items: [] })
    expect(view.LEAD_FETCH_LIMIT).toBe(1000)
  })

  it('opens only http(s) links, dials only digits, and keeps notes plain', () => {
    expect(view.safeExternalUrl('https://studio.example/x')?.href).toBe('https://studio.example/x')
    for (const link of [
      'javascript:alert(1)',
      'data:text/html,x',
      'ftp://x.example',
      'not a url',
      null,
    ])
      expect(view.safeExternalUrl(link)).toBeNull()
    expect(view.telHref('+972 50-123 4567')).toBe('tel:+972501234567')
    expect(view.telHref('12')).toBeNull()
    expect(view.cleanNote('  a\u0000b  ')).toEqual({ body: 'ab' })
    expect(view.cleanNote(' ')).toEqual({ error: 'Write a note before adding it.' })
  })

  it('formats times in Israel time', () => {
    expect(view.formatDateTime('2026-10-03T09:00:00Z')).toBe('3 Oct 2026, 12:00')
    expect(view.formatDateTime('nonsense')).toBe('')
  })
})

// -- Proxy ------------------------------------------------------------------------------

describe('admin proxy', () => {
  const request = (path: string, init?: { method?: string; cookies?: string }) =>
    new NextRequest(new URL(path, 'http://localhost:3100'), {
      method: init?.method ?? 'GET',
      headers: init?.cookies ? { cookie: init.cookies } : {},
    })

  it('is the only exception to locale routing, and only for /admin', async () => {
    expect(isAdminPath('/admin')).toBe(true)
    expect(isAdminPath('/admin/leads/x')).toBe(true)
    expect(isAdminPath('/administrator')).toBe(false)
    expect(isAdminPath('/en/admin')).toBe(false)
    const publicRedirect = await proxy(request('/administrator'))
    expect(publicRedirect.headers.get('location')).toMatch(/\/he\/administrator$/)
    const admin = await proxy(request('/admin'))
    expect(admin.headers.get('location')).toMatch(/\/admin\/login$/)
    // Public routes never touch the session.
    await proxy(request('/en'))
    await proxy(request('/he/contact'))
    expect(fake.state.requests.filter((r) => r.path.startsWith('/auth/'))).toHaveLength(0)
  })

  it('redirects page loads without the admin, and marks every admin response private', async () => {
    const response = await adminProxy(request('/admin/leads/abc'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3100/admin/login')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0')
    const login = await adminProxy(request('/admin/login'))
    expect(login.headers.get('location')).toBeNull()
    expect(login.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    // An action's POST goes on to its action, which redirects itself (requireAdmin).
    const post = await adminProxy(request('/admin', { method: 'POST' }))
    expect(post.headers.get('location')).toBeNull()
  })

  it('lets the admin through and clears anyone else’s session', async () => {
    await signInAs(ADMIN)
    const cookies = [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
    const admin = await adminProxy(request('/admin', { cookies }))
    expect(admin.headers.get('location')).toBeNull()

    jar.clear()
    const client = createAuthClient(adminAuthConfig()!, {
      getAll: cookieStore.getAll,
      setAll: (list) => list.forEach(({ name, value }) => cookieStore.set(name, value)),
    })
    await client.auth.signInWithPassword({ email: OTHER.email, password: OTHER.password })
    const otherCookies = [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
    const refused = await adminProxy(request('/admin', { cookies: otherCookies }))
    expect(refused.headers.get('location')).toMatch(/\/admin\/login$/)
    const cleared = refused.cookies.getAll().filter((c) => c.name.startsWith('sb-'))
    expect(cleared.length).toBeGreaterThan(0)
    expect(cleared.every((c) => c.value === '')).toBe(true)
  })
})

// -- Security of the code itself ---------------------------------------------------------

describe('admin security boundaries', () => {
  const root = path.resolve(__dirname, '../..')
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    )

  it('keeps every module that touches Supabase or a secret server-only', () => {
    for (const name of ['auth.ts', 'config.ts', 'crm.ts', 'session.ts'])
      expect(readFileSync(path.join(root, 'src/lib/admin', name), 'utf8'), name).toMatch(
        /^import 'server-only'$/m,
      )
  })

  it('no client component imports the auth, data or Supabase layers', () => {
    for (const file of walk(path.join(root, 'src')).filter((f) => /\.tsx?$/.test(f))) {
      const source = readFileSync(file, 'utf8')
      if (!/^['"]use client['"]/m.test(source)) continue
      expect(source, file).not.toMatch(
        /@\/lib\/admin\/(auth|config|crm|session|proxy)|@\/lib\/leads\/(config|repository|supabase)|@\/lib\/projects\/(editor|publish|translations)|@supabase\//,
      )
    }
  })

  it('has no NEXT_PUBLIC_SUPABASE variable anywhere it could be read', () => {
    const tracked = execFileSync(
      'git',
      ['ls-files', '-co', '--exclude-standard', 'src', '.env.example', 'next.config.ts'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )
      .split('\n')
      .filter(Boolean)
    for (const file of tracked)
      expect(readFileSync(path.join(root, file), 'utf8'), file).not.toMatch(/NEXT_PUBLIC_SUPABASE/)
  })

  it('names the admin variables, server-side, in .env.example', () => {
    const example = readFileSync(path.join(root, '.env.example'), 'utf8')
    for (const name of ['SUPABASE_PUBLISHABLE_KEY', 'ADMIN_USER_ID'])
      expect(example).toMatch(new RegExp(`^${name}=$`, 'm'))
  })

  it('fails a build that prerendered an admin page, never one that compiled its code', async () => {
    const { findPrerenderedAdmin } = await import('../../scripts/lint-policy.mjs')
    expect(
      findPrerenderedAdmin([
        'admin/page.js',
        'admin/page/build-manifest.json',
        'admin/leads/[id]/page.js',
        'admin/login/page_client-reference-manifest.js',
        'en/contact.html',
        'en/contact.rsc',
      ]),
    ).toEqual([])
    expect(
      findPrerenderedAdmin(['admin.html', 'admin.rsc', 'admin/login.html', 'admin/login.meta']),
    ).toEqual(['admin.html', 'admin.rsc', 'admin/login.html', 'admin/login.meta'])
  })

  it('keeps the admin palette legible', () => {
    expect(themeIssues(adminTheme)).toEqual([])
  })
})
