import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openForLayout, openRendered } from '../support/navigation'
import { deliveredTo, storedLeads, uniqueEmail } from '../support/outbox'

const description = 'A clear website for a new studio that explains what we offer.'

/**
 * Opens the form and waits until it is hydrated (it then validates itself). Before that a
 * click is a plain form POST, which the no-JavaScript tests cover.
 */
async function openForm(page: Page, url: string) {
  await page.goto(url)
  await expect(page.locator('form[novalidate]')).toHaveCount(1)
}

/** Fills the required fields through the page, by their visible labels, as a visitor would. */
async function fillRequired(page: Page, email: string, lang: 'en' | 'he' = 'en') {
  const t =
    lang === 'en'
      ? { name: 'Name', email: 'Email', about: 'Tell me a little about the project' }
      : { name: 'שם', email: 'אימייל', about: 'ספרו לי קצת על הפרויקט' }
  await page.getByLabel(t.name, { exact: true }).fill('Dana Example')
  await page.getByLabel(t.email, { exact: true }).fill(email)
  await page.getByLabel(t.about, { exact: true }).fill(description)
}

test.describe('project inquiry page', () => {
  for (const [locale, title, h1] of [
    ['en', 'Start a project · MARTIN.G', 'Tell me a little about what you want to create.'],
    ['he', 'מתחילים פרויקט · MARTIN.G', 'ספרו לי קצת על מה שאתם רוצים ליצור.'],
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
      // Focus scrolls smoothly to the summary: measure once the page is at rest, not while
      // a control passes under the sticky header.
      await expect
        .poll(async () => {
          const before = await page.evaluate(() => scrollY)
          await page.waitForTimeout(150)
          return (await page.evaluate(() => scrollY)) === before
        })
        .toBe(true)
      expect(await axe(), `${locale} errors`).toEqual([])
    }
    await openForm(page, '/en/contact')
    await fillRequired(page, uniqueEmail('axe'))
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Got it.' })).toBeVisible()
    expect(await axe(), 'success').toEqual([])
  })

  test('labels, hints, placeholders, required and optional fields are programmatic', async ({
    page,
  }) => {
    for (const [locale, fields, kindName] of [
      [
        'en',
        [
          ['Name', true, 'Your name'],
          ['Email', true, 'name@example.com'],
          ['Phone (optional)', false, '050-1234567'],
          ['Tell me a little about the project', true, /^For example: I’m starting a new business/],
          ['Business or project name (optional)', false, 'For example: Studio North'],
          ['Existing website or relevant link (optional)', false, 'https://example.com'],
        ],
        'What kind of project is it? (optional)',
      ],
      [
        'he',
        [
          ['שם', true, 'איך קוראים לכם?'],
          ['אימייל', true, 'name@example.com'],
          ['טלפון (רשות)', false, '050-1234567'],
          ['ספרו לי קצת על הפרויקט', true, /^לדוגמה: אני פותח עסק חדש/],
          ['שם העסק או הפרויקט (רשות)', false, 'לדוגמה: Studio North'],
          ['אתר קיים או קישור רלוונטי (רשות)', false, 'https://example.com'],
        ],
        'איזה סוג פרויקט זה? (רשות)',
      ],
    ] as const) {
      await openForm(page, `/${locale}/contact`)
      for (const [label, required, placeholder] of fields) {
        // Found by its visible label: the placeholder is an example, never the label.
        const field = page.getByLabel(label, { exact: true })
        await expect(field, label).toHaveCount(1)
        await expect(field, label).toHaveAttribute('placeholder', placeholder)
        const id = await field.getAttribute('id')
        await expect(page.locator(`label[for="${id}"]`)).toBeVisible()
        if (required) await expect(field, label).toHaveAttribute('required', '')
        else await expect(field, label).not.toHaveAttribute('required')
      }
      await expect(page.getByRole('group', { name: kindName })).toHaveCount(1)
    }
    await openForm(page, '/en/contact')
    const email = page.getByLabel('Email', { exact: true })
    await expect(email).toHaveAccessibleDescription('So I can get back to you.')
    await expect(email).toHaveAttribute('type', 'email')
    await expect(email).toHaveAttribute('autocomplete', 'email')
    const phone = page.getByLabel('Phone (optional)', { exact: true })
    await expect(phone).toHaveAttribute('type', 'tel')
    await expect(phone).toHaveAttribute('autocomplete', 'tel')
    await expect(phone).toHaveAccessibleDescription('If you’d like me to get back to you by phone.')
    await expect(
      page.getByLabel('Tell me a little about the project', { exact: true }),
    ).toHaveAccessibleDescription(
      'What do you want to create, who is it for, and what should it help you do?',
    )
    // The two choices, with exactly the new options; the old fields are gone.
    const kinds = page.getByRole('group', { name: /What kind of project is it/ }).locator('label')
    await expect(kinds).toHaveText([
      'Website',
      'Landing page',
      'System / app',
      'I have an existing website or system',
      'Something else / Not sure yet',
    ])
    const times = page.getByRole('group', { name: /When would you like to start/ }).locator('label')
    await expect(times).toHaveText([
      'As soon as possible',
      'Within the next month',
      'Within 1–3 months',
      'More than 3 months from now',
      'No date yet',
    ])
    await expect(page.getByRole('radio')).toHaveCount(10)
    await expect(page.locator('[name="goal"], [name="details"]')).toHaveCount(0)
    // The spam trap is out of reach: hidden from assistive technology and the tab order.
    const trap = page.locator('input[name="homepage"]')
    await expect(trap).toHaveAttribute('tabindex', '-1')
    expect(await trap.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true)
  })

  test('helpful validation: a focused summary that links to each field', async ({ page }) => {
    await openForm(page, '/en/contact')
    await page.getByLabel('Email', { exact: true }).fill('dana@')
    await page.getByLabel('Phone (optional)', { exact: true }).fill('call me')
    await page.getByRole('button', { name: 'Send' }).click()

    const summary = page.locator('[aria-labelledby="contact-summary-title"]')
    await expect(summary).toBeFocused()
    await expect(summary.getByRole('heading', { level: 2 })).toHaveText(
      'A few details need another look:',
    )
    await expect(summary.getByRole('link')).toHaveText([
      'Enter your name.',
      'Enter an email address like name@example.com.',
      'Enter a phone number, like 050-1234567.',
      'Tell me a few words about the project.',
    ])

    // Each field says it is invalid and reads its own error.
    const email = page.getByLabel('Email', { exact: true })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription(
      'So I can get back to you. Enter an email address like name@example.com.',
    )

    // The summary's link moves focus to the field.
    await summary
      .getByRole('link', { name: 'Enter an email address like name@example.com.' })
      .click()
    await expect(email).toBeFocused()

    // Fixing a field clears its error at once; an empty optional phone is fine.
    await email.fill('dana@example.com')
    await expect(email).not.toHaveAttribute('aria-invalid')
    const phone = page.getByLabel('Phone (optional)', { exact: true })
    await phone.fill('+972 50 123 4567')
    await expect(phone).not.toHaveAttribute('aria-invalid')

    // Nothing was sent or stored.
    expect(deliveredTo('dana@example.com')).toEqual([])
    expect(storedLeads('dana@example.com')).toEqual([])
  })

  test('completes with the keyboard alone, and announces the result', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard navigation')
    const email = uniqueEmail('keyboard')
    await openForm(page, '/en/contact')
    await page.getByLabel('Name', { exact: true }).focus()
    await page.keyboard.type('Dana Example')
    await page.keyboard.press('Tab')
    await page.keyboard.type(email)
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Phone (optional)', { exact: true })).toBeFocused()
    await page.keyboard.type('050-1234567')
    await page.keyboard.press('Tab') // the project types: arrows choose within the group
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'Landing page' })).toBeChecked()
    await page.keyboard.press('Tab')
    await expect(
      page.getByLabel('Tell me a little about the project', { exact: true }),
    ).toBeFocused()
    await page.keyboard.type(description)
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
    expect(entry!.values).toEqual({
      name: 'Dana Example',
      email,
      phone: '050-1234567',
      kind: 'landing',
      description,
      business: '',
      link: '',
      timeline: 'asap',
    })
    expect(entry!.locale).toBe('en')

    // Stored first, as the durable record: blank optional fields are null, and the
    // notification is recorded as sent. Nothing about the request is stored.
    await expect.poll(() => storedLeads(email)[0]?.notification_status).toBe('sent')
    const [lead] = storedLeads(email)
    expect(lead).toMatchObject({
      locale: 'en',
      name: 'Dana Example',
      email,
      phone: '050-1234567',
      kind: 'landing',
      description,
      business: null,
      link: null,
      timeline: 'asap',
      status: 'new',
    })
    expect(lead!.notification_sent_at).toEqual(expect.any(String))
    expect(lead!.dedupe_key).toMatch(/^id:/)
    expect(Object.keys(lead!).sort()).toEqual(
      [
        'business',
        'created_at',
        'dedupe_key',
        'description',
        'email',
        'id',
        'kind',
        'link',
        'locale',
        'name',
        'notification_sent_at',
        'notification_status',
        'phone',
        'status',
        'timeline',
        'updated_at',
      ].sort(),
    )
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
    expect(storedLeads(email)).toHaveLength(1)
    expect(storedLeads(email)[0]!.locale).toBe('he')
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
    await expect(page.locator('#contact-description')).toHaveValue(description)
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
    await expect(page.locator('#contact-phone')).toHaveAttribute('dir', 'ltr')
    for (const id of ['#contact-name', '#contact-description', '#contact-business'])
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

