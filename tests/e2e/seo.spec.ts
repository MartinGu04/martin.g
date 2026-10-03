import type { APIRequestContext } from '@playwright/test'
import { expect, test } from '../support/test'

/** Every URL the sitemap publishes, as a path (the built origin is the configured one). */
async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const body = await (await request.get('/sitemap.xml')).text()
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]!).pathname)
}

const path = (href: string | null) => (href ? new URL(href).pathname : null)

test.describe('search and social metadata', () => {
  // Request-level checks of server-rendered HTML: one device is enough.
  test.skip(({ isMobile }) => isMobile, 'device-independent')

  test('every sitemap page is complete, self-canonical and paired with its translation', async ({
    page,
    request,
  }) => {
    const paths = await sitemapPaths(request)
    expect(paths.length).toBeGreaterThan(0)
    const titles = new Set<string>()
    const descriptions = new Map<string, string>()

    for (const pagePath of paths) {
      const locale = pagePath.split('/')[1]!
      const rest = pagePath.slice(locale.length + 1)
      const response = await page.goto(pagePath)
      expect(response?.status(), pagePath).toBe(200)

      const head = page.locator('head')
      await expect(page.locator('html'), pagePath).toHaveAttribute('lang', locale)
      await expect(head.locator('meta[name="robots"]'), pagePath).toHaveCount(0)

      const title = await page.title()
      expect(title, pagePath).not.toBe('')
      // Unique within a locale (the homepage's title is the brand name in both).
      expect(titles.has(`${locale}:${title}`), `${pagePath}: duplicate title`).toBe(false)
      titles.add(`${locale}:${title}`)
      const description = await head.locator('meta[name="description"]').getAttribute('content')
      expect(description?.trim(), pagePath).toBeTruthy()
      descriptions.set(pagePath, description!)

      const canonical = await head.locator('link[rel="canonical"]').getAttribute('href')
      expect(path(canonical), pagePath).toBe(pagePath)
      const alternate = (lang: string) =>
        head.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute('href')
      expect(path(await alternate('en')), pagePath).toBe(`/en${rest}`)
      expect(path(await alternate('he')), pagePath).toBe(`/he${rest}`)
      expect(path(await alternate('x-default')), pagePath).toBe(`/he${rest}`)

      const og = (property: string) =>
        head.locator(`meta[property="og:${property}"]`).first().getAttribute('content')
      expect(path(await og('url')), pagePath).toBe(pagePath)
      expect(await og('title'), pagePath).toBe(title)
      expect(await og('description'), pagePath).toBe(description)
      expect(await og('site_name'), pagePath).toBe('MARTIN.G')
      expect(await og('locale'), pagePath).toBe(locale === 'he' ? 'he_IL' : 'en_US')
      expect(await og('locale:alternate'), pagePath).toBe(locale === 'he' ? 'en_US' : 'he_IL')
      const card = await head.locator('meta[name="twitter:card"]').getAttribute('content')
      const image = await head.locator('meta[property="og:image"]').count()
      expect(card, pagePath).toBe(image > 0 ? 'summary_large_image' : 'summary')
    }

    // Each locale describes each page in its own words.
    for (const [pagePath, description] of descriptions) {
      if (!pagePath.startsWith('/he')) continue
      expect(descriptions.get(pagePath.replace(/^\/he/, '/en')), pagePath).not.toBe(description)
    }
  })

  test('case studies share an approved image that resolves', async ({ page, request }) => {
    for (const pagePath of ['/he/work/on', '/en/work/mi-ma-mo']) {
      await page.goto(pagePath)
      const image = await page.locator('meta[property="og:image"]').getAttribute('content')
      expect(image, pagePath).toBeTruthy()
      const response = await request.get(new URL(image!).pathname)
      expect(response.status(), pagePath).toBe(200)
      expect(response.headers()['content-type'], pagePath).toMatch(/^image\//)
      await expect(page.locator('meta[property="og:image:alt"]')).not.toHaveAttribute('content', '')
    }
  })

  test('the homepage describes the site and the person in structured data', async ({ page }) => {
    for (const locale of ['he', 'en'] as const) {
      await page.goto(`/${locale}`)
      const blocks = page.locator('script[type="application/ld+json"]')
      await expect(blocks).toHaveCount(1)
      const data = JSON.parse((await blocks.textContent()) ?? '')
      const types = data['@graph'].map((node: { '@type': string }) => node['@type'])
      expect(types).toEqual(['WebSite', 'Person'])
      expect(data['@graph'][0]).toMatchObject({ name: 'MARTIN.G', inLanguage: locale })
      expect(path(data['@graph'][0].url)).toBe(`/${locale}`)
      expect(data['@graph'][1]).toMatchObject({ name: 'Martin Gusin' })
    }
  })

  test('a build outside Vercel production is closed to crawlers', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toMatch(/User-Agent: \*\s+Disallow: \/\s*$/)
    expect(robots).not.toContain('Sitemap:')
    for (const pagePath of ['/he', '/en/contact']) {
      const response = await request.get(pagePath)
      expect(response.headers()['x-robots-tag'], pagePath).toBe('noindex, nofollow')
    }
  })

  test('the homepage has a search title in each locale; the visible hero is unchanged', async ({
    page,
  }) => {
    for (const [locale, title] of [
      ['he', 'MARTIN.G · בניית מוצרים דיגיטליים'],
      ['en', 'MARTIN.G · Product Builder'],
    ] as const) {
      await page.goto(`/${locale}`)
      await expect(page).toHaveTitle(title)
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title)
      // The title is metadata only: it never appears in the page itself.
      expect(await page.locator('body').innerText()).not.toContain(title)
      // The site's name in structured data stays the brand alone.
      const data = JSON.parse(
        (await page.locator('script[type="application/ld+json"]').textContent()) ?? '',
      )
      expect(data['@graph'][0].name).toBe('MARTIN.G')
    }
  })

  test('each locale shares its own site card; case studies keep their own image', async ({
    page,
    request,
  }) => {
    const cards: Record<string, string> = {}
    for (const [locale, alt] of [
      ['he', 'MARTIN.G: מבעיה למוצר.'],
      ['en', 'MARTIN.G: From problem to product.'],
    ] as const) {
      for (const pagePath of ['', '/contact', '/privacy', '/accessibility']) {
        const url = `/${locale}${pagePath}`
        await page.goto(url)
        const og = (property: string) =>
          page.locator(`meta[property="og:${property}"]`).getAttribute('content')
        const image = (await og('image'))!
        expect(image, url).toMatch(
          new RegExp(`/_next/static/media/martin-g-${locale}\\.[\\w-]+\\.png$`),
        )
        expect(await og('image:width'), url).toBe('1200')
        expect(await og('image:height'), url).toBe('630')
        expect(await og('image:alt'), url).toBe(alt)
        await expect(page.locator('meta[name="twitter:card"]'), url).toHaveAttribute(
          'content',
          'summary_large_image',
        )
        await expect(page.locator('meta[name="twitter:image"]'), url).toHaveAttribute(
          'content',
          image,
        )
        cards[locale] ??= image
        expect(image, url).toBe(cards[locale])
      }
      const response = await request.get(new URL(cards[locale]!).pathname)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toBe('image/png')
      const png = await response.body()
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
    }
    expect(cards.he).not.toBe(cards.en)

    for (const [url, source] of [
      ['/he/work/on', /site-home/],
      ['/en/work/mi-ma-mo', /dashboard/],
    ] as const) {
      await page.goto(url)
      await expect(page.locator('meta[property="og:image"]'), url).toHaveAttribute(
        'content',
        source,
      )
    }
  })

  test('theme-color matches the page background and the manifest', async ({ page, request }) => {
    // The served value. Once running, HeaderWorld retints it to each scene's --surface-0.
    const html = await (await request.get('/he/contact')).text()
    expect(html).toContain('<meta name="theme-color" content="#060606"/>')
    await page.goto('/he/contact')
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(background).toBe('rgb(6, 6, 6)')
    const manifest = await (await request.get('/manifest.webmanifest')).json()
    expect(manifest).toMatchObject({ theme_color: '#060606', background_color: '#060606' })
  })

  test('security headers outside production: baseline, no HSTS, no upgrade', async ({
    request,
  }) => {
    for (const pagePath of ['/he', '/en/work/on', '/sitemap.xml']) {
      const headers = (await request.get(pagePath)).headers()
      expect(headers['x-content-type-options'], pagePath).toBe('nosniff')
      expect(headers['referrer-policy'], pagePath).toBe('strict-origin-when-cross-origin')
      expect(headers['x-frame-options'], pagePath).toBe('DENY')
      expect(headers['cross-origin-opener-policy'], pagePath).toBe('same-origin')
      expect(headers['permissions-policy'], pagePath).toContain('browsing-topics=()')
      expect(headers['permissions-policy'], pagePath).not.toContain('interest-cohort')
      expect(headers['strict-transport-security'], pagePath).toBeUndefined()
      expect(headers['content-security-policy'], pagePath).not.toContain(
        'upgrade-insecure-requests',
      )
    }
  })

  test('the noindex specimen claims no canonical URL of another page', async ({ page }) => {
    await page.goto('/he/system')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0)
  })
})
