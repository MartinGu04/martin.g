import { expect, test, type Page } from '@playwright/test'

/** Walks the whole page so lazy images load and reveals settle, then returns to the top. */
async function walk(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 40))
    }
  })
}

test.describe('real project showcase', () => {
  test('the second project is presented as המחלבה in both locales, on its unchanged route', async ({
    page,
  }) => {
    for (const locale of ['en', 'he']) {
      await page.goto(`/${locale}`)
      const title = page.locator('#mi-ma-mo-title')
      await expect(title).toHaveText('המחלבה')
      await expect(title.locator('bdi')).toHaveAttribute('lang', 'he')
      await expect(title.locator('bdi')).toHaveAttribute('dir', 'rtl')
      await expect(title.getByRole('link')).toHaveAttribute('href', `/${locale}/work/mi-ma-mo`)
      await expect(page.locator('#work ol')).toContainText('המחלבה')
      expect(await page.locator('main').innerText()).not.toMatch(/mi-ma-mo/i)
    }
    await page.goto('/en/work/mi-ma-mo')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('המחלבה')
    await expect(page).toHaveTitle(/המחלבה/)
  })

  test('ON offers its project page first and its live site second, safely', async ({ page }) => {
    for (const [locale, view, live] of [
      ['en', 'View project', 'Visit live site'],
      ['he', 'לפרויקט', 'לאתר החי'],
    ] as const) {
      await page.goto(`/${locale}`)
      const scene = page.locator('#on')
      const links = scene.locator('a[href]')
      const primary = scene.getByRole('link', { name: new RegExp(`^${view}`) })
      const secondary = scene.getByRole('link', { name: new RegExp(`^${live}`) })
      await expect(primary).toHaveAttribute('href', `/${locale}/work/on`)
      await expect(secondary).toHaveAttribute('href', 'https://www.onbyortal.com/')
      await expect(secondary).toHaveAttribute('target', '_blank')
      await expect(secondary).toHaveAttribute('rel', /noopener/)
      await expect(secondary).toHaveAttribute('rel', /noreferrer/)
      // The accessible name says it leaves the site in a new tab.
      expect(await secondary.getAttribute('target')).toBe('_blank')
      await expect(secondary).toContainText(locale === 'en' ? 'new tab' : 'בלשונית חדשה')
      // Primary before secondary in the reading order; screenshots are not links.
      const order = await links.evaluateAll((els) => els.map((a) => a.getAttribute('href')))
      expect(order.indexOf(`/${locale}/work/on`)).toBeLessThan(
        order.indexOf('https://www.onbyortal.com/'),
      )
      await expect(scene.locator('a img')).toHaveCount(1) // the ON title mark only
    }
    await page.goto('/en/work/on')
    await expect(page.getByRole('link', { name: /^Visit live site/ })).toHaveAttribute(
      'href',
      'https://www.onbyortal.com/',
    )
  })

  test('המחלבה has no live-site link anywhere: it is not a public destination', async ({
    page,
  }) => {
    for (const url of ['/en', '/he', '/en/work/mi-ma-mo', '/he/work/mi-ma-mo']) {
      await page.goto(url)
      const scope = url.includes('/work/') ? page.locator('main') : page.locator('#mi-ma-mo')
      const external = await scope
        .locator('a[href^="http"]')
        .evaluateAll((els) => els.map((a) => a.getAttribute('href')))
      expect(external, url).toEqual([])
    }
  })

  test('every external link is https, opens safely and is identifiable', async ({ page }) => {
    for (const url of ['/en', '/he', '/en/work/on', '/he/work/on']) {
      await page.goto(url)
      const links = await page.locator('a[href^="http"]').evaluateAll((els) =>
        els.map((a) => ({
          href: a.getAttribute('href') ?? '',
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel') ?? '',
          text: (a as HTMLElement).innerText,
        })),
      )
      for (const link of links) {
        expect(() => new URL(link.href), link.href).not.toThrow()
        expect(new URL(link.href).protocol).toBe('https:')
        expect(link.target).toBe('_blank')
        expect(link.rel).toContain('noopener')
        expect(link.rel).toContain('noreferrer')
      }
    }
  })

  test('real media carries alt text, intrinsic sizes and no layout shift', async ({ page }) => {
    await page.goto('/en')
    await page.evaluate(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          value: number
          hadRecentInput: boolean
        }[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await walk(page)
    for (const scene of ['#on', '#mi-ma-mo', '[aria-labelledby="about-title"]']) {
      const images = await page.locator(`${scene} img`).evaluateAll((els) =>
        els.map((img) => ({
          alt: img.getAttribute('alt'),
          width: img.getAttribute('width'),
          height: img.getAttribute('height'),
          src: img.getAttribute('src') ?? '',
        })),
      )
      expect(images.length, scene).toBeGreaterThan(0)
      for (const img of images) {
        expect(img.alt?.trim(), `${scene} ${img.src}`).toBeTruthy()
        expect(Number(img.width)).toBeGreaterThan(0)
        expect(Number(img.height)).toBeGreaterThan(0)
        // Optimized by Next, never the source file.
        expect(img.src).toMatch(/^\/_next\/image\?/)
      }
    }
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    expect(cls).toBeLessThan(0.05)
  })

  test('only the above-the-fold image of a page is fetched eagerly', async ({ page }) => {
    await page.goto('/en')
    const eager = await page
      .locator('img')
      .evaluateAll((els) => els.filter((img) => img.getAttribute('loading') !== 'lazy').length)
    // The homepage opens on type: its only eager image is none (marks are CSS masks).
    expect(eager).toBe(0)
    await page.goto('/en/work/on')
    const first = page.locator('main img').first()
    await expect(first).not.toHaveAttribute('loading', 'lazy')
  })

  test('art direction serves a phone screen on phones, not a shrunken desktop', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    await walk(page)
    const site = page.locator('#on picture img')
    await site.scrollIntoViewIfNeeded()
    await expect
      .poll(() => site.evaluate((img: HTMLImageElement) => img.currentSrc))
      .toMatch(isMobile ? /site-mobile/ : /site-home/)
    const dashboard = page.locator('#mi-ma-mo figure').first()
    if (isMobile) await expect(dashboard).toBeHidden()
    else await expect(dashboard).toBeVisible()
  })

  test('Restricted Work stays text and generated geometry only', async ({ page }) => {
    for (const locale of ['en', 'he']) {
      await page.goto(`/${locale}`)
      const scene = page.locator('#confidential')
      await expect(scene.locator('img, picture, video, svg image')).toHaveCount(0)
      await expect(scene.locator('a')).toHaveCount(0)
    }
  })
})

