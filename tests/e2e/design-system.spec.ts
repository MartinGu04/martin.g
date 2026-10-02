import { expect, test, type Page } from '@playwright/test'
import { openForLayout, openRendered } from '../support/navigation'

const localePages = [
  '/en',
  '/he',
  '/en/work/on',
  '/he/work/on',
  '/en/work/mi-ma-mo',
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

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('brand marks', () => {
  // The desktop header sets the wordmark 18px tall, above its minimum at every density.
  for (const [dpr, minHeight] of [
    [1, 18],
    [2, 18],
  ] as const) {
    test(`header wordmark stays legible at ${dpr}x`, async ({ browser, isMobile }) => {
      test.skip(isMobile, 'desktop header')
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: dpr,
      })
      try {
        const page = await context.newPage()
        await page.goto('/en')
        const box = await page.getByRole('banner').locator('[data-mark="wordmark"]').boundingBox()
        expect(box!.height).toBeGreaterThanOrEqual(minHeight - 0.5)
        // Proportions come from the approved asset: 1090 x 103.
        expect(box!.width / box!.height).toBeCloseTo(1090 / 103, 1)
      } finally {
        await context.close()
      }
    })
  }

  test('a mark requested below its minimum renders at the minimum', async ({ browser }) => {
    const context = await browser.newContext({ deviceScaleFactor: 1 })
    try {
      const page = await context.newPage()
      await page.goto('/en/system')
      const heights = await page
        .locator('[data-mark="wordmark"]')
        .evaluateAll((els) =>
          els.map((el) => el.getBoundingClientRect().height).filter((h) => h > 0),
        )
      // The specimen asks for 8px; the wordmark's minimum at 1x is 14px.
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(13.5)
    } finally {
      await context.close()
    }
  })

  test('narrow phones keep every destination legible and clear of the symbol', async ({
    browser,
  }) => {
    // 390 and 360: one row (the Latin labels tighten below 390). 320: a two-row masthead
    // that scrolls away. Never a drawer, never an overlap, never a wrapped label.
    for (const [width, rows, position] of [
      [390, 1, 'sticky'],
      [360, 1, 'sticky'],
      [320, 2, 'relative'],
    ] as const) {
      const context = await browser.newContext({ viewport: { width, height: 640 } })
      try {
        const page = await context.newPage()
        for (const url of ['/en', '/he']) {
          await openForLayout(page, url)
          const header = page.getByRole('banner')
          expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe(position)
          const mark = (await header.locator('[data-mark="monogram"]').boundingBox())!
          const links = header.getByRole('navigation').locator('a')
          await expect(links).toHaveCount(5)
          const boxes = await links.evaluateAll((els) =>
            els.map((el) => {
              const r = el.getBoundingClientRect()
              return {
                left: r.left,
                right: r.right,
                top: r.top,
                bottom: r.bottom,
                lines: el.getClientRects().length,
              }
            }),
          )
          const clear = mark.height * 0.25
          for (const box of boxes) {
            expect(box.lines, `${url} at ${width}`).toBe(1)
            expect(box.bottom - box.top, `${url} at ${width}`).toBeGreaterThanOrEqual(44)
            const sameRow = box.top < mark.y + mark.height && box.bottom > mark.y
            if (rows === 2) expect(sameRow, `${url} at ${width}`).toBe(false)
            else if (url === '/en')
              expect(box.left - (mark.x + mark.width), `${url} at ${width}`).toBeGreaterThanOrEqual(
                clear,
              )
            else expect(mark.x - box.right, `${url} at ${width}`).toBeGreaterThanOrEqual(clear)
          }
          expect(await horizontalOverflow(page), `${url} at ${width}`).toBeLessThanOrEqual(0)
        }
      } finally {
        await context.close()
      }
    }
  })

  test('header wordmark keeps its clear space', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop header')
    await page.goto('/en')
    const header = await page.getByRole('banner').boundingBox()
    const mark = await page.getByRole('banner').locator('[data-mark="wordmark"]').boundingBox()
    const nav = await page.getByRole('banner').getByRole('navigation').boundingBox()
    const clear = mark!.height * 0.5
    expect(mark!.y - header!.y).toBeGreaterThanOrEqual(clear)
    expect(header!.y + header!.height - (mark!.y + mark!.height)).toBeGreaterThanOrEqual(clear)
    expect(nav!.x - (mark!.x + mark!.width)).toBeGreaterThanOrEqual(clear)
  })

  test('marks stay visible in forced colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await page.goto('/en')
    const colors = await page
      .locator('main [data-mark="wordmark"]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    expect(colors.length).toBeGreaterThan(0)
    expect(colors).not.toContain('rgba(0, 0, 0, 0)')
  })
})

