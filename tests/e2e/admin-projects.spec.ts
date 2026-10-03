import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN, FAKE_URL } from '../support/admin-fixtures.mjs'

/*
 * The admin's project editor (Phase 8C) against the local fake Supabase. Desktop and
 * mobile run in parallel on one fake, so each edits its own project.
 */

type Row = { project_id: string; locale: string; title: string; summary: string }

async function signInAsAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email', { exact: true }).fill(ADMIN.email)
  await page.getByLabel('Password', { exact: true }).fill(ADMIN.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

async function savedRow(projectId: string, locale: string): Promise<Row | undefined> {
  const rows = (await (await fetch(`${FAKE_URL}/__fixtures/translations`)).json()) as Row[]
  return rows.find((row) => row.project_id === projectId && row.locale === locale)
}

async function deploys(): Promise<number> {
  return ((await (await fetch(`${FAKE_URL}/__fixtures/deploys`)).json()) as { deploys: number })
    .deploys
}

const unique = (tag: string) => `${tag} ${Date.now().toString(36)}`

const title = (page: Page) => page.locator('#copy-title')
const summary = (page: Page) => page.locator('#copy-summary')
const segment = (page: Page, code: 'HE' | 'EN') =>
  page
    .getByRole('navigation', { name: 'Language' })
    .getByRole('link', { name: new RegExp(`^${code}`) })
const status = (page: Page, locale: 'he' | 'en') =>
  page.locator(`[data-locale-status="${locale}"]`).first()
const feedback = (page: Page) => page.locator('form [role="status"]').first()

test.describe('admin project editor', () => {
  test('one entry per project, each with its languages’ state', async ({ page }) => {
    await signInAsAdmin(page)
    await page
      .getByRole('navigation', { name: 'Admin' })
      .getByRole('link', { name: 'Projects' })
      .click()
    await expect(page).toHaveURL(/\/admin\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    const rows = page.locator('[data-project]')
    await expect(rows).toHaveCount(4)
    expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-project')))).toEqual(
      ['on', 'mi-ma-mo', 'confidential-01', 'confidential-02'],
    )
    // One card for the interface project, and the second confidential project apart from it.
    const first = page.locator('[data-project="confidential-01"]')
    await expect(first).toContainText('Process Management System')
    await expect(first.locator('[lang="he"]')).toHaveText('מערכת לניהול תהליכים')
    for (const locale of ['he', 'en'] as const)
      await expect(first.locator(`[data-locale-status="${locale}"]`)).toContainText('✓')
  })

  test('switches HE and EN without losing either, and saves each alone', async ({
    page,
  }, testInfo) => {
    // Each browser project edits its own project, so parallel runs never meet.
    const id = testInfo.project.name === 'mobile' ? 'confidential-02' : 'mi-ma-mo'
    await signInAsAdmin(page)
    await page.goto(`/admin/projects/${id}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Hebrew first, right to left.
    await expect(segment(page, 'HE')).toHaveAttribute('aria-current', 'true')
    await expect(title(page)).toHaveAttribute('dir', 'rtl')
    await expect(title(page)).toHaveAttribute('lang', 'he')
    const heBefore = await savedRow(id, 'he')
    const heOriginal = await title(page).inputValue()
    expect(heOriginal).not.toBe('')

    // An unsaved Hebrew edit survives the switch to English.
    const heDraft = `${heOriginal} טיוטה`
    await title(page).fill(heDraft)
    await expect(status(page, 'he')).toContainText('Unsaved')
    await segment(page, 'EN').click()
    await expect(page).toHaveURL(new RegExp(`/admin/projects/${id}\\?locale=en$`))
    await expect(segment(page, 'EN')).toHaveAttribute('aria-current', 'true')
    await expect(title(page)).toHaveAttribute('dir', 'ltr')
    await expect(title(page)).toHaveAttribute('lang', 'en')
    await expect(title(page)).not.toHaveValue(heDraft)
    await expect(status(page, 'he')).toContainText('Unsaved')

    // Saving English stores English only.
    const enTitle = unique('English title')
    await title(page).fill(enTitle)
    await summary(page).fill('An English description, saved by the e2e suite.')
    await page.getByRole('button', { name: 'Save English' }).click()
    await expect(feedback(page)).toHaveText('English saved. Publish to show it on the site.')
    await expect(status(page, 'en')).not.toContainText('Unsaved')
    expect(await savedRow(id, 'en')).toMatchObject({ title: enTitle })
    expect(await savedRow(id, 'he')).toEqual(heBefore)

    // Back to Hebrew: the draft is still there; saving it leaves English as saved.
    await segment(page, 'HE').click()
    await expect(title(page)).toHaveValue(heDraft)
    await expect(title(page)).toHaveAttribute('dir', 'rtl')
    const enSaved = await savedRow(id, 'en')
    await page.getByRole('button', { name: 'Save Hebrew' }).click()
    await expect(feedback(page)).toHaveText('Hebrew saved. Publish to show it on the site.')
    expect(await savedRow(id, 'he')).toMatchObject({ title: heDraft })
    expect(await savedRow(id, 'en')).toEqual(enSaved)

    // A fresh load shows what is stored, in the language asked for.
    await page.goto(`/admin/projects/${id}?locale=en`)
    await expect(title(page)).toHaveValue(enTitle)
    await expect(status(page, 'he')).toContainText('✓')
    await expect(status(page, 'en')).toContainText('✓')

    // A missing title is shown, and refused without touching what is stored.
    await title(page).fill('')
    await expect(status(page, 'en')).toContainText('Missing')
    await page.getByRole('button', { name: 'Save English' }).click()
    await expect(page.getByText('Title is required.')).toBeVisible()
    await expect(title(page)).toHaveAttribute('aria-invalid', 'true')
    expect(await savedRow(id, 'en')).toEqual(enSaved)
  })

  test('shared properties are shown once, read-only', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/admin/projects/on')
    const shared = page.getByRole('region', { name: 'Shared by both languages' })
    await expect(shared).toContainText('ID')
    await expect(shared).toContainText('on')
    await expect(shared.locator('input, textarea, select')).toHaveCount(0)
    await segment(page, 'EN').click()
    await expect(shared).toBeVisible()
    await expect(page.locator('form input:not([type="hidden"]), form textarea')).toHaveCount(2)
  })

  test('publishing starts one build', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/admin/projects/on')
    const before = await deploys()
    await page.getByRole('button', { name: 'Publish to the site' }).click()
    await expect(page.getByText('A new build has started.', { exact: false })).toBeVisible()
    expect(await deploys()).toBeGreaterThan(before)
  })

  test('an unknown project is a 404, and the editor needs the admin', async ({ page }) => {
    const anonymous = await page.request.get('/admin/projects/on', { maxRedirects: 0 })
    expect(anonymous.status()).toBe(307)
    expect(anonymous.headers().location).toBe('/admin/login')
    await signInAsAdmin(page)
    const response = await page.goto('/admin/projects/not-a-project')
    expect(response?.status()).toBe(404)
  })
})

test.describe('admin project editor accessibility', () => {
  const axe = async (page: Page) =>
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)

  test('no axe violations: the list and the editor in both languages', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/admin/projects')
    expect(await axe(page), 'list').toEqual([])
    await page.goto('/admin/projects/confidential-01')
    expect(await axe(page), 'editor HE').toEqual([])
    await segment(page, 'EN').click()
    await expect(title(page)).toHaveAttribute('lang', 'en')
    expect(await axe(page), 'editor EN').toEqual([])
  })

  test('no horizontal overflow at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await signInAsAdmin(page)
    for (const path of ['/admin/projects', '/admin/projects/confidential-01?locale=he']) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, path).toBeLessThanOrEqual(0)
      await expect(
        segment(page, 'HE').or(page.getByRole('heading', { name: 'Projects' })),
      ).toBeVisible()
    }
  })
})