/**
 * Sends a form rendered without JavaScript exactly as the browser would: its own method,
 * encoding, action and fields (React's action references included), read from the page.
 * The browser's native POST navigation is not used: in CI's headless browser it leaves the
 * context unable to close, which hangs the test, not the site. The server's answer is then
 * shown in the same no-JavaScript page for the assertions.
 */
async function submitNatively(page: Page) {
  const form = await page.locator('form').evaluate((el: HTMLFormElement) => ({
    action: el.action,
    method: el.method,
    enctype: el.enctype,
    noValidate: el.noValidate,
    entries: [...new FormData(el)].map(([key, value]) => [key, String(value)] as const),
  }))
  // Without JavaScript this is a plain multipart POST to the page itself.
  expect(form.method).toBe('post')
  expect(form.enctype).toBe('multipart/form-data')
  expect(new URL(form.action).pathname).toBe(new URL(page.url()).pathname)
  expect(form.noValidate).toBe(false) // the browser's own required checks still apply
  expect(form.entries.some(([key]) => key.startsWith('$ACTION'))).toBe(true)
  const response = await page.request.post(form.action, {
    multipart: Object.fromEntries(form.entries),
    headers: { Origin: new URL(page.url()).origin },
  })
  expect(response.status()).toBe(200)
  await page.setContent(await response.text(), { waitUntil: 'domcontentloaded' })
}

