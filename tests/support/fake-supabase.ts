/*
 * A stand-in for the Supabase Data API (PostgREST) and Resend at the fetch boundary, for unit
 * tests of the Contact action: the real Supabase client and notifier code run, and no request
 * leaves the process. It implements only what the leads repository sends: an insert that
 * ignores a duplicate dedupe_key (ON CONFLICT DO NOTHING RETURNING id) and an update by id.
 * Synthetic values only; nothing here is real configuration.
 */

export const FAKE_SUPABASE_URL = 'https://synthetic-project.supabase.example'
export const FAKE_SECRET_KEY = 'sb_secret_synthetic_unit_test_key'

export type FakeRow = Record<string, unknown> & { id: string; dedupe_key: string }

export interface SentRequest {
  method: string
  url: URL
  headers: Headers
  body: unknown
}

export interface FakeBackends {
  rows: FakeRow[]
  requests: SentRequest[]
  /** What the database answers: 'ok', a PostgREST error status, or a lost connection. */
  database: 'ok' | 'error' | 'network'
  /** What the update (marking the notification) answers. */
  databaseUpdate: 'ok' | 'error'
  /** What Resend answers. */
  resend: 'ok' | 'error'
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export function fakeBackends(): FakeBackends {
  let next = 1
  const state: FakeBackends = {
    rows: [],
    requests: [],
    database: 'ok',
    databaseUpdate: 'ok',
    resend: 'ok',
    fetch: async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      const method = (init?.method ?? 'GET').toUpperCase()
      const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
      state.requests.push({ method, url, headers: new Headers(init?.headers), body })

      if (url.hostname === 'api.resend.com') {
        return state.resend === 'ok'
          ? json({ id: 'synthetic' })
          : new Response('upstream detail', { status: 502 })
      }
      if (url.origin !== FAKE_SUPABASE_URL || url.pathname !== '/rest/v1/leads') {
        throw new TypeError(`fake backends: unexpected request to ${url.origin}${url.pathname}`)
      }
      if (state.database === 'network') throw new TypeError('fetch failed')
      if (state.database === 'error') {
        return json({ code: '57P01', message: 'synthetic outage detail', details: null }, 503)
      }
      if (method === 'POST') {
        const row = body as FakeRow
        if (state.rows.some((r) => r.dedupe_key === row.dedupe_key)) return json([], 201)
        const id = `00000000-0000-4000-8000-${String(next++).padStart(12, '0')}`
        state.rows.push({
          ...row,
          id,
          status: 'new',
          notification_status: 'pending',
          notification_sent_at: null,
        })
        return json([{ id }], 201)
      }
      if (method === 'PATCH') {
        if (state.databaseUpdate === 'error') return json({ code: '08006', message: 'x' }, 503)
        const id = url.searchParams.get('id')?.replace(/^eq\./, '')
        const row = state.rows.find((r) => r.id === id)
        if (row) Object.assign(row, body)
        return new Response(null, { status: 204 })
      }
      throw new TypeError(`fake backends: unexpected ${method}`)
    },
  }
  return state
}
