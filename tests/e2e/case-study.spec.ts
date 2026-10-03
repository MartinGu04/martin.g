import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '../support/test'
import { openRendered } from '../support/navigation'

const chapters = [
  'context',
  'problem',
  'direction',
  'website',
  'decisions',
  'film',
  'details',
  'result',
] as const

/** Walks the whole page so lazy images load and reveals settle. */
async function walk(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 40))
    }
  })
}

test.describe('ON case study: structure', () => {
  test('opens on the ON identity with one h1 and eight numbered chapters', async ({ page }) => {
    for (const locale of ['en', 'he']) {
      await page.goto(`/${locale}/work/on`)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('ON')
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
    await page.goto('/en/work/on')
    const levels = await page
      .locator('main :is(h1, h2, h3, h4)')
      .evaluateAll((els) => els.map((el) => Number(el.tagName[1])))
    expect(levels[0]).toBe(1)
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1)
  })

  test('uses project-specific metadata', async ({ page }) => {
    await page.goto('/en/work/on')
    await expect(page).toHaveTitle(/^ON, a dating retreat brand and website · MARTIN\.G$/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /boutique dating retreat in the Galilee/,
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /site-home/)
    await page.goto('/he/work/on')
    await expect(page).toHaveTitle(/ON, מותג ואתר לריטריט היכרויות/)
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'he_IL')
  })
})

test.describe('ON case study: navigation', () => {
  test('always offers the way back, the language switch, the live site and the next world', async ({
    page,
  }) => {
    for (const [locale, allWork, view] of [
      ['en', 'All work', 'View project'],
      ['he', 'כל העבודות', 'לפרויקט'],
    ] as const) {
      await page.goto(`/${locale}/work/on`)
      const back = page.locator('main').getByRole('link', { name: allWork })
      expect(await back.count()).toBeGreaterThan(0)
      for (const link of await back.all())
        await expect(link).toHaveAttribute('href', `/${locale}#work`)
      await expect(page.getByRole('banner').getByRole('group').getByRole('link')).toHaveCount(2)
      await expect(page.locator('main a[href="https://www.onbyortal.com/"]').first()).toBeVisible()
      const next = page.locator('#next')
      await expect(next.getByRole('heading', { level: 2 })).toHaveText('המחלבה')
      await expect(next.getByRole('link', { name: new RegExp(`^${view}`) })).toHaveAttribute(
        'href',
        `/${locale}/work/mi-ma-mo`,
      )
      // The next world has no live site of its own.
      await expect(next.locator('a[href^="http"]')).toHaveCount(0)
    }
  })

  test('every in-page and internal link resolves', async ({ page, request }) => {
    await page.goto('/en/work/on')
    const hrefs = await page
      .locator('main a[href]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!))
    for (const href of hrefs) {
      if (href.startsWith('#')) await expect(page.locator(href), href).toHaveCount(1)
      else if (href.startsWith('/'))
        expect((await request.get(href.split('#')[0]!)).status(), href).toBe(200)
    }
  })

  test('the chapter index works from the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation')
    // Instant scrolling: under parallel load a headless smooth scroll can stall, and this
    // test is about the keyboard, not the easing.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/work/on')
    const link = page.getByRole('navigation', { name: 'Chapters' }).getByRole('link').nth(4)
    await link.focus()
    await expect(link).toBeFocused()
    expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#decisions$/)
    await expect(page.locator('#decisions-title')).toBeInViewport()
    // The next Tab continues from the chapter, not from the top of the page: the focused
    // element follows the chapter in document order (the film's control once hydrated,
    // otherwise the next link).
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
})

test.describe('ON case study: media and privacy', () => {
  test('every image is optimized, described, and only the opening loads eagerly', async ({
    page,
  }) => {
    await page.goto('/en/work/on')
    await walk(page)
    const images = await page.locator('main img').evaluateAll((els) =>
      els.map((img) => ({
        alt: img.getAttribute('alt'),
        hidden: Boolean(img.closest('[aria-hidden="true"]')),
        src: img.getAttribute('src') ?? '',
        loading: img.getAttribute('loading'),
      })),
    )
    expect(images.length).toBeGreaterThan(15)
    for (const img of images) {
      if (!img.hidden) expect(img.alt?.trim(), img.src).toBeTruthy()
      expect(img.src).toMatch(/^\/_next\/image\?/)
    }
    // The monogram (h1) and the opening screen are the only eager images.
    expect(images.filter((img) => img.loading !== 'lazy')).toHaveLength(2)
  })

  test('phones see the opening screen framed for a phone, from the same source', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en/work/on')
    const frame = page.locator('section[aria-labelledby="case-title"] img[src*="site-home"]')
    await expect(frame).toHaveCount(1)
    const ratio = await frame.evaluate((img) => {
      const box = img.parentElement!.parentElement!.getBoundingClientRect()
      return box.width / box.height
    })
    // Phones: the mark, the question and the action (910 x 720); larger screens: the whole.
    expect(ratio).toBeCloseTo(isMobile ? 910 / 720 : 1602 / 990, 1)
  })

  test('the film keeps every preview protection', async ({ page }) => {
    await page.goto('/en/work/on')
    const film = page.locator('#film')
    const video = film.locator('video')
    await expect(video).toHaveCount(1)
    await expect(video).not.toHaveAttribute('controls', /.*/)
    await expect(video).not.toHaveAttribute('autoplay', /.*/)
    await expect(video).toHaveAttribute('controlslist', /nodownload/)
    await expect(film).toContainText('Watermarked preview')
    await expect(film.getByRole('button', { name: 'Play the brand film preview' })).toBeVisible()
  })

  test('shows no confidential work and no internal identifiers', async ({ page }) => {
    for (const locale of ['en', 'he']) {
      await page.goto(`/${locale}/work/on`)
      const text = await page.locator('main').innerText()
      expect(text).not.toMatch(/confidential|mi-ma-mo/i)
      await expect(page.locator('main a[href*="confidential"]')).toHaveCount(0)
    }
  })
})

