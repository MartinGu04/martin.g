import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN, ADMIN_E2E_ENV, FAKE_URL } from '../support/admin-fixtures.mjs'
import { createFakeSupabase } from '../support/fake-supabase-server.mjs'

/*
 * The admin's project editor (Phase 8C): the copy rules, the per-locale overlay on the
 * public site, the table's data layer, the Server Actions and publishing, with the real
 * Supabase clients against tests/support/fake-supabase-server.mjs at the fetch boundary.
 */

class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirect ${to}`)
  }
}

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
    throw new Error('not found')
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidated.push(p) }))

const rules = await import('@/lib/projects/copy-rules')
const {
  configuredContentClient,
  loadSiteTranslations,
  readTranslations,
  resetSiteTranslations,
  rowsToTranslations,
  saveTranslation,
} = await import('@/lib/projects/translations')
const { editorProjects, isEditableProject } = await import('@/lib/projects/editor')
const { deployHookUrl, triggerDeploy } = await import('@/lib/projects/publish')
const { withSavedCopy } = await import('@/content/saved-copy')
const { getAllProjectsForChecks, getPublicProject } = await import('@/content/registry')
const { saveProjectCopy, publishSite } = await import('@/lib/admin/project-actions')
const { signIn } = await import('@/lib/admin/actions')
const { initialCopyActionState, initialSignInState } = await import('@/lib/admin/state')

let fake: ReturnType<typeof createFakeSupabase>

function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

async function signInAsAdmin() {
  try {
    await signIn(initialSignInState, form({ email: ADMIN.email, password: ADMIN.password }))
  } catch (error) {
    if (!(error instanceof Redirected)) throw error
  }
}

const row = (projectId: string, locale: string) =>
  fake.state.translations.find((r) => r.project_id === projectId && r.locale === locale)

const save = (values: Record<string, string>) =>
  saveProjectCopy(initialCopyActionState, form(values))

const HE = { title: 'כותרת עברית לבדיקה', summary: 'תיאור עברי קצר לבדיקה.' }
const EN = { title: 'A synthetic English title', summary: 'A synthetic English description.' }

beforeEach(() => {
  jar.clear()
  revalidated.length = 0
  fake = createFakeSupabase()
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => fake.handle(input, init))
  for (const [key, value] of Object.entries(ADMIN_E2E_ENV)) vi.stubEnv(key, value)
  vi.stubEnv('VERCEL', '')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  resetSiteTranslations()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetSiteTranslations()
})

describe('copy rules', () => {
  it('requires a title and a short description, within the table’s limits', () => {
    expect(rules.copyErrors(EN)).toEqual({})
    expect(rules.copyErrors({ title: '  ', summary: '' })).toEqual({
      title: 'Title is required.',
      summary: 'Short description is required.',
    })
    expect(rules.copyErrors({ title: 'x'.repeat(121), summary: 'y'.repeat(501) })).toEqual({
      title: 'Title can be up to 120 characters.',
      summary: 'Short description can be up to 500 characters.',
    })
    expect(rules.isCopyComplete({ title: 'x'.repeat(120), summary: 'y'.repeat(500) })).toBe(true)
  })

  it('matches the limits of the migration', () => {
    const sql = readFileSync(
      path.resolve(__dirname, '../../supabase/migrations/20261003152740_project_translations.sql'),
      'utf8',
    )
    expect(sql).toContain(`char_length(title) <= ${rules.COPY_LIMITS.title}`)
    expect(sql).toContain(`char_length(summary) <= ${rules.COPY_LIMITS.summary}`)
  })

  it('compares copy as it is stored, so trailing spaces are not an unsaved change', () => {
    expect(
      rules.sameCopy({ title: ' A  title ', summary: 'S' }, { title: 'A title', summary: 'S' }),
    ).toBe(true)
    expect(rules.sameCopy(EN, { ...EN, summary: 'Changed.' })).toBe(false)
    expect(rules.cleanCopy({ title: ' A\u202e title ', summary: 'S\n2' })).toEqual({
      title: 'A title',
      summary: 'S 2',
    })
  })
})

describe('saved copy on the public site', () => {
  const on = () => getPublicProject('on')!

  it('replaces a locale’s title and description, and nothing else', () => {
    const saved = withSavedCopy(on(), new Map([['on', { en: EN }]]))
    expect(saved.title.en).toBe(EN.title)
    expect(saved.summary.en).toBe(EN.summary)
    // Hebrew stays the code's, and so does every shared property.
    expect(saved.title.he).toBe(on().title.he)
    expect(saved.summary.he).toBe(on().summary.he)
    const { title, summary, ...shared } = saved
    const { title: t, summary: s, ...original } = on()
    expect(shared).toEqual(original)
    void [title, summary, t, s]
  })

  it('never changes the registry itself', () => {
    const before = structuredClone({ title: on().title, summary: on().summary })
    withSavedCopy(on(), new Map([['on', { en: EN, he: HE }]]))
    expect({ title: on().title, summary: on().summary }).toEqual(before)
  })

  it('leaves projects without saved copy as they are', () => {
    expect(withSavedCopy(on(), new Map())).toBe(on())
    expect(withSavedCopy(on(), new Map([['mi-ma-mo', { en: EN }]]))).toBe(on())
  })

  it('skips stored rows the table would refuse, and unknown locales', () => {
    const translations = rowsToTranslations([
      { project_id: 'on', locale: 'en', ...EN },
      { project_id: 'on', locale: 'fr', ...EN },
      { project_id: 'on', locale: 'he', title: ' ', summary: 'x' },
      { project_id: 'mi-ma-mo', locale: 'he', title: 'x'.repeat(121), summary: 'x' },
    ])
    expect([...translations.keys()]).toEqual(['on'])
    expect(translations.get('on')).toEqual({ en: EN })
  })
})

describe('reading saved copy for a build', () => {
  it('uses the code’s copy when no database is configured', async () => {
    await expect(loadSiteTranslations({})).resolves.toEqual(new Map())
    expect(fake.state.requests).toEqual([])
  })

  it('reads every saved row once per process', async () => {
    fake.state.translations.push({ project_id: 'on', locale: 'he', ...HE })
    const first = await loadSiteTranslations(ADMIN_E2E_ENV)
    await loadSiteTranslations(ADMIN_E2E_ENV)
    expect(first.get('on')).toEqual({ he: HE })
    expect(
      fake.state.requests.filter((r) => r.path === '/rest/v1/project_translations'),
    ).toHaveLength(1)
  })

  it('fails a Production build closed, with a code and no value', async () => {
    vi.stubGlobal('fetch', async () => new Response('{"code":"PGRST205"}', { status: 404 }))
    const failure = loadSiteTranslations({ ...ADMIN_E2E_ENV, VERCEL_ENV: 'production' })
    await expect(failure).rejects.toThrow(/could not be read \(PGRST205\)/)
    await expect(failure).rejects.not.toThrow(new RegExp(FAKE_URL.replace(/\./g, '\\.')))
  })
})

describe('the data layer', () => {
  it('saves one locale’s row and never touches the other', async () => {
    const client = configuredContentClient()!
    fake.state.translations.push({ project_id: 'on', locale: 'he', ...HE, updated_at: 'before' })
    const heBefore = structuredClone(row('on', 'he'))
    await saveTranslation(client, 'on', 'en', EN, new Date('2026-10-03T10:00:00Z'))
    await saveTranslation(client, 'on', 'en', { ...EN, title: 'Second' }, new Date())
    expect(row('on', 'he')).toEqual(heBefore)
    expect(fake.state.translations.filter((r) => r.project_id === 'on')).toHaveLength(2)
    expect(row('on', 'en')).toMatchObject({ title: 'Second', summary: EN.summary })
    const read = await readTranslations(client)
    expect(read.get('on')?.he).toMatchObject(HE)
  })

  it('reads with no caching for the admin', async () => {
    const calls: RequestInit[] = []
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(init ?? {})
      return fake.handle(input, init)
    })
    await readTranslations(configuredContentClient()!)
    expect(calls[0]?.cache).toBe('no-store')
  })
})

describe('the editor’s view', () => {
  it('lists every registered project once, with its shared facts and both locales', () => {
    const projects = editorProjects(new Map([['on', { en: EN }]]))
    expect(projects.map((p) => p.id)).toEqual(
      [...getAllProjectsForChecks()].sort((a, b) => a.order - b.order).map((p) => p.id),
    )
    const on = projects.find((p) => p.id === 'on')!
    expect(on.saved).toEqual({ en: EN })
    expect(on.defaults.he.title).toBe(getPublicProject('on')!.title.he)
    expect(on.shared.visibility).toBe('Public')
    const first = projects.find((p) => p.id === 'confidential-01')!
    expect(first.shared).toMatchObject({ visibility: 'Confidential' })
    expect(first.shared.liveUrl).toBeUndefined()
    expect(isEditableProject('confidential-02')).toBe(true)
    expect(isEditableProject('../on')).toBe(false)
  })
})

describe('saveProjectCopy', () => {
  it('refuses anyone who is not the admin, before anything is read or written', async () => {
    await expect(save({ project: 'on', locale: 'en', ...EN })).rejects.toBeInstanceOf(Redirected)
    expect(fake.state.requests.filter((r) => r.path.startsWith('/rest/'))).toEqual([])
    expect(fake.state.translations).toEqual([])
  })

  it('saves English without changing Hebrew, and Hebrew without changing English', async () => {
    await signInAsAdmin()
    expect(await save({ project: 'on', locale: 'he', ...HE })).toMatchObject({
      status: 'success',
      locale: 'he',
    })
    const he = structuredClone(row('on', 'he'))
    expect(await save({ project: 'on', locale: 'en', ...EN })).toMatchObject({
      status: 'success',
      locale: 'en',
      message: 'English saved. Publish to show it on the site.',
    })
    expect(row('on', 'he')).toEqual(he)
    const en = structuredClone(row('on', 'en'))
    await save({ project: 'on', locale: 'he', title: 'כותרת חדשה', summary: HE.summary })
    expect(row('on', 'en')).toEqual(en)
    expect(row('on', 'he')).toMatchObject({ title: 'כותרת חדשה' })
    expect(revalidated).toContain('/admin/projects/on')
  })

  it('stores the copy cleaned, and refuses invalid copy with field errors', async () => {
    await signInAsAdmin()
    await save({ project: 'on', locale: 'en', title: '  Spaced   title ', summary: 'S' })
    expect(row('on', 'en')).toMatchObject({ title: 'Spaced title', summary: 'S' })
    const refused = await save({ project: 'on', locale: 'he', title: '', summary: 'x'.repeat(501) })
    expect(refused).toMatchObject({
      status: 'error',
      locale: 'he',
      errors: {
        title: 'Title is required.',
        summary: 'Short description can be up to 500 characters.',
      },
    })
    expect(row('on', 'he')).toBeUndefined()
  })

  it('refuses unknown projects and locales', async () => {
    await signInAsAdmin()
    expect(await save({ project: 'not-a-project', locale: 'en', ...EN })).toMatchObject({
      status: 'error',
      message: 'This project could not be found.',
    })
    expect(await save({ project: 'on', locale: 'fr', ...EN })).toMatchObject({ status: 'error' })
    expect(fake.state.translations).toEqual([])
  })

  it('answers a database failure without detail and changes nothing', async () => {
    await signInAsAdmin()
    const handle = fake.handle
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      String(input instanceof Request ? input.url : input).includes('/rest/')
        ? Promise.resolve(
            new Response('{"code":"57014","message":"secret detail"}', { status: 500 }),
          )
        : handle(input, init),
    )
    const answer = await save({ project: 'on', locale: 'en', ...EN })
    expect(answer).toMatchObject({
      status: 'error',
      message: 'Project copy cannot be saved right now. Nothing was changed.',
    })
    expect(JSON.stringify(answer)).not.toContain('secret detail')
  })
})

describe('publishing', () => {
  it('accepts only Vercel’s deploy hook host, or a local one outside Vercel', () => {
    expect(
      deployHookUrl({
        VERCEL_DEPLOY_HOOK_URL: 'https://api.vercel.com/v1/integrations/deploy/x/y',
      }),
    ).not.toBeNull()
    for (const value of [
      'http://api.vercel.com/v1/integrations/deploy/x/y',
      'https://evil.example/hook',
      'https://user:pass@api.vercel.com/v1/x',
      'not a url',
    ])
      expect(deployHookUrl({ VERCEL_DEPLOY_HOOK_URL: value }), value).toBeNull()
    expect(deployHookUrl({ VERCEL_DEPLOY_HOOK_URL: `${FAKE_URL}/__deploy-hook` })).not.toBeNull()
    expect(
      deployHookUrl({ VERCEL: '1', VERCEL_DEPLOY_HOOK_URL: `${FAKE_URL}/__deploy-hook` }),
    ).toBeNull()
    expect(deployHookUrl({})).toBeNull()
  })

  it('starts one build for the admin only', async () => {
    await expect(publishSite()).rejects.toBeInstanceOf(Redirected)
    expect(fake.state.deploys).toBe(0)
    await signInAsAdmin()
    expect(await publishSite()).toMatchObject({ status: 'success' })
    expect(fake.state.deploys).toBe(1)
  })

  it('says so when publishing is not set up, or the hook fails', async () => {
    await signInAsAdmin()
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', '')
    expect(await publishSite()).toMatchObject({ status: 'error' })
    expect(fake.state.deploys).toBe(0)
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', `${FAKE_URL}/__missing`)
    expect(await triggerDeploy()).toBe('failed')
  })
})
