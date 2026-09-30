import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const pages = [
  '/en',
  '/he',
  '/en/work/on',
  '/he/work/mi-ma-mo',
  '/en/system',
  '/he/system',
  '/en/system/scenes',
  '/he/system/scenes',
]

test.describe('locale routing', () => {
  test('/ opens the Hebrew site with one server-side redirect, whatever the browser language', async ({
    browser,
  }) => {
    for (const locale of ['en-US', 'he-IL', 'fr-FR']) {
      const context = await browser.newContext({ locale })

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
      await context.close()
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
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', url: test.info().project.use.baseURL! },
    ])
    const page = await context.newPage()
    await page.goto('/')
    await expect(page).toHaveURL(/\/en$/)
    await page.goto('/work/mi-ma-mo')
    await expect(page).toHaveURL(/\/en\/work\/mi-ma-mo$/)
    await context.close()
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

  test('unknown pages return 404', async ({ page }) => {
    for (const url of ['/en/work/does-not-exist', '/en/nothing-here']) {
      const response = await page.goto(url)
      expect(response?.status()).toBe(404)
    }
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
    const section = page.getByRole('region', { name: 'Selected Confidential Work' })
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(2)
    await expect(section.getByRole('link')).toHaveCount(0)
    await expect(section.getByText('03', { exact: true })).toBeVisible()
    await expect(section.getByText('04', { exact: true })).toBeVisible()
    await expect(section.locator('img, video, picture, iframe')).toHaveCount(0)
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
      await expect(page.getByRole('navigation')).toHaveCount(1)
    }
  })

  test('the hero heading exposes the brand name as text', async ({ page }) => {
    await page.goto('/he')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('MARTIN.G')
  })

  test('content is visible without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/en')
    await expect(page.getByRole('heading', { name: 'Selected Work' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'ON', exact: true, level: 3 })).toBeVisible()
    await context.close()
  })

  test('reduced motion keeps all content visible', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/he')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-reveal]:not([data-revealed])')).toHaveCount(0)
    await context.close()
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
    for (const url of ['/icon.png', '/apple-icon.png', '/favicon.ico']) {
      expect((await request.get(url)).status()).toBe(200)
    }
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