test.describe('navigation', () => {
  test('every header and footer link resolves', async ({ page, request }) => {
    for (const url of ['/en', '/he']) {
      await page.goto(url)
      const hrefs = await page
        .locator('header a[href], footer a[href]')
        .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).getAttribute('href')!))
      expect(hrefs.length).toBeGreaterThan(0)
      for (const href of new Set(hrefs)) {
        const [path, hash] = href.split('#')
        expect((await request.get(path || url)).status(), href).toBe(200)
        if (hash) {
          await page.goto(path || url)
          await expect(page.locator(`#${hash}`)).toHaveCount(1)
        }
      }
    }
  })

  test('the header offers the work, About and the project inquiry, in that order', async ({
    page,
  }) => {
    for (const [locale, names] of [
      ['en', ['Work', 'About', 'Contact', 'EN English', 'HE עברית']],
      ['he', ['עבודות', 'אודות', 'יצירת קשר', 'EN English', 'HE עברית']],
    ] as const) {
      await page.goto(`/${locale}`)
      const links = page.getByRole('banner').getByRole('navigation').getByRole('link')
      await expect(links).toHaveText([...names])
      expect(
        await links.evaluateAll((els) => els.slice(0, 3).map((a) => a.getAttribute('href'))),
      ).toEqual([`/${locale}#work`, `/${locale}#about`, `/${locale}/contact`])
      // About is the homepage's About scene, never a page of its own.
      await expect(page.locator('#about[aria-labelledby="about-title"]')).toHaveCount(1)
    }
  })

  test('About leads to the About scene from the homepage and from every other page', async ({
    page,
  }) => {
    for (const [from, label] of [
      ['/en', 'About'],
      ['/he', 'אודות'],
      ['/en/contact', 'About'],
      ['/he/privacy', 'אודות'],
      ['/en/accessibility', 'About'],
      ['/he/work/on', 'אודות'],
      ['/en/work/mi-ma-mo', 'About'],
    ] as const) {
      await page.goto(from)
      await page.getByRole('banner').getByRole('link', { name: label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`/${from.slice(1, 3)}#about$`))
      const title = page.locator('#about-title')
      await expect(title).toBeInViewport()
      // Below the sticky header, not under it.
      await expect
        .poll(async () => {
          const header = (await page.getByRole('banner').boundingBox())!
          const scene = (await page.locator('#about').boundingBox())!
          return Math.round(scene.y) >= Math.round(header.y + header.height) - 1
        })
        .toBe(true)
    }
  })

  test('About is reached and followed with the keyboard, with reduced motion too', async ({
    browser,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard navigation')
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await page.goto('/he/contact')
      const about = page.getByRole('banner').getByRole('link', { name: 'אודות', exact: true })
      await about.focus()
      await expect(about).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/he#about$/)
      await expect(page.locator('#about-title')).toBeInViewport()
      await expect(page.locator('[data-reveal]:not([data-revealed])')).toHaveCount(0)
    } finally {
      await context.close()
    }
  })

  test('the language switch marks the current language', async ({ page }) => {
    await page.goto('/he')
    const group = page.getByRole('banner').getByRole('group', { name: 'החלפת שפה' })
    await expect(group.getByRole('link', { name: /^HE/ })).toHaveAttribute('aria-current', 'true')
    await expect(group.getByRole('link', { name: /^EN/ })).not.toHaveAttribute('aria-current')
  })

  test('keyboard order follows the reading order and focus is always visible', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard navigation')
    await page.goto('/he')
    const names: string[] = []
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      names.push((await focused.textContent())?.trim() ?? '')
      const outline = await focused.evaluate((el) => {
        const style = getComputedStyle(el)
        const after = getComputedStyle(el, '::after')
        return style.outlineStyle !== 'none' || after.outlineStyle !== 'none'
      })
      expect(outline, `focus ring on "${names.at(-1)}"`).toBe(true)
    }
    expect(names.slice(0, 5)).toEqual([
      'דילוג לתוכן',
      'MARTIN.G, דף הבית',
      'עבודות',
      'אודות',
      'יצירת קשר',
    ])
  })
})

