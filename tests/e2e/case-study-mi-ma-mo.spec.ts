import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openForLayout, openRendered } from '../support/navigation'

const chapters = [
  'context',
  'picture',
  'week',
  'management',
  'phone',
  'decisions',
  'details',
  'result',
] as const

/** The approved, sanitized המחלבה sources: every image on the page is one of these. */
const approved =
  /\/_next\/static\/media\/(dashboard|team-week|admin|mobile|week-ahead)\.[0-9a-z_-]+\.png$/i

/** Walks the whole page so lazy images load and reveals settle. */
async function walk(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 40))
    }
  })
}

/** The source file behind an optimized image URL. */
function sourceOf(src: string) {
  return decodeURIComponent(new URL(src, 'http://x').searchParams.get('url') ?? '')
}

test.describe('המחלבה case study: structure', () => {
  test('opens on המחלבה with one h1 and eight numbered chapters', async ({ page }) => {
    for (const locale of ['en', 'he']) {
      await openRendered(page, `/${locale}/work/mi-ma-mo`)
      await expect(page.locator('h1')).toHaveCount(1)
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveText('המחלבה')
      await expect(h1.locator('bdi')).toHaveAttribute('lang', 'he')
      const index = page.getByRole('navigation', { name: locale === 'en' ? 'Chapters' : 'פרקים' })
      const links = index.getByRole('link')
      await expect(links).toHaveCount(chapters.length)
      for (const [i, id] of chapters.entries()) {
        await expect(links.nth(i)).toHaveAttribute('href', `#${id}`)
        const section = page.locator(`section#${id}`)
        await expect(section).toHaveCount(1)
        const heading = section.getByRole('heading', { level: 2 }).first()
        await expect(heading).toContainText(String(i + 1).padStart(2, '0'))
      }
    }
  })

  test('headings never skip a level', async ({ page }) => {
    for (const locale of ['en', 'he']) {
      await openRendered(page, `/${locale}/work/mi-ma-mo`)
      const levels = await page
        .locator('main :is(h1, h2, h3, h4)')
        .evaluateAll((els) => els.map((el) => Number(el.tagName[1])))
      expect(levels[0]).toBe(1)
      for (let i = 1; i < levels.length; i++)
        expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1)
    }
  })

  test('uses project-specific metadata in both languages', async ({ page }) => {
    await openRendered(page, '/en/work/mi-ma-mo')
    await expect(page).toHaveTitle(/^המחלבה, an operational workforce product · MARTIN\.G$/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /operational workforce product for scheduling, management workflows/,
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /dashboard/)
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/work\/mi-ma-mo$/,
    )
    await openRendered(page, '/he/work/mi-ma-mo')
    await expect(page).toHaveTitle(/^המחלבה, מוצר תפעולי לניהול כוח אדם · MARTIN\.G$/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /חקר מקרה: המחלבה/,
    )
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'he_IL')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })
})