test.describe('preview film', () => {
  test('plays only through its own control, with download and casting removed', async ({
    page,
  }) => {
    await page.goto('/en/work/on')
    const video = page.locator('video')
    await expect(video).toHaveCount(1)
    await expect(video).not.toHaveAttribute('controls', /.*/)
    await expect(video).not.toHaveAttribute('autoplay', /.*/)
    await expect(video).toHaveAttribute('controlslist', /nodownload/)
    await expect(video).toHaveAttribute('controlslist', /noremoteplayback/)
    await expect(video).toHaveAttribute('disablepictureinpicture', '')
    await expect(video).toHaveAttribute('preload', 'none')
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true)

    // The media URL is never printed or linked.
    expect(await page.locator('main').innerText()).not.toContain('.mp4')
    await expect(page.locator('a[href*=".mp4"], a[download]')).toHaveCount(0)

    // Context menu and dragging are refused on the picture.
    const blocked = await page.locator('figure:has(video) > div').evaluate((stage) => {
      const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
      const drag = new DragEvent('dragstart', { bubbles: true, cancelable: true })
      stage.querySelector('video')!.dispatchEvent(menu)
      stage.querySelector('video')!.dispatchEvent(drag)
      return [menu.defaultPrevented, drag.defaultPrevented]
    })
    expect(blocked).toEqual([true, true])

    // One keyboard-operable control with a visible focus ring.
    const control = page.getByRole('button', { name: 'Play the brand film preview' })
    await control.focus()
    expect(
      await control.evaluate((el) => getComputedStyle(el).outlineStyle !== 'none'),
    ).toBeTruthy()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Pause the brand film preview' })).toBeVisible()
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true)
    await page.keyboard.press('Enter')
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
  })

  test('without JavaScript there is a poster and no video, so no native controls', async ({
    browser,
    request,
  }) => {
    const html = await (await request.get('/en/work/on')).text()
    // No <video> element in the server HTML. (Its URL still travels in the page data for
    // the player: a browser must receive a file to play it, see PreviewVideo.)
    expect(html).not.toContain('<video')
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/en/work/on')
    await expect(page.locator('video')).toHaveCount(0)
    await expect(
      page.locator('figure:has(figcaption:text("Watermarked preview")) img'),
    ).toHaveCount(1)
    await context.close()
  })

  test('the Hebrew page labels the control in Hebrew', async ({ page }) => {
    await page.goto('/he/work/on')
    await expect(
      page.getByRole('button', { name: 'הפעלת התצוגה המקדימה של סרט המותג' }),
    ).toBeVisible()
  })
})