test.describe('ON case study: motion and accessibility', () => {
  for (const url of ['/en/work/on', '/he/work/on']) {
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

  test('reduced motion: everything visible, nothing loops, no reading bar', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await page.goto('/en/work/on')
      await walk(page)
      await expect(page.locator('[data-reveal]:not([data-revealed])')).toHaveCount(0)
      const infinite = await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length,
      )
      expect(infinite).toBe(0)
      const bar = page.locator('main > article > div[aria-hidden="true"]').first()
      await expect(bar).toBeHidden()
    } finally {
      await context.close()
    }
  })

  test('the reading bar follows the scroll and stays out of the accessibility tree', async ({
    page,
  }) => {
    await page.goto('/en/work/on')
    const bar = page.locator('main > article > div[aria-hidden="true"]').first()
    await expect(bar).toHaveCSS('position', 'fixed')
    const widthAt = async (y: number) => {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
      await page.waitForTimeout(150)
      return bar.evaluate((el) => el.getBoundingClientRect().width)
    }
    const top = await widthAt(0)
    const middle = await widthAt(
      await page.evaluate(() => document.documentElement.scrollHeight / 2),
    )
    expect(top).toBeLessThan(5)
    expect(middle).toBeGreaterThan(top)
  })

  test('without JavaScript every chapter and the film poster are there', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      // The server-rendered, styled page (see openRendered): not every image on it.
      await openRendered(page, '/he/work/on')
      for (const id of chapters) await expect(page.locator(`#${id}-title`)).toBeVisible()
      await expect(page.locator('#film video')).toHaveCount(0)
      await expect(page.locator('#film img')).toHaveCount(1)
    } finally {
      await context.close()
    }
  })
})