test.describe('project inquiry without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('sends, and the server renders the success state', async ({ page }) => {
    const email = uniqueEmail('nojs')
    await openRendered(page, '/en/contact')
    await fillRequired(page, email)
    await page.getByLabel('Phone (optional)', { exact: true }).fill('+972 50 123 4567')
    await submitNatively(page)
    await expect(page.getByRole('heading', { level: 1, name: 'Got it.' })).toBeVisible()
    await expect(page.locator('form')).toHaveCount(0)
    await expect.poll(() => deliveredTo(email).length).toBe(1)
    expect(deliveredTo(email)[0]!.values).toMatchObject({ phone: '+972 50 123 4567', description })
    // Without JavaScript there is no submission id: the key is the sender and message.
    expect(storedLeads(email)).toHaveLength(1)
    expect(storedLeads(email)[0]!.dedupe_key).toMatch(/^hash:[0-9a-f]{64}$/)
  })

  test('shows the server’s errors with the values kept', async ({ page }) => {
    const email = uniqueEmail('nojs-invalid')
    await openRendered(page, '/he/contact')
    await fillRequired(page, email, 'he')
    // The browser has no rule for a phone number; the server does.
    await page.getByLabel('טלפון (רשות)', { exact: true }).fill('אפשר להתקשר')
    await submitNatively(page)
    await expect(page.locator('[aria-labelledby="contact-summary-title"]')).toContainText(
      'מספר הטלפון לא נראה תקין. למשל: 050-1234567.',
    )
    await expect(page.locator('#contact-phone')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#contact-phone')).toHaveAttribute(
      'aria-describedby',
      /contact-phone-error/,
    )
    await expect(page.locator('#contact-name')).toHaveValue('Dana Example')
    await expect(page.locator('#contact-email')).toHaveValue(email)
    await expect(page.locator('#contact-description')).toHaveValue(description)
    await expect(page.locator('#contact-phone')).toHaveValue('אפשר להתקשר')
    expect(deliveredTo(email)).toEqual([])
    expect(storedLeads(email)).toEqual([])
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
