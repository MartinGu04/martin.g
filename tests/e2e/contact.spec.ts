import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openForLayout, openRendered } from '../support/navigation'
import { deliveredTo, uniqueEmail } from '../support/outbox'

const details = 'Bookings live in three spreadsheets and nobody knows which one is right.'

/**
 * Opens the form and waits until it is hydrated (it then validates itself). Before that a
 * click is a plain form POST, which the no-JavaScript tests cover.
 */
async function openForm(page: Page, url: string) {
  await page.goto(url)
  await expect(page.locator('form[novalidate]')).toHaveCount(1)
}

/** Fills the required fields (and a choice) through the page, as a visitor would. */
async function fillRequired(page: Page, email: string, lang: 'en' | 'he' = 'en') {
  const t =
    lang === 'en'
      ? { name: 'Your name', goal: 'What are you trying to build or improve?' }
      : { name: 'שם', goal: 'מה רוצים לבנות או לשפר?' }
  await page.getByLabel(t.name, { exact: true }).fill('Dana Example')
  await page.locator('#contact-email').fill(email)
  await page.getByLabel(t.goal).fill('A booking system for a small studio')
  await page.locator('#contact-details').fill(details)
}

test.describe('project inquiry page', () => {
  for (const [locale, title, h1] of [
    ['en', 'Start a project · MARTIN.G', 'Tell me about the problem.'],
    ['he', 'מתחילים פרויקט · MARTIN.G', 'ספרו לי על הבעיה.'],
  ] as const) {
    test(`renders in ${locale} with one h1, metadata and alternates`, async ({ page }) => {
      const response = await page.goto(`/${locale}/contact`)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(title)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1)
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'he' ? 'rtl' : 'ltr')
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`/${locale}/contact$`),
      )
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        'href',
        /\/he\/contact$/,
      )
    })
  }

  test('no axe violations, empty, with errors and after sending', async ({ page }) => {
    const axe = async () =>
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations.map((v) => `${v.id}: ${v.help}`)
    for (const locale of ['en', 'he']) {
      await openForm(page, `/${locale}/contact`)
      expect(await axe(), `${locale} empty`).toEqual([])
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('[aria-labelledby="contact-summary-title"]')).toBeFocused()
      expect(await axe(), `${locale} errors`).toEqual([])
    }
    await openForm(page, '/en/contact')
    await fillRequired(page, uniqueEmail('axe'))
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Got it.' })).toBeVisible()
    expect(await axe(), 'success').toEqual([])
  })

  test('labels, hints, required and optional fields are programmatic', async ({ page }) => {
    await openForm(page, '/en/contact')
    for (const [label, required] of [
      ['Your name', true],
      ['Email', true],
      ['What are you trying to build or improve?', true],
      ['What is the problem?', true],
      ['Business or project name (optional)', false],
      ['Website or relevant link (optional)', false],
    ] as const) {
      const field = page.getByLabel(label, { exact: true })
      await expect(field, label).toHaveCount(1)
      if (required) await expect(field, label).toHaveAttribute('required', '')
      else await expect(field, label).not.toHaveAttribute('required')
    }
    await expect(page.getByLabel('Email', { exact: true })).toHaveAccessibleDescription(
      'For the reply. Nothing else.',
    )
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('type', 'email')
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('autocomplete', 'email')
    // Choices are real radio groups with a legend; nothing relies on a placeholder.
    await expect(page.getByRole('group', { name: /What kind of project is this/ })).toHaveCount(1)
    await expect(page.getByRole('radio')).toHaveCount(9)
    await expect(page.locator('[placeholder]')).toHaveCount(0)
    // The spam trap is out of reach: hidden from assistive technology and the tab order.
    const trap = page.locator('input[name="homepage"]')
    await expect(trap).toHaveAttribute('tabindex', '-1')
    expect(await trap.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true)
  })

  test('helpful validation: a focused summary that links to each field', async ({ page }) => {
    await openForm(page, '/en/contact')
    await page.getByLabel('Email', { exact: true }).fill('dana@')
    await page.getByRole('button', { name: 'Send' }).click()

    const summary = page.locator('[aria-labelledby="contact-summary-title"]')
    await expect(summary).toBeFocused()
    await expect(summary.getByRole('heading', { level: 2 })).toHaveText(
      'A few details need another look:',
    )
    await expect(summary.getByRole('link')).toHaveText([
      'Enter your name.',
      'Enter an email address like name@example.com.',
      'Say in a line what you are trying to build or improve.',
      'Describe the problem in a few words.',
    ])

    // Each field says it is invalid and reads its own error.
    const email = page.getByLabel('Email', { exact: true })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription(
      'For the reply. Nothing else. Enter an email address like name@example.com.',
    )

    // The summary's link moves focus to the field.
    await summary
      .getByRole('link', { name: 'Enter an email address like name@example.com.' })
      .click()
    await expect(email).toBeFocused()

    // Fixing a field clears its error at once.
    await email.fill('dana@example.com')
    await expect(email).not.toHaveAttribute('aria-invalid')

    // Nothing was sent.
    expect(deliveredTo('dana@example.com')).toEqual([])
  })

  test('completes with the keyboard alone, and announces the result', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard navigation')
    const email = uniqueEmail('keyboard')
    await openForm(page, '/en/contact')
    await page.getByLabel('Your name').focus()
    await page.keyboard.type('Dana Example')
    await page.keyboard.press('Tab')
    await page.keyboard.type(email)
    await page.keyboard.press('Tab') // the project kinds: arrows choose within the group
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'A product' })).toBeChecked()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('What are you trying to build or improve?')).toBeFocused()
    await page.keyboard.type('A booking system')
    await page.keyboard.press('Tab')
    await page.keyboard.type(details)
    await page.keyboard.press('Tab') // business (optional)
    await page.keyboard.press('Tab') // link (optional)
    await page.keyboard.press('Tab') // timeline
    await page.keyboard.press('Space')
    await expect(page.getByRole('radio', { name: 'As soon as possible' })).toBeChecked()
    await page.keyboard.press('Tab')
    const send = page.getByRole('button', { name: 'Send' })
    await expect(send).toBeFocused()
    const ring = await send.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(ring).not.toBe('none')
    await page.keyboard.press('Enter')

    const heading = page.getByRole('heading', { level: 1, name: 'Got it.' })
    await expect(heading).toBeFocused()
    await expect(page.getByText('Your message reached me.', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to the work' })).toHaveAttribute(
      'href',
      '/en#work',
    )
    await expect(page.locator('h1')).toHaveCount(1)
    // The submission never appears in the address.
    expect(page.url()).toMatch(/\/en\/contact$/)

    await expect.poll(() => deliveredTo(email).length).toBe(1)
    const [entry] = deliveredTo(email)
    expect(entry!.values).toMatchObject({ kind: 'product', timeline: 'now', name: 'Dana Example' })
    expect(entry!.locale).toBe('en')
  })

  test('one inquiry is sent once, however often the action is pressed', async ({ page }) => {
    const email = uniqueEmail('duplicate')
    await openForm(page, '/he/contact')
    await fillRequired(page, email, 'he')
    // Hold the answer back, so the form stays in its sending state for a moment.
    let release: () => void = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/he/contact', async (route) => {
      if (route.request().method() === 'POST') await held
      await route.continue()
    })
    const send = page.locator('form button[type="submit"]')
    await send.click()
    await expect(send).toHaveText('בשליחה…')
    await expect(send).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByRole('status')).toHaveText('בשליחה…')
    await send.click({ force: true })
    await send.click({ force: true })
    release()
    await expect(page.getByRole('heading', { level: 1, name: 'קיבלתי.' })).toBeFocused()
    await expect.poll(() => deliveredTo(email).length).toBe(1)
    await page.waitForTimeout(500)
    expect(deliveredTo(email)).toHaveLength(1)
    expect(deliveredTo(email)[0]!.locale).toBe('he')
  })

  test('a lost connection keeps every value and offers a clear retry', async ({ page }) => {
    const email = uniqueEmail('offline')
    await openForm(page, '/en/contact')
    await fillRequired(page, email)
    await page.route('**/en/contact', (route) =>
      route.request().method() === 'POST' ? route.abort() : route.continue(),
    )
    await page.getByRole('button', { name: 'Send' }).click()
    const banner = page.locator('[aria-labelledby="contact-banner-title"]')
    await expect(banner).toBeFocused()
    await expect(banner).toContainText('The message wasn’t sent.')
    await expect(page.locator('#contact-email')).toHaveValue(email)
    await expect(page.locator('#contact-details')).toHaveValue(details)
    // The page shows nothing internal.
    expect(await page.locator('main').innerText()).not.toMatch(/error:|stack|ECONN|fetch/i)

    await page.unroute('**/en/contact')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Got it.' })).toBeVisible()
    await expect.poll(() => deliveredTo(email).length).toBe(1)
  })

  test('the RTL form keeps addresses left to right and free text in its own direction', async ({
    page,
  }) => {
    await openForm(page, '/he/contact')
    await expect(page.locator('#contact-email')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('#contact-link')).toHaveAttribute('dir', 'ltr')
    for (const id of ['#contact-name', '#contact-goal', '#contact-details'])
      await expect(page.locator(id)).toHaveAttribute('dir', 'auto')
    // The action's arrow points to the inline end: left in Hebrew.
    const transform = await page
      .locator('form button[type="submit"] svg')
      .evaluate((el) => getComputedStyle(el).transform)
    expect(transform).toContain('matrix(-1')
  })

  test('touch targets are at least 44 by 44 CSS pixels', async ({ page }) => {
    await openForm(page, '/en/contact')
    const small = await page
      .locator('form :is(input:not([type="hidden"]):not([tabindex="-1"]), textarea, button)')
      .evaluateAll((els) =>
        els
          .map((el) => {
            const target = el.closest('label') ?? el
            const box = target.getBoundingClientRect()
            return { name: (el as HTMLInputElement).name, w: box.width, h: box.height }
          })
          .filter((b) => b.w < 44 || b.h < 44),
      )
    expect(small).toEqual([])
  })
})

