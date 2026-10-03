import AxeBuilder from '@axe-core/playwright'
import { createServerClient } from '@supabase/ssr'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { ADMIN, FAKE_URL, OTHER, PUBLISHABLE_KEY, SECRET_KEY } from '../support/admin-fixtures.mjs'

/*
 * The private admin against a local fake Supabase (tests/support/fake-supabase-server.mjs)
 * with synthetic users and leads. Each test that changes data seeds its own lead.
 */

const SIGN_IN_ERROR = 'That email and password combination did not work.'
const loginError = (page: Page) => page.locator('#login-error[role="alert"]')

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto('/admin/login')
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function signInAsAdmin(page: Page) {
  await signIn(page, ADMIN)
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible()
}

async function seedLead(fields: Record<string, unknown>) {
  const response = await fetch(`${FAKE_URL}/__fixtures/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  return (await response.json()) as { id: string; name: string; email: string }
}

const unique = (tag: string) =>
  `${tag} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

async function sessionCookies(context: BrowserContext) {
  return (await context.cookies()).filter((c) => c.name.startsWith('sb-') && c.value)
}

/** A valid session for a real account, written as @supabase/ssr writes it, into a context. */
async function injectSession(context: BrowserContext, user: { email: string; password: string }) {
  const session = await (
    await fetch(`${FAKE_URL}/__fixtures/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
  ).json()
  const written: { name: string; value: string }[] = []
  const client = createServerClient(FAKE_URL, PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [],
      setAll: (list) => {
        written.push(...list)
      },
    },
  })
  await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  await expect.poll(() => written.length).toBeGreaterThan(0)
  await context.addCookies(
    written.map(({ name, value }) => ({ name, value, domain: 'localhost', path: '/admin' })),
  )
}

test.describe('admin access', () => {
  test('an unauthenticated visitor is sent to sign in, before anything renders', async ({
    page,
  }) => {
    for (const path of ['/admin', '/admin/leads/00000000-0000-4000-8000-000000000001']) {
      const response = await page.request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(307)
      expect(response.headers().location).toBe('/admin/login')
      expect(await response.text()).not.toMatch(/leads\.example|Example 1/)
    }
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
  })

  test('is never localized, indexed or cached', async ({ page }) => {
    const response = await page.goto('/admin/login')
    expect(response?.url()).toMatch(/\/admin\/login$/)
    const headers = response!.headers()
    expect(headers['x-robots-tag']).toBe('noindex, nofollow')
    expect(headers['cache-control']).toMatch(/private/)
    expect(headers['cache-control']).toMatch(/no-store/)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex, nofollow/,
    )
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    // None of the public site's chrome.
    await expect(page.getByRole('link', { name: 'Work' })).toHaveCount(0)
    const sitemap = await (await page.request.get('/sitemap.xml')).text()
    expect(sitemap).not.toContain('/admin')
  })

  test('a failed sign-in is generic, whatever failed', async ({ page, context }) => {
    for (const attempt of [
      { email: ADMIN.email, password: 'not-the-password' },
      { email: 'nobody@studio.example', password: 'whatever-password' },
    ]) {
      await signIn(page, attempt)
      const alert = loginError(page)
      await expect(alert).toHaveText(SIGN_IN_ERROR)
      await expect(alert).toBeFocused()
      await expect(page).toHaveURL(/\/admin\/login$/)
      await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
    }
    expect(await sessionCookies(context)).toEqual([])
  })

  test('a real account that is not the admin is refused like a wrong password', async ({
    page,
    context,
  }) => {
    await signIn(page, OTHER)
    await expect(loginError(page)).toHaveText(SIGN_IN_ERROR)
    await expect(page).toHaveURL(/\/admin\/login$/)
    expect(await sessionCookies(context)).toEqual([])
    const response = await page.request.get('/admin', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
  })

  test('a session that belongs to someone else never reaches the leads', async ({
    page,
    context,
  }) => {
    await injectSession(context, OTHER)
    expect(await sessionCookies(context)).not.toEqual([])
    const response = await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login$/)
    expect(await response!.text()).not.toMatch(/leads\.example/)
    // The proxy signed it out and cleared the cookies.
    expect(await sessionCookies(context)).toEqual([])
  })

  test('the admin signs in, and signs out', async ({ page, context }) => {
    await signInAsAdmin(page)
    const cookies = await sessionCookies(context)
    expect(cookies.length).toBeGreaterThan(0)
    for (const cookie of cookies) {
      expect(cookie.path).toBe('/admin')
      expect(cookie.httpOnly).toBe(true)
      expect(cookie.sameSite).toBe('Lax')
    }
    // Signed in, the login page goes straight to the leads.
    await page.goto('/admin/login')
    await expect(page).toHaveURL(/\/admin$/)

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/admin\/login$/)
    expect(await sessionCookies(context)).toEqual([])
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login$/)
  })
})

test.describe('admin CRM', () => {
  test('the dashboard: real counts, newest first, filters, search and pages', async ({ page }) => {
    await signInAsAdmin(page)
    const summary = page.getByRole('region', { name: 'Summary' })
    for (const label of ['New', 'In progress', 'Won', 'Notification issues'])
      await expect(summary.getByRole('link', { name: new RegExp(`^${label}\\b`) })).toBeVisible()

    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(25)
    // Newest first.
    const times = await page
      .locator('tbody time')
      .evaluateAll((els) => els.map((el) => Date.parse(el.getAttribute('datetime') ?? '')))
    expect([...times].sort((a, b) => b - a)).toEqual(times)

    // Pages.
    await page.getByRole('link', { name: 'Next page' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText(/^26–\d+ of \d+$/)).toBeVisible()

    // A status filter shows only that status, labeled in words.
    await page.goto('/admin?status=won')
    const statuses = await page
      .locator('tbody [data-status]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-status')))
    expect(statuses.length).toBeGreaterThan(0)
    expect(new Set(statuses)).toEqual(new Set(['won']))

    // Search, through the form, without building a query from the text.
    await page.goto('/admin')
    await page.getByLabel('Search').fill('Bakery Example 3')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page).toHaveURL(/q=Bakery/)
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Eli Example 3')
    await page.getByLabel('Search').fill('a”) or (1=1')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('No leads match these filters.')).toBeVisible()
  })

  test('opens a lead, changes its status and adds a note', async ({ page }) => {
    const name = unique('Fixture Lead')
    const lead = await seedLead({
      name,
      email: 'fixture@leads.example',
      phone: '+972 50 123 4567',
      kind: 'landing',
      business: 'Fixture Studio',
      link: 'https://fixture.example/work',
      timeline: 'month',
      description: 'Line one of the message.\nLine two, <b>not bold</b>.',
      locale: 'he',
    })
    await signInAsAdmin(page)
    await page.getByLabel('Search').fill(name)
    await page.getByRole('button', { name: 'Apply' }).click()
    await page.getByRole('link', { name }).click()
    await expect(page).toHaveURL(new RegExp(`/admin/leads/${lead.id}$`))
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

    // The inquiry as text: no HTML is ever rendered from it.
    const message = page.getByRole('region', { name: 'Message' })
    await expect(message).toContainText('Line two, <b>not bold</b>.')
    await expect(message.locator('b')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^Email/ })).toHaveAttribute(
      'href',
      'mailto:fixture@leads.example',
    )
    await expect(page.getByRole('link', { name: /^Call/ })).toHaveAttribute(
      'href',
      'tel:+972501234567',
    )
    const website = page.getByRole('link', { name: /^Open website/ })
    await expect(website).toHaveAttribute('href', 'https://fixture.example/work')
    await expect(website).toHaveAttribute('rel', 'noopener noreferrer nofollow')
    await expect(website).toHaveAttribute('target', '_blank')
    for (const text of ['Hebrew', 'Landing page', 'Within the next month', 'Fixture Studio'])
      await expect(page.getByRole('main')).toContainText(text)

    // Status.
    const status = page.getByLabel('Status')
    await status.selectOption('talking')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('#status-feedback')).toHaveText('Status changed to Talking.')
    await expect(page.locator('header [data-status]')).toHaveAttribute('data-status', 'talking')
    await page.reload()
    await expect(page.getByLabel('Status')).toHaveValue('talking')

    // A blank note is refused; a note is added and listed, newest first.
    await page.getByRole('button', { name: 'Add note' }).click()
    await expect(page.locator('#note-feedback')).toHaveText('Write a note before adding it.')
    const note = page.getByLabel('Add a note')
    await note.fill('Called back. Wants a <i>first</i> draft by Friday.')
    await page.getByRole('button', { name: 'Add note' }).click()
    await expect(page.locator('#note-feedback')).toHaveText('Note added.')
    await expect(note).toHaveValue('')
    const notes = page.getByRole('list', { name: 'Notes, newest first' })
    await expect(notes.getByRole('listitem')).toHaveCount(1)
    await expect(notes).toContainText('Wants a <i>first</i> draft by Friday.')
    await expect(notes.locator('i')).toHaveCount(0)
    const stored = await (await fetch(`${FAKE_URL}/__fixtures/notes?lead_id=${lead.id}`)).json()
    expect(stored).toHaveLength(1)
    expect(stored[0].lead_id).toBe(lead.id)
  })

  test('a missing lead is a 404 that says nothing', async ({ page }) => {
    await signInAsAdmin(page)
    for (const path of [
      '/admin/leads/0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f',
      '/admin/leads/not-an-id',
    ]) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(404)
      await expect(page.getByRole('heading', { level: 1, name: 'Not found' })).toBeVisible()
    }
  })
})

test.describe('admin security in the browser', () => {
  test('nothing the browser receives carries a key, the admin id or the Supabase client', async ({
    page,
  }) => {
    const bodies: string[] = []
    page.on('response', async (response) => {
      const type = response.headers()['content-type'] ?? ''
      if (/javascript|html|json|text\/x-component|css/.test(type))
        bodies.push(await response.text().catch(() => ''))
    })
    await signInAsAdmin(page)
    await page.locator('tbody tr a').first().click()
    await expect(page).toHaveURL(/\/admin\/leads\//)
    await page.waitForLoadState('networkidle')
    expect(bodies.length).toBeGreaterThan(3)
    const all = bodies.join('\n')
    for (const secret of [
      SECRET_KEY,
      PUBLISHABLE_KEY,
      ADMIN.id,
      'sb_secret_',
      'sb_publishable_',
      'supabase-js',
      FAKE_URL,
    ])
      expect(all, secret).not.toContain(secret)
    // No request from the browser ever goes to Supabase.
    const requested: string[] = []
    page.on('request', (request) => requested.push(request.url()))
    await page.reload()
    expect(requested.every((url) => url.startsWith('http://localhost'))).toBe(true)
  })
})

test.describe('admin accessibility', () => {
  const axe = async (page: Page) =>
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target).join(', ')})`)

  test('no axe violations: sign-in, its error, the dashboard and a lead', async ({ page }) => {
    await page.goto('/admin/login')
    expect(await axe(page), 'login').toEqual([])
    await signIn(page, { email: ADMIN.email, password: 'wrong-password' })
    await expect(loginError(page)).toHaveText(SIGN_IN_ERROR)
    expect(await axe(page), 'login error').toEqual([])
    await signInAsAdmin(page)
    expect(await axe(page), 'dashboard').toEqual([])
    const lead = await seedLead({
      name: unique('Axe Lead'),
      email: 'axe@leads.example',
      description: 'A message.',
    })
    await page.goto(`/admin/leads/${lead.id}`)
    expect(await axe(page), 'lead').toEqual([])
  })

  test('signs in and opens a lead with the keyboard alone', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation')
    await page.goto('/admin/login')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Email', { exact: true })).toBeFocused()
    await page.keyboard.type(ADMIN.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(ADMIN.password)
    await page.keyboard.press('Tab')
    const submit = page.getByRole('button', { name: 'Sign in' })
    await expect(submit).toBeFocused()
    expect(await submit.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/admin$/)

    // A fresh load: the skip link comes first, then into the leads.
    await page.goto('/admin')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.keyboard.press('Enter')
    const firstLead = page.locator('tbody tr a').first()
    await firstLead.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/admin\/leads\//)
  })

  test('no horizontal overflow at 320 pixels, everything in place with reduced motion', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 720 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const overflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
    await page.goto('/admin/login')
    expect(await overflow(), 'login').toBeLessThanOrEqual(0)
    await signInAsAdmin(page)
    expect(await overflow(), 'dashboard').toBeLessThanOrEqual(0)
    const lead = await seedLead({
      name: unique('Narrow Lead With A Rather Long Name'),
      email: 'a-very-long-address-for-a-narrow-screen@leads.example',
      link: 'https://a-very-long-host-name-for-a-narrow-screen.example/and/a/long/path',
      description: 'x'.repeat(300),
    })
    await page.goto(`/admin/leads/${lead.id}`)
    expect(await overflow(), 'lead').toBeLessThanOrEqual(0)
    // Nothing starts hidden.
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll('main *')].filter(
          (el) => getComputedStyle(el).opacity === '0',
        ).length,
    )
    expect(hidden).toBe(0)
    await context.close()
  })
})