test.describe('המחלבה case study: navigation and routes', () => {
  test('no live site, no route into Defense Systems, and the way back to all work', async ({
    page,
  }) => {
    for (const [locale, allWork] of [
      ['en', 'All work'],
      ['he', 'כל העבודות'],
    ] as const) {
      await openRendered(page, `/${locale}/work/mi-ma-mo`)
      const main = page.locator('main')
      // Not a public destination: no external link at all.
      await expect(main.locator('a[href^="http"]')).toHaveCount(0)
      // Every link stays on this page, goes back to all work, or to the other locale.
      const hrefs = await main
        .locator('a[href]')
        .evaluateAll((as) => as.map((a) => a.getAttribute('href')!))
      for (const href of hrefs)
        expect(href, href).toMatch(new RegExp(`^(#(${chapters.join('|')})|/${locale}#work)$`))
      const back = main.getByRole('link', { name: allWork })
      expect(await back.count()).toBe(2)
      // The closing names the next world of the work without opening it.
      const closing = page.locator('section[aria-labelledby="closing-title"]')
      await expect(closing.getByRole('heading', { level: 2 })).toHaveText(
        locale === 'en' ? 'Defense Systems' : 'מערכות ביטחוניות',
      )
      await expect(closing.locator('a')).toHaveCount(1)
      await expect(closing.locator('a')).toHaveAttribute('href', `/${locale}#work`)
    }
  })

  test('every in-page and internal link resolves; nothing confidential is routed', async ({
    page,
    request,
  }) => {
    await openRendered(page, '/en/work/mi-ma-mo')
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!))
    for (const href of hrefs) {
      if (href.startsWith('#')) await expect(page.locator(href), href).toHaveCount(1)
      else if (href.startsWith('/'))
        expect((await request.get(href.split('#')[0]!)).status(), href).toBe(200)
    }
    for (const path of ['/en/work/confidential-01', '/he/work/confidential-02', '/en/work/defense'])
      expect((await request.get(path)).status(), path).toBe(404)
  })

  test('the chapter index works from the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/work/mi-ma-mo')
    const link = page.getByRole('navigation', { name: 'Chapters' }).getByRole('link').nth(5)
    await link.focus()
    await expect(link).toBeFocused()
    expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#decisions$/)
    await expect(page.locator('#decisions-title')).toBeInViewport()
    // The next Tab continues from the chapter (the closing's way back), not from the top.
    await page.keyboard.press('Tab')
    const after = await page.evaluate(() => {
      const chapter = document.getElementById('decisions')!
      const active = document.activeElement!
      return Boolean(
        chapter.compareDocumentPosition(active) &
        (Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY),
      )
    })
    expect(after).toBe(true)
  })

  test('every link and the language switch are reachable by Tab, with a visible focus ring', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard navigation')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/work/mi-ma-mo')
    const total = await page.locator('a[href]:visible, button:visible').count()
    for (let i = 0; i < total + 4; i++) {
      await page.keyboard.press('Tab')
      const key = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const seen = ((window as unknown as { __seen?: Set<Element> }).__seen ??= new Set())
        seen.add(el)
        return `${el.tagName}:${el.getAttribute('href') ?? el.textContent}`
      })
      if (!key) continue
      // Read once the focus style has settled (links ease their state changes).
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const style = getComputedStyle(document.activeElement!)
              return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
            }),
          { message: key },
        )
        .toBe(true)
    }
    const reached = await page.evaluate(
      () => (window as unknown as { __seen: Set<Element> }).__seen.size,
    )
    expect(reached).toBeGreaterThanOrEqual(total)
  })
})

