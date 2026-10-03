import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { openRendered } from '../support/navigation'

const pages = [
  '/en',
  '/he',
  '/en/work/on',
  '/he/work/mi-ma-mo',
  '/en/system',
  '/he/system',
  '/en/system/scenes',
  '/he/system/scenes',
  '/en/privacy',
  '/he/privacy',
  '/en/accessibility',
  '/he/accessibility',
]

test.describe('locale routing', () => {
  test('/ opens the Hebrew site with one server-side redirect, whatever the browser language', async ({
    browser,
  }) => {
    for (const locale of ['en-US', 'he-IL', 'fr-FR']) {
      const context = await browser.newContext({ locale })
      try {
        // The server answers / with a redirect and no document: nothing renders in English first.
        const direct = await context.request.get('/', { maxRedirects: 0 })
        expect(direct.status()).toBe(307)
        expect(new URL(direct.headers()['location']!, 'http://x').pathname).toBe('/he')
        expect(direct.headers()['vary']).toContain('Cookie')

        const page = await context.newPage()
        const response = await page.goto('/')
        await expect(page).toHaveURL(/\/he$/)
        expect(response?.status()).toBe(200)
        expect(response?.request().redirectedFrom()?.redirectedFrom()).toBeNull()
        await expect(page.locator('html')).toHaveAttribute('lang', 'he')
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

        await page.goto('/work/on')
        await expect(page).toHaveURL(/\/he\/work\/on$/)
      } finally {
        await context.close()
      }
    }
  })

  test('direct visits to prefixed routes render without any redirect', async ({ page }) => {
    const routes = [
      ['/he', 'he'],
      ['/en', 'en'],
      ['/he/work/on', 'he'],
      ['/en/work/on', 'en'],
      ['/he/work/mi-ma-mo', 'he'],
      ['/en/work/mi-ma-mo', 'en'],
      ['/he/contact', 'he'],
      ['/en/privacy', 'en'],
      ['/he/accessibility', 'he'],
    ] as const
    for (const [path, lang] of routes) {
      const direct = await page.request.get(path, { maxRedirects: 0 })
      expect(direct.status(), path).toBe(200)

      const response = await page.goto(path)
      expect(response?.request().redirectedFrom(), path).toBeNull()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${path}$`),
      )
    }
  })

  test('an explicit locale cookie wins over the Hebrew default', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'he-IL' })
    try {
      await context.addCookies([
        { name: 'NEXT_LOCALE', value: 'en', url: test.info().project.use.baseURL! },
      ])
      const page = await context.newPage()
      await page.goto('/')
      await expect(page).toHaveURL(/\/en$/)
      await page.goto('/work/mi-ma-mo')
      await expect(page).toHaveURL(/\/en\/work\/mi-ma-mo$/)
    } finally {
      await context.close()
    }
  })

  test('switching language works both ways and is remembered for /', async ({ page }) => {
    const switchTo = (code: 'EN' | 'HE') =>
      page
        .getByRole('banner')
        .getByRole('group')
        .getByRole('link', { name: new RegExp(`^${code}`) })
        .click()

    await page.goto('/')
    await expect(page).toHaveURL(/\/he$/)

    await switchTo('EN')
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await page.goto('/')
    await expect(page).toHaveURL(/\/en$/)

    await switchTo('HE')
    await expect(page).toHaveURL(/\/he$/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await page.goto('/')
    await expect(page).toHaveURL(/\/he$/)
  })

  test('sets document language and direction', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await page.goto('/he')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('the language switch keeps the current page', async ({ page }) => {
    await page.goto('/en/work/on')
    await page
      .getByRole('banner')
      .getByRole('group', { name: 'Switch language' })
      .getByRole('link', { name: /^HE/ })
      .click()
    await expect(page).toHaveURL(/\/he\/work\/on$/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('publishes hreflang alternates', async ({ page }) => {
    await page.goto('/he/work/on')
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      /\/en\/work\/on$/,
    )
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      /\/he\/work\/on$/,
    )
  })

  test('unknown pages return 404 in their own language, complete without JavaScript', async ({
    browser,
  }) => {
    const cases = [
      { url: '/en/work/does-not-exist', lang: 'en', title: 'Page not found' },
      { url: '/en/nothing-here', lang: 'en', title: 'Page not found' },
      { url: '/he/work/does-not-exist', lang: 'he', title: 'העמוד לא נמצא' },
      { url: '/he/nothing/here', lang: 'he', title: 'העמוד לא נמצא' },
    ]
    for (const javaScriptEnabled of [true, false]) {
      const context = await browser.newContext({ javaScriptEnabled })
      try {
        const page = await context.newPage()
        for (const { url, lang, title } of cases) {
          const response = await page.goto(url)
          expect(response?.status(), url).toBe(404)
          await expect(page.locator('html')).toHaveAttribute('lang', lang)
          await expect(page.locator('html')).toHaveAttribute('dir', lang === 'he' ? 'rtl' : 'ltr')
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
          // Inside the site: its header (with the brand) and footer, in the same language.
          await expect(page.getByRole('banner').locator('[data-mark]').first()).toBeAttached()
          await expect(page.getByRole('contentinfo')).toBeVisible()
          await expect(
            page.getByRole('link', {
              name: title === 'Page not found' ? 'Back to the homepage' : 'חזרה לדף הבית',
            }),
          ).toHaveAttribute('href', `/${lang}`)
        }
      } finally {
        await context.close()
      }
    }
  })

  test('URLs outside any locale get the bilingual 404, signed with the wordmark', async ({
    page,
  }) => {
    const response = await page.goto('/xx/missing.html')
    expect(response?.status()).toBe(404)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'העמוד לא נמצא' })).toBeVisible()
    // The wordmark leads home; the copy sits clear of it.
    const home = page.getByRole('link', { name: 'MARTIN.G' })
    await expect(home).toBeVisible()
    const mark = await home.boundingBox()
    const title = await page.getByRole('heading', { level: 1 }).boundingBox()
    expect(title!.y).toBeGreaterThan(mark!.y + mark!.height + 48)
  })
})

test.describe('confidential work', () => {
  test('has no routes', async ({ page }) => {
    for (const url of ['/en/work/confidential-01', '/he/work/confidential-02']) {
      const response = await page.goto(url)
      expect(response?.status()).toBe(404)
    }
  })

  test('renders only sanitized, unlinked summaries', async ({ page }) => {
    await page.goto('/en')
    const section = page.getByRole('region', { name: 'Defense Systems' })
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(2)
    await expect(section.getByRole('link')).toHaveCount(0)
    await expect(section.getByText('03', { exact: true })).toBeVisible()
    await expect(section.getByText('04', { exact: true })).toBeVisible()
    await expect(section.locator('img, video, picture, iframe')).toHaveCount(0)
  })

  test('is framed as defense systems, truthfully, in both locales', async ({ page }) => {
    for (const [path, title] of [
      ['/en', 'Defense Systems'],
      ['/he', 'מערכות ביטחוניות'],
    ] as const) {
      await page.goto(path)
      const section = page.getByRole('region', { name: title })
      await expect(section).toBeVisible()
      // Not interactive: nothing inside takes focus.
      await expect(section.locator('a, button, input, [tabindex]')).toHaveCount(0)
      // No pretend access control or classified language.
      const text = (await section.innerText()).toLowerCase()
      for (const term of [
        'classified',
        'top secret',
        'clearance',
        'access denied',
        'סודי',
        'מסווג',
      ])
        expect(text).not.toContain(term)
    }
    await page.goto('/en')
    const titles = page.locator('#confidential h3')
    await expect(titles).toHaveText([
      'Confidential Operational System',
      'Confidential Operational Platform',
    ])
  })

  test('continues the project numbering after routed work', async ({ page }) => {
    await page.goto('/he')
    const projects = page.locator('#work').getByRole('article')
    await expect(projects).toHaveCount(2)
    await expect(projects.nth(0).getByText('01', { exact: true }).first()).toBeVisible()
    await expect(projects.nth(1).getByText('02', { exact: true }).first()).toBeVisible()
  })

  test('is absent from the sitemap', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text()
    expect(body).toContain('/en/work/on')
    expect(body).toMatch(/hreflang="x-default"\s+href="[^"]*\/he\/work\/on"/)
    expect(body).not.toContain('confidential')
  })
})

test.describe('accessibility foundation', () => {
  for (const url of pages) {
    test(`no axe violations on ${url}`, async ({ page }) => {
      await page.goto(url)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }

  test('skip link is the first focus stop and moves focus to main', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation')
    await page.goto('/en')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })

  test('has one h1 and labelled landmarks', async ({ page }) => {
    for (const url of ['/en', '/he']) {
      await page.goto(url)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.getByRole('banner')).toHaveCount(1)
      await expect(page.getByRole('main')).toHaveCount(1)
      await expect(page.getByRole('contentinfo')).toHaveCount(1)
      // The header's primary navigation and the footer's.
      await expect(page.getByRole('navigation')).toHaveCount(2)
    }
  })

  test('the hero heading is the visible headline, introduced by the brand name', async ({
    page,
  }) => {
    for (const [url, principle] of [
      ['/he', 'מבעיה למוצר.'],
      ['/en', 'From problem to product.'],
    ] as const) {
      await page.goto(url)
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveAccessibleName(`MARTIN.G: ${principle}`)
      await expect(h1).toBeVisible()
      // The hero no longer repeats the wordmark: the header carries it.
      await expect(page.locator('main [data-mark]')).toHaveCount(0)
    }
  })

  test('content is visible without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      await openRendered(page, '/en')
      await expect(page.getByRole('heading', { name: 'Selected Work' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'ON', exact: true, level: 3 })).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('reduced motion keeps all content visible', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await page.goto('/he')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('[data-reveal]:not([data-revealed])')).toHaveCount(0)
    } finally {
      await context.close()
    }
  })
})

test.describe('brand and layout', () => {
  test('wordmark on desktop and tablet, monogram on compact mobile', async ({ page, isMobile }) => {
    await page.goto('/en')
    const header = page.getByRole('banner')
    const wordmark = header.locator('[data-mark="wordmark"]')
    const monogram = header.locator('[data-mark="monogram"]')
    if (isMobile) {
      await expect(wordmark).toBeHidden()
      await expect(monogram).toBeVisible()
    } else {
      await expect(wordmark).toBeVisible()
      await expect(monogram).toBeHidden()
    }
  })

  test('uses 4, 8 and 12 columns', async ({ page }) => {
    for (const [width, cols] of [
      [390, '4'],
      [900, '8'],
      [1440, '12'],
    ] as const) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/en')
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--cols').trim(),
      )
      expect(value).toBe(cols)
    }
  })

  test('mirrors layout in RTL', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop header geometry')
    for (const [url, brandOnStart] of [
      ['/en', true],
      ['/he', false],
    ] as const) {
      await page.goto(url)
      const width = page.viewportSize()!.width
      const box = await page.getByRole('banner').getByRole('link').first().boundingBox()
      expect(box).not.toBeNull()
      const onLeft = box!.x + box!.width / 2 < width / 2
      expect(onLeft).toBe(brandOnStart)
    }
  })

  test('serves icons and security headers', async ({ request }) => {
    for (const url of [
      '/icon.png',
      '/icon.svg',
      '/apple-icon.png',
      '/favicon.ico',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/maskable-512.png',
    ]) {
      expect((await request.get(url)).status(), url).toBe(200)
    }
    const manifest = await (await request.get('/manifest.webmanifest')).json()
    expect(manifest).toMatchObject({ name: 'MARTIN.G', short_name: 'MARTIN.G' })
    expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toEqual([
      'any',
      'any',
      'maskable',
    ])
    const response = await request.get('/en')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(response.headers()['x-powered-by']).toBeUndefined()
  })

  test('ships no JavaScript source maps', async ({ page, request }) => {
    const scripts: string[] = []
    page.on('response', (r) => {
      if (r.url().endsWith('.js')) scripts.push(r.url())
    })
    await page.goto('/en')
    expect(scripts.length).toBeGreaterThan(0)
    for (const url of scripts) {
      expect((await request.get(`${url}.map`)).status()).toBe(404)
    }
  })
})