test.describe('motion', () => {
  test('reveals content once it enters the viewport', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on')
    const rows = page.locator('#work [data-reveal]')
    await rows.first().scrollIntoViewIfNeeded()
    await expect(rows.first()).toHaveAttribute('data-revealed', '')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('[data-reveal]:not([data-revealed])')).toHaveCount(0)
  })

  test('never hides the primary heading', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('h1 [data-reveal], h1[data-reveal]')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('falls back to visible content when scripts never run the controller', async ({ page }) => {
    // Block JavaScript only (CSS must still load, or the check would pass trivially).
    await page.route(/\/_next\/static\/chunks\/.*\.js/, (route) => route.abort())
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off', { timeout: 5000 })
    await page.locator('#work').scrollIntoViewIfNeeded()
    const opacity = await page
      .locator('#work [data-reveal]')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity)
    expect(opacity).toBe('1')
  })

  test('scene transitions never clip content without scripting or with reduced motion', async ({
    browser,
  }) => {
    for (const options of [{ javaScriptEnabled: false }, { reducedMotion: 'reduce' as const }]) {
      const context = await browser.newContext(options)
      try {
        const page = await context.newPage()
        await openRendered(page, '/en/system/scenes')
        const clips = await page
          .locator('[data-enter="wipe"], [data-enter="split"]')
          .evaluateAll((els) => els.map((el) => getComputedStyle(el).clipPath))
        expect(clips.length).toBeGreaterThan(0)
        expect(new Set(clips)).toEqual(new Set(['none']))
      } finally {
        await context.close()
      }
    }
  })

  test('a project world takes over its scene from the first paint', async ({ page }) => {
    await page.goto('/en/system/scenes')
    const on = page.locator('[data-scene][data-theme-scheme="light"]').first()
    const background = await on.evaluate((el) => getComputedStyle(el).backgroundColor)
    const root = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(background).not.toBe(root)
  })

  test('reduced motion disables parallax and transitions', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await page.goto('/en/system')
      await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
      const transform = await page
        .locator('[data-parallax]')
        .evaluate((el) => getComputedStyle(el).transform)
      expect(transform).toBe('none')
    } finally {
      await context.close()
    }
  })
})

test.describe('responsive and zoom', () => {
  const widths = [1920, 1440, 1180, 820, 390, 320]

  for (const url of localePages) {
    test(`no horizontal overflow at any tier: ${url}`, async ({ page }) => {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await openForLayout(page, url)
        expect(await horizontalOverflow(page), `${url} at ${width}px`).toBeLessThanOrEqual(0)
      }
    })
  }

  // 200% zoom on a 1280px window is a 640 CSS px viewport at 2x; 400% is 320 CSS px
  // (WCAG 1.4.10 reflow). Content must reflow without horizontal scrolling.
  for (const [label, width, dpr] of [
    ['200%', 640, 2],
    ['400%', 320, 4],
  ] as const) {
    test(`reflows at ${label} zoom`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height: 400 },
        deviceScaleFactor: dpr,
      })
      try {
        const page = await context.newPage()
        for (const url of [
          '/en',
          '/he',
          '/en/work/on',
          '/he/work/mi-ma-mo',
          '/he/system',
          '/en/privacy',
          '/he/accessibility',
        ]) {
          await openForLayout(page, url)
          expect(await horizontalOverflow(page), `${url} at ${label}`).toBeLessThanOrEqual(0)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        }
      } finally {
        await context.close()
      }
    })
  }
})

test.describe('typography and specimen', () => {
  test('loads both script families and uses the right one per locale', async ({ page }) => {
    await page.goto('/he')
    await page.evaluate(() => document.fonts.ready)
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.unicodeRange),
    )
    expect(loaded.some((range) => /U\+590-5FF/i.test(range))).toBe(true)
    expect(loaded.some((range) => /U\+2000-206F/i.test(range))).toBe(true)
    const family = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family.indexOf('hebrewFont')).toBeLessThan(family.indexOf('latinFont'))
  })

  test('the specimen is not indexable and not in the sitemap', async ({ page, request }) => {
    await page.goto('/en/system')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).not.toContain('/system')
  })
})