test.describe('המחלבה case study: media and privacy', () => {
  test('only the approved, sanitized screens: optimized, described, only the opening eager', async ({
    page,
  }) => {
    await page.goto('/en/work/mi-ma-mo')
    await walk(page)
    const images = await page.locator('main img').evaluateAll((els) =>
      els.map((img) => ({
        alt: img.getAttribute('alt'),
        src: img.getAttribute('src') ?? '',
        width: Number(img.getAttribute('width')),
        height: Number(img.getAttribute('height')),
        sizes: img.getAttribute('sizes'),
        loading: img.getAttribute('loading'),
      })),
    )
    expect(images.length).toBeGreaterThan(20)
    for (const img of images) {
      expect(img.alt?.trim(), img.src).toBeTruthy()
      expect(img.src).toMatch(/^\/_next\/image\?/)
      expect(sourceOf(img.src), img.src).toMatch(approved)
      expect(img.width).toBeGreaterThan(0)
      expect(img.height).toBeGreaterThan(0)
      expect(img.sizes, img.src).toBeTruthy()
    }
    expect(images.filter((img) => img.loading !== 'lazy')).toHaveLength(1)
    // No video, no live preview of the product: screens only.
    await expect(page.locator('main video, main iframe')).toHaveCount(0)
  })

  test('images are requested at the size they are drawn, never far below it', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'measured at a desktop width')
    await page.goto('/en/work/mi-ma-mo')
    await walk(page)
    // On a fresh server every image's first request is encoded on demand, alongside the
    // other tests starting up, so loading gets more than the default five seconds.
    await expect
      .poll(
        () =>
          page.locator('main img').evaluateAll((els) =>
            // Drawn images only: the phones-only frame is not displayed, so never fetched.
            els
              .filter((img) => img.getBoundingClientRect().width > 0)
              .every(
                (img) =>
                  (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
              ),
          ),
        { timeout: 20_000 },
      )
      .toBe(true)
    const draws = await page.locator('main img').evaluateAll((els) =>
      els
        .filter((el) => el.getBoundingClientRect().width > 0)
        .map((el) => {
          const img = el as HTMLImageElement
          return {
            src: img.currentSrc,
            drawn: img.getBoundingClientRect().width * window.devicePixelRatio,
            requested: Number(new URL(img.currentSrc).searchParams.get('w')),
            intrinsic: Number(img.getAttribute('width')),
          }
        }),
    )
    for (const d of draws) {
      // Asked for enough pixels for the drawn size, or the whole source when it is smaller
      // (the optimizer never enlarges). naturalWidth cannot be used: with width descriptors
      // it is corrected by the candidate's density. Chromium may take the next smaller
      // candidate when it is close (a geometric-mean rule), hence the margin.
      const served = Math.min(d.requested, d.intrinsic)
      expect(served, d.src).toBeGreaterThanOrEqual(Math.min(d.drawn, d.intrinsic) * 0.85)
    }
  })

  test('phones see the opening framed for a phone, from the same source', async ({
    page,
    isMobile,
  }) => {
    await openForLayout(page, '/en/work/mi-ma-mo')
    const frame = page.locator('section[aria-labelledby="case-title"] img')
    await expect(frame).toHaveCount(1)
    const ratio = await frame.evaluate((img) => {
      const box = img.parentElement!.parentElement!.getBoundingClientRect()
      return box.width / box.height
    })
    // Phones: the greeting, shortcuts and next shift (480 x 560); larger: Home and its navigation.
    expect(ratio).toBeCloseTo(isMobile ? 480 / 560 : 1461 / 700, 1)
  })

  test('the primary proof is drawn at about its own size on a desktop', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    try {
      const page = await context.newPage()
      await openForLayout(page, '/en/work/mi-ma-mo')
      // Rendered width over source width: never shrunk below reading size, never blown up.
      const scale = async (selector: string, sourceWidth: number) =>
        (await page.locator(selector).first().boundingBox())!.width / sourceWidth
      const opening = await scale('section[aria-labelledby="case-title"] [data-ground]', 1461)
      const card = await scale('#picture [data-ground]', 1058)
      const week = await scale('#week [data-ground]', 1442)
      const phone = await scale('#phone [data-ground]', 429)
      const weekAhead = await scale('#picture [data-ground]:has(img[src*="week-ahead"])', 1543)
      for (const s of [opening, card, week, phone, weekAhead]) {
        expect(s).toBeGreaterThanOrEqual(0.85)
        expect(s).toBeLessThanOrEqual(1.05)
      }
    } finally {
      await context.close()
    }
  })

  test('the week ahead is shown whole on larger screens and in two frames on phones', async ({
    page,
    isMobile,
  }) => {
    await openForLayout(page, '/en/work/mi-ma-mo')
    const frames = page.locator('#picture figure img[src*="week-ahead"]')
    await expect(frames).toHaveCount(2)
    const shown = await frames.evaluateAll((els) =>
      els
        .filter((img) => img.getBoundingClientRect().width > 0)
        .map((img) => {
          const box = img.parentElement!.parentElement!.getBoundingClientRect()
          return { width: box.width, ratio: box.width / box.height }
        }),
    )
    if (isMobile) {
      // The start of the week (455 x 232) and today with the day after it (425 x 182).
      expect(shown.map((f) => Math.round(f.ratio * 100) / 100)).toEqual([
        Math.round((455 / 232) * 100) / 100,
        Math.round((425 / 182) * 100) / 100,
      ])
      for (const f of shown) expect(f.width / 455).toBeGreaterThan(0.7)
    } else {
      expect(shown).toHaveLength(1)
      expect(shown[0]!.ratio).toBeCloseTo(1543 / 263, 1)
    }
  })

  test('shows no confidential work, no internal identifiers, no removed material', async ({
    page,
  }) => {
    for (const locale of ['en', 'he']) {
      await openRendered(page, `/${locale}/work/mi-ma-mo`)
      const text = await page.locator('main').innerText()
      expect(text).not.toMatch(/confidential|mi-ma-mo|classified|clearance/i)
      // Excluded views are not published: no month view, no fairness table.
      expect(text).not.toMatch(/month view|fairness|תצוגה חודשית|טבלת צדק/i)
      await expect(page.locator('main a[href*="confidential"]')).toHaveCount(0)
    }
  })
})