test.describe('project inquiry without JavaScript', () => {
  // A native form submission can be held by the browser's own background services before
  // it is sent (seen in sandboxed CI); the server answers in milliseconds either way.
  test.slow()

  test('sends, and the server renders the success state', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      const email = uniqueEmail('nojs')
      await openRendered(page, '/en/contact')
      await fillRequired(page, email)
      await page.getByRole('button', { name: 'Send' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Got it.' })).toBeVisible()
      expect(page.url()).not.toContain(encodeURIComponent(email))
      expect(page.url()).not.toContain('Dana')
      await expect.poll(() => deliveredTo(email).length).toBe(1)
    } finally {
      await context.close()
    }
  })

  test('shows the server’s errors with the values kept', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      const email = uniqueEmail('nojs-invalid')
      await openRendered(page, '/he/contact')
      await fillRequired(page, email, 'he')
      await page.locator('#contact-details').fill('קצר מדי')
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('[aria-labelledby="contact-summary-title"]')).toContainText(
        'עוד קצת פרטים, בבקשה: לפחות 20 תווים.',
      )
      await expect(page.locator('#contact-details')).toHaveAttribute('aria-invalid', 'true')
      await expect(page.locator('#contact-email')).toHaveValue(email)
      await expect(page.locator('#contact-details')).toHaveValue('קצר מדי')
      expect(deliveredTo(email)).toEqual([])
    } finally {
      await context.close()
    }
  })
})

