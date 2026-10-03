import { expect, test, type Page } from '@playwright/test'
import { openRendered } from '../support/navigation'

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
      await expect(page.locator('#work ol').first()).toContainText('המחלבה')
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
    // The case study offers the live site where it opens and where it closes.
    await page.goto('/en/work/on')
    const live = page.getByRole('link', { name: /^Visit live site/ })
    expect(await live.count()).toBeGreaterThan(0)
    for (const link of await live.all())
      await expect(link).toHaveAttribute('href', 'https://www.onbyortal.com/')
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
      // Content images only: decorative layers (aria-hidden, empty alt) are checked apart.
      const images = await page.locator(`${scene} img`).evaluateAll((els) =>
        els
          .filter((img) => !img.closest('[aria-hidden="true"]'))
          .map((img) => ({
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

  test('art direction serves phone crops on phones, not shrunken desktops', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    await walk(page)
    // ON's proof is its website: the phone layout on phones, the desktop page elsewhere.
    const proof = page.locator('#on [data-fallback] picture img').first()
    // The garden drifts while visible, so the scene is never "stable": scroll it instead.
    await page.locator('#on').evaluate((el) => el.scrollIntoView())
    await expect
      .poll(() => proof.evaluate((img: HTMLImageElement) => img.currentSrc))
      .toMatch(isMobile ? /site-mobile/ : /site-home/)
    const productFrame = page.locator('#mi-ma-mo [data-fallback]')
    if (isMobile) await expect(productFrame).toBeHidden()
    else await expect(productFrame).toBeVisible()
  })

  test('Defense Systems: geometry, plus only the one approved blurred interface', async ({
    page,
  }) => {
    for (const locale of ['en', 'he']) {
      await page.goto(`/${locale}`)
      const scene = page.locator('#confidential')
      await expect(scene.locator('picture, video, svg image')).toHaveCount(0)
      await expect(scene.locator('a')).toHaveCount(0)
      // The approved asset only: optimized from its one file, never another image.
      const images = scene.locator('img')
      await expect(images).toHaveCount(1)
      const src = decodeURIComponent((await images.getAttribute('src')) ?? '')
      expect(src).toMatch(/\/_next\/static\/media\/confidential-01-interface\.[\w-]+\.webp&/)
      // A tighter frame, cover-cropped, nothing in it focusable.
      const fit = await images.evaluate((img) => getComputedStyle(img).objectFit)
      expect(fit).toBe('cover')
      // The other card keeps its generated geometry.
      await expect(scene.getByRole('listitem').nth(1).locator('svg')).not.toHaveCount(0)
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

  test('is an on-demand asset: fetched only once a visitor plays it', async ({ page }) => {
    const media: string[] = []
    page.on('request', (r) => {
      if (/\.(mp4|webm)(\?|$)/.test(r.url())) media.push(r.url())
    })
    // The homepage never requests it.
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    expect(media).toEqual([])

    // The ON case study: not on load, not when the player scrolls into view.
    await page.goto('/en/work/on')
    const video = page.locator('video')
    await video.scrollIntoViewIfNeeded()
    await page.waitForLoadState('networkidle')
    expect(media).toEqual([])
    expect(await video.evaluate((v: HTMLVideoElement) => v.buffered.length)).toBe(0)

    await page.getByRole('button', { name: 'Play the brand film preview' }).click()
    await expect.poll(() => media.length).toBeGreaterThan(0)
    expect(media.every((url) => new URL(url).pathname === '/media/on/film-preview.mp4')).toBe(true)
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
    try {
      const page = await context.newPage()
      // The server-rendered, styled page (see openRendered): not every image on it.
      await openRendered(page, '/en/work/on')
      await expect(page.locator('video')).toHaveCount(0)
      await expect(
        page.locator('figure:has(figcaption:text("Watermarked preview")) img'),
      ).toHaveCount(1)
    } finally {
      await context.close()
    }
  })

  test('the Hebrew page labels the control in Hebrew', async ({ page }) => {
    await page.goto('/he/work/on')
    await expect(
      page.getByRole('button', { name: 'הפעלת התצוגה המקדימה של סרט המותג' }),
    ).toBeVisible()
  })
})

test.describe('ambient motion', () => {
  const loops = (page: Page, scope: string) =>
    page.locator(scope).evaluate((root) =>
      root
        .getAnimations({ subtree: true })
        .filter(
          (a) => a instanceof CSSAnimation && a.effect?.getComputedTiming().iterations === Infinity,
        )
        .map((a) => a.playState),
    )

  test('loops run while their scene is visible and pause offscreen', async ({ page }) => {
    await page.goto('/en')
    for (const scene of ['#mi-ma-mo', '#confidential', '[aria-labelledby="process-title"]']) {
      await page.locator(scene).scrollIntoViewIfNeeded()
      await expect.poll(() => page.locator(scene).getAttribute('data-live')).toBe('')
      const states = await loops(page, scene)
      expect(states.length, scene).toBeGreaterThan(0)
      expect(new Set(states), scene).toEqual(new Set(['running']))
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => page.locator('#mi-ma-mo').getAttribute('data-live')).toBeNull()
    expect(new Set(await loops(page, '#mi-ma-mo'))).toEqual(new Set(['paused']))
  })

  test('the process advances on its own, without scrolling', async ({ page }) => {
    await page.goto('/he')
    const scene = page.locator('[aria-labelledby="process-title"]')
    await scene.scrollIntoViewIfNeeded()
    const current = () =>
      scene
        .locator('[aria-hidden="true"] .t-display')
        .evaluateAll((words) =>
          words.findIndex((w) => Number(getComputedStyle(w.parentElement!).opacity) > 0.5),
        )
    const first = await current()
    await expect.poll(current, { timeout: 8000 }).not.toBe(first)
  })

  test('with reduced motion nothing loops and every product view is set out', async ({
    browser,
    isMobile,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await page.goto('/en')
      await walk(page)
      const infinite = await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length,
      )
      expect(infinite).toBe(0)
      const views = page.locator('#mi-ma-mo [data-fallback="grid"] img')
      await expect(views).toHaveCount(3)
      // Phones show the phone and a legible Team Week crop instead of desktop screens.
      if (!isMobile) for (const view of await views.all()) await expect(view).toBeVisible()
      await expect(
        page.locator('[aria-labelledby="process-title"] [aria-hidden="true"] .t-display').first(),
      ).toBeHidden()
    } finally {
      await context.close()
    }
  })

  test('without JavaScript the process is its list and the views are all present', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      await openRendered(page, '/he')
      const steps = page.locator('[aria-labelledby="process-title"] ol h3')
      await expect(steps).toHaveCount(5)
      await expect(page.locator('#mi-ma-mo [data-fallback="grid"] img')).toHaveCount(3)
    } finally {
      await context.close()
    }
  })
})

test.describe('one story, many worlds', () => {
  test('pointing at a step makes it current, and the clock continues after', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'pointer exploration needs a fine pointer')
    await page.goto('/en')
    const scene = page.locator('[aria-labelledby="process-title"]')
    // Instant: the site scrolls smoothly, and a pointer placed mid-scroll ends up elsewhere.
    await scene.evaluate((el) => el.scrollIntoView({ behavior: 'instant' }))
    const current = () =>
      scene
        .locator('[aria-hidden="true"] .t-display')
        .evaluateAll((words) =>
          words.findIndex((w) => Number(getComputedStyle(w.parentElement!).opacity) > 0.5),
        )
    await scene.locator('ol > li').nth(3).hover()
    await expect.poll(current).toBe(3)
    await page.waitForTimeout(3600)
    expect(await current()).toBe(3)
    await page.mouse.move(0, 0)
    const states = await scene.evaluate((el) =>
      el.getAnimations({ subtree: true }).map((a) => a.playState),
    )
    expect(states).toContain('running')
  })

  test('each capability is a statement proven by work on the same page', async ({ page }) => {
    for (const locale of ['en', 'he']) {
      await page.goto(`/${locale}`)
      const items = page.locator('[aria-labelledby="capabilities-title"] ul > li')
      await expect(items).toHaveCount(6)
      for (const item of await items.all()) {
        await expect(item.getByRole('heading', { level: 3 })).toHaveCount(1)
        await expect(item.locator('p.t-body-l')).not.toBeEmpty()
        const links = item.getByRole('link')
        expect(await links.count()).toBeGreaterThan(0)
        for (const href of await links.evaluateAll((as) =>
          as.map((a) => a.getAttribute('href')!),
        )) {
          expect(href).toMatch(/^#/)
          await expect(page.locator(href)).toHaveCount(1)
        }
      }
    }
  })

  test('the thread carries each world into the next and resolves at the end', async ({ page }) => {
    await page.goto('/he')
    for (const scene of [
      '#on',
      '#mi-ma-mo',
      '#confidential',
      '[aria-labelledby="process-title"]',
      '[aria-labelledby="capabilities-title"]',
      '[aria-labelledby="about-title"]',
    ]) {
      const threads = page.locator(`${scene} [class*="thread"][aria-hidden="true"]`)
      await expect(threads, scene).toHaveCount(1)
    }
    // The closing line is drawn and still: no loop runs on it.
    const close = page.locator('[aria-labelledby="contact-title"] path[class*="resolve"]')
    await close.evaluate((el) => el.scrollIntoView())
    const infinite = await close.evaluate(
      (el) =>
        el.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations === Infinity)
          .length,
    )
    expect(infinite).toBe(0)
  })

  test('About reads as name, role, portrait and one authored statement', async ({ page }) => {
    await page.goto('/en')
    const about = page.locator('[aria-labelledby="about-title"]')
    await expect(about.getByText('Martin Gusin').first()).toBeVisible()
    await expect(about.getByText('Product Builder')).toBeVisible()
    await expect(about.locator('img')).toHaveCount(1)
    await expect(
      about.getByText('I don’t start with a screen. I start with the problem.'),
    ).toBeVisible()
  })
})