test.describe('המחלבה case study: motion and accessibility', () => {
  for (const url of ['/en/work/mi-ma-mo', '/he/work/mi-ma-mo']) {
    test(`no axe violations after reading the whole page: ${url}`, async ({ page }) => {
      await page.goto(url)
      await walk(page)
      // Measured at rest at the top, once everything has been revealed: wherever a scroll
      // happens to stop, a link partly under the sticky header would read as "obscured".
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }

  test('loops live only in ambient scenes and pause offscreen', async ({ page, isMobile }) => {
    test.skip(isMobile, 'one viewport is enough')
    await page.goto('/en/work/mi-ma-mo')
    // This case study's own loops (the scene atmospheres' layers are the shared system's).
    const outside = await page
      .locator('main [data-loop]:not([data-layer])')
      .evaluateAll((els) => els.filter((el) => !el.closest('[data-ambient]')).length)
    expect(outside).toBe(0)
    const opening = page.locator('section[aria-labelledby="case-title"]')
    await expect(opening).toHaveAttribute('data-live', '')
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    )
    await expect.poll(() => opening.getAttribute('data-live')).toBeNull()
    const states = await opening
      .locator('[data-loop]:not([data-layer])')
      .evaluateAll((els) =>
        els.flatMap((el) => el.getAnimations({ subtree: true }).map((a) => a.playState)),
      )
    expect(states.length).toBeGreaterThan(0)
    for (const state of states) expect(state).toBe('paused')
  })

  test('reduced motion: everything visible, nothing loops, every box drawn', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await page.goto('/en/work/mi-ma-mo')
      await walk(page)
      await expect(page.locator('[data-reveal]:not([data-revealed])')).toHaveCount(0)
      const infinite = await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length,
      )
      expect(infinite).toBe(0)
      const clipped = await page
        .locator('main [data-tag]')
        .evaluateAll((els) => els.filter((el) => getComputedStyle(el).clipPath !== 'none').length)
      expect(clipped).toBe(0)
      const bar = page.locator('main > article > div[aria-hidden="true"]').first()
      await expect(bar).toBeHidden()
    } finally {
      await context.close()
    }
  })

  test('without JavaScript every chapter, every screen and every box is there', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      // The server-rendered, styled page (see openRendered): not every image on it.
      await openRendered(page, '/he/work/mi-ma-mo')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      for (const id of chapters) await expect(page.locator(`#${id}-title`)).toBeVisible()
      await expect(page.locator('#closing-title')).toBeVisible()
      expect(await page.locator('main img').count()).toBeGreaterThan(20)
      // Nothing starts hidden without scripting: reveals, boxes and the map are all shown.
      const hidden = await page.locator('main :is([data-reveal], [data-tag], table)').evaluateAll(
        (els) =>
          els.filter((el) => {
            const style = getComputedStyle(el)
            return style.opacity === '0' || style.clipPath !== 'none'
          }).length,
      )
      expect(hidden).toBe(0)
      // This case study's decorative loops do not exist without scripting.
      const loops = await page
        .locator('main [data-loop]:not([data-layer])')
        .evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== 'none').length)
      expect(loops).toBe(0)
    } finally {
      await context.close()
    }
  })
})