test.describe('project inquiry layout', () => {
  test('no horizontal overflow from 1920 to 320 pixels', async ({ page }) => {
    for (const url of ['/en/contact', '/he/contact']) {
      for (const width of [1920, 1440, 1180, 820, 390, 320]) {
        await page.setViewportSize({ width, height: 900 })
        await openForLayout(page, url)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        )
        expect(overflow, `${url} at ${width}px`).toBeLessThanOrEqual(0)
      }
    }
  })

  for (const [label, width, dpr] of [
    ['200%', 640, 2],
    ['400%', 320, 4],
  ] as const) {
    test(`reflows at ${label} zoom, errors included`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height: 400 },
        deviceScaleFactor: dpr,
      })
      try {
        const page = await context.newPage()
        for (const url of ['/en/contact', '/he/contact']) {
          await openForLayout(page, url)
          await expect(page.locator('form[novalidate]')).toHaveCount(1)
          await page.locator('form button[type="submit"]').click()
          await expect(page.locator('[aria-labelledby="contact-summary-title"]')).toBeVisible()
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          )
          expect(overflow, `${url} at ${label}`).toBeLessThanOrEqual(0)
        }
      } finally {
        await context.close()
      }
    })
  }

  test('with reduced motion everything is in place at once', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await openForm(page, '/en/contact')
      const animation = await page
        .locator('[class*="thread"]')
        .first()
        .evaluate((el) => getComputedStyle(el).animationName)
      expect(animation).toBe('none')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