test.describe('exploration and polish', () => {
  test('Selected Work is three chapters, each with a glimpse of its world', async ({ page }) => {
    await page.goto('/he')
    const chapters = page.locator('#work ol').first().locator('> li')
    await expect(chapters).toHaveCount(3)
    for (const chapter of await chapters.all()) {
      const link = chapter.getByRole('link')
      await expect(link).toHaveAttribute('href', /^#/)
      await expect(chapter.locator('[aria-hidden="true"] :is(img, svg)').first()).toBeVisible()
    }
    // The Defense glimpse is still geometry: nothing loops outside an ambient scene.
    await expect(chapters.nth(2).locator('[data-loop]')).toHaveCount(0)
  })

  test('המחלבה fits one desktop viewport: title, statement, action, frame, phone, labels', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the one-viewport composition is the desktop layout')
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/he')
      const box = await page.locator('#mi-ma-mo').evaluate((scene) => {
        const rect = (sel: string) => scene.querySelector(sel)!.getBoundingClientRect()
        const parts = [
          rect('#mi-ma-mo-title'),
          rect('p.t-statement'),
          rect('[data-project-link]'),
          rect('[data-fallback]'),
          rect('figure'),
        ]
        const header = document.querySelector('header')!.getBoundingClientRect().height
        return {
          span: Math.max(...parts.map((r) => r.bottom)) - Math.min(...parts.map((r) => r.top)),
          room: innerHeight - header,
          frame: rect('[data-fallback]').width,
          phone: rect('figure').width,
        }
      })
      const at = `${viewport.width} x ${viewport.height}`
      expect(box.span, at).toBeLessThanOrEqual(box.room)
      expect(box.frame, at).toBeGreaterThan(viewport.width * 0.45)
      expect(box.phone, at).toBeGreaterThan(170)
    }
  })

  test('the main proof invites exploring the project, beside the explicit link', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    const scene = page.locator('#on')
    await expect(scene.getByRole('link', { name: /View project/ })).toBeVisible()
    const cover = scene.locator('a[aria-hidden="true"][tabindex="-1"]')
    await expect(cover).toHaveCount(1)
    await expect(cover).toHaveAttribute('href', '/en/work/on')
    if (isMobile) {
      await expect(cover).toBeHidden()
      return
    }
    await scene.evaluate((el) => el.scrollIntoView({ behavior: 'instant' }))
    await cover.hover()
    await expect(cover.getByText('Explore project')).toHaveCSS('opacity', '1')
  })

  test('the brand appears with intent: header and footer marks, one faint device in the hero', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en')
    // No logo inside the page itself: the header carries it, the footer signs off.
    await expect(page.locator('main [data-mark]')).toHaveCount(0)
    await expect(page.getByRole('banner').locator('[data-mark]')).toHaveCount(2) // wordmark, symbol (one shown per tier)
    await expect(page.getByRole('contentinfo').locator('[data-mark="wordmark"]')).toHaveCount(1)
    // The hero's MG device: hairlines from the approved vector, decorative, on desktop only.
    const device = page.locator('main section').first().locator('svg[aria-hidden="true"] path')
    await expect(device).toHaveCount(1)
    if (isMobile) await expect(device).toBeHidden()
    else {
      await expect(device).toBeVisible()
      expect(await device.evaluate((el) => getComputedStyle(el).fill)).toBe('none')
    }
  })

  test('capabilities carry quiet glyphs, and the close names what converges', async ({ page }) => {
    await page.goto('/he')
    const glyphs = page.locator('[aria-labelledby="capabilities-title"] li svg[aria-hidden="true"]')
    await expect(glyphs).toHaveCount(6)
    const contact = page.locator('[aria-labelledby="contact-title"]')
    for (const word of ['מוצר', 'מערכת', 'חוויה'])
      await expect(contact.getByText(word)).toBeVisible()
    // One action only: the project inquiry.
    await expect(contact.getByRole('link')).toHaveCount(1)
  })
})

test.describe('depth and texture', () => {
  test('decorative atmosphere and glyphs stay out of the accessibility tree', async ({ page }) => {
    await page.goto('/he')
    // ON's far haze and the Defense system field.
    await expect(page.locator('#on [aria-hidden="true"] img[alt=""]')).toHaveCount(1)
    await expect(page.locator('#confidential > svg[aria-hidden="true"]')).toHaveCount(1)
    // The stage glyphs live in the active display above the current word, not in the list.
    const process = page.locator('[aria-labelledby="process-title"]')
    await expect(process.locator('ol > li svg')).toHaveCount(0)
    await expect(process.locator('[aria-hidden="true"] svg')).toHaveCount(5)
    // The field is generated geometry only: no text, no images.
    await expect(page.locator('#confidential > svg :is(text, image)')).toHaveCount(0)
  })

  test('the closing line is the new invitation in both languages', async ({ page }) => {
    await page.goto('/he')
    await expect(page.getByText('בואו נבנה משהו ששווה להשתמש בו.')).toBeVisible()
    await page.goto('/en')
    await expect(page.getByText('Let’s build something worth using.')).toBeVisible()
  })
})
