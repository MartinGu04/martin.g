import { readFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import {
  INTRO_FILMS,
  INTRO_SESSION_KEY,
  INTRO_START_TIMEOUT_MS,
} from '../../src/components/intro/intro-script'

/*
 * The brand intro (src/components/intro). This file imports @playwright/test directly, so
 * each context is a fresh browser session that has not seen the intro (the rest of the
 * suite starts with it seen: tests/support/test.ts).
 *
 * The suite's Chromium has no H.264 decoder, so the approved films can never play here.
 * Each test stages the intro instead: the browser is told it can play the films, and their
 * URLs are answered with tiny synthetic films (two seconds, VP9, tests/support/intro-films)
 * of the same orientation. Which URL is requested is still the site's own choice. A test
 * that does not stage the films shows the real behavior of a browser that cannot play them.
 */

const FIXTURES = path.join(process.cwd(), 'tests/support/intro-films')
const SYNTHETIC = {
  landscape: readFileSync(path.join(FIXTURES, 'landscape.webm')),
  portrait: readFileSync(path.join(FIXTURES, 'portrait.webm')),
}
const FILM_ROUTE = '**/media/brand-film/*.mp4'

type Failure = 'missing' | 'hang' | 'refused'

/** Stages the films for one page and returns the film paths it requests. */
async function stageFilms(page: Page, failure?: Failure) {
  const requested: string[] = []
  await page.addInitScript((refused) => {
    HTMLMediaElement.prototype.canPlayType = () => 'probably'
    if (refused) {
      HTMLMediaElement.prototype.play = () =>
        Promise.reject(new DOMException('autoplay refused', 'NotAllowedError'))
    }
  }, failure === 'refused')
  await page.route(FILM_ROUTE, async (route) => {
    const url = new URL(route.request().url())
    requested.push(url.pathname)
    if (failure === 'hang') return
    if (failure === 'missing') return route.fulfill({ status: 404 })
    const film = url.pathname === INTRO_FILMS.portrait.src ? 'portrait' : 'landscape'
    return route.fulfill({ status: 200, contentType: 'video/webm', body: SYNTHETIC[film] })
  })
  return requested
}

/** Records the layout shifts that happen once the intro's layer starts to lift. */
async function recordShiftsAfterLift(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __afterLift: number; __liftedAt: number }
    w.__afterLift = 0
    w.__liftedAt = -1
    new MutationObserver(() => {
      if (w.__liftedAt < 0 && document.documentElement.dataset.intro === 'out') {
        w.__liftedAt = performance.now()
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro'] })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number })[]) {
        if (w.__liftedAt >= 0 && entry.startTime >= w.__liftedAt) w.__afterLift += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
}

const layer = (page: Page) => page.locator('dialog')
const html = (page: Page) => page.locator('html')

async function expectIntroPlaying(page: Page) {
  await expect(layer(page)).toBeVisible()
  await expect(html(page)).toHaveAttribute('data-intro', 'on')
  await expect
    .poll(() =>
      page.evaluate(
        () => document.querySelector<HTMLVideoElement>('dialog video')?.currentTime ?? 0,
      ),
    )
    .toBeGreaterThan(0)
}

async function expectIntroGone(page: Page, timeout?: number) {
  await expect(html(page)).toHaveAttribute('data-intro', 'done', { timeout })
  await expect(layer(page)).toHaveCount(0)
  expect(
    await page.evaluate(() => document.querySelectorAll('video[src*="brand-film"]').length),
  ).toBe(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

async function expectNoIntro(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(layer(page)).toHaveCount(0)
  await expect(html(page)).not.toHaveAttribute('data-intro', /.*/)
}

/** The film this project's screen gets: the vertical edit on portrait screens. */
function expectedFilm(page: Page) {
  const size = page.viewportSize()
  return size && size.height > size.width ? INTRO_FILMS.portrait : INTRO_FILMS.landscape
}

async function withContext(
  browser: Browser,
  options: BrowserContextOptions,
  run: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext(options)
  try {
    await run(await context.newPage())
  } finally {
    await context.close()
  }
}

test.describe('brand intro', () => {
  test('plays once per session over the rendered homepage, then hands over to the hero', async ({
    page,
    browser,
  }, testInfo) => {
    const requested = await stageFilms(page)
    await recordShiftsAfterLift(page)
    await page.goto('/en')
    await expectIntroPlaying(page)

    // The film this screen's orientation calls for, and only that one.
    const film = expectedFilm(page)
    expect(requested).toEqual([film.src])
    await expect(layer(page)).toHaveAttribute(
      'data-film',
      film === INTRO_FILMS.portrait ? 'portrait' : 'landscape',
    )

    // Muted, inline, no native controls, autoplaying, and on the film's own black.
    const video = await page.evaluate(() => {
      const v = document.querySelector<HTMLVideoElement>('dialog video')!
      return {
        muted: v.muted,
        inline: v.hasAttribute('playsinline'),
        controls: v.controls,
        paused: v.paused,
        hidden: v.getAttribute('aria-hidden'),
        background: getComputedStyle(v.parentElement!).backgroundColor,
      }
    })
    expect(video).toEqual({
      muted: true,
      inline: true,
      controls: false,
      paused: false,
      hidden: 'true',
      background: 'rgb(0, 0, 0)',
    })

    // The homepage is already rendered beneath the layer, which covers it and keeps it inert.
    await expect(page.locator('#hero-title')).toHaveText(/From problem to product\./)
    const covered = await page.evaluate(() => {
      const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
      return Boolean(top?.closest('dialog'))
    })
    expect(covered).toBe(true)

    // The film ends: the layer lifts, is removed completely, and nothing on the page moves.
    await expectIntroGone(page, 10_000)
    expect(
      await page.evaluate(() => (window as unknown as { __afterLift: number }).__afterLift),
    ).toBe(0)
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(6, 6, 6)')

    // A refresh, an internal navigation and a full load of the homepage: never again.
    await page.reload()
    await expectNoIntro(page)
    const nav = page.getByRole('navigation', { name: 'Primary' })
    if (testInfo.project.name === 'desktop') {
      await nav.getByRole('link', { name: 'Contact' }).click()
      await expect(page).toHaveURL(/\/en\/contact$/)
      await page.getByRole('link', { name: 'MARTIN.G, home' }).first().click()
      await expect(page).toHaveURL(/\/en$/)
      await expectNoIntro(page)
    }
    await page.goto('/en/contact')
    await page.goto('/en')
    await expectNoIntro(page)
    expect(requested).toHaveLength(1)

    // A new browser session may see it again.
    await withContext(browser, {}, async (fresh) => {
      await stageFilms(fresh)
      await fresh.goto('/en')
      await expectIntroPlaying(fresh)
    })
  })

  test('Skip, by pointer: straight to the site, and the session counts it as seen', async ({
    page,
  }) => {
    await stageFilms(page)
    await page.goto('/en')
    await expectIntroPlaying(page)
    const skip = page.getByRole('button', { name: 'Skip' })
    await expect(skip).toBeVisible()
    const box = (await skip.boundingBox())!
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
    await skip.click()
    await expect(html(page)).toHaveAttribute('data-intro', /^(out|done)$/)
    await expectIntroGone(page, 2_000)
    expect(await page.evaluate((key) => sessionStorage.getItem(key), INTRO_SESSION_KEY)).toBe(
      'seen',
    )
    await page.reload()
    await expectNoIntro(page)
  })

  test('Skip, by keyboard: reached with Tab, with a visible focus ring; Escape too', async ({
    page,
    browser,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard navigation')
    await stageFilms(page)
    await page.goto('/en')
    await expectIntroPlaying(page)

    // On arrival the layer itself holds focus, so Skip shows no ring until it is reached.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('DIALOG')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('button', { name: 'Skip' })
    await expect(skip).toBeFocused()
    expect(await skip.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
    await expect(skip).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expectIntroGone(page, 2_000)

    await withContext(browser, {}, async (fresh) => {
      await stageFilms(fresh)
      await fresh.goto('/en')
      await expectIntroPlaying(fresh)
      await fresh.keyboard.press('Escape')
      await expectIntroGone(fresh, 2_000)
    })
  })

  test('Hebrew: the layer follows the page direction and Skip speaks Hebrew', async ({ page }) => {
    await stageFilms(page)
    await page.goto('/he')
    await expectIntroPlaying(page)
    await expect(html(page)).toHaveAttribute('dir', 'rtl')
    const skip = page.getByRole('button', { name: 'דלג' })
    await expect(skip).toBeVisible()
    // Skip sits at the closing corner of the line: the left in Hebrew.
    const box = (await skip.boundingBox())!
    expect(box.x + box.width / 2).toBeLessThan(page.viewportSize()!.width / 2)
    await skip.click()
    await expectIntroGone(page, 2_000)
    await expect(page.locator('#hero-title')).toHaveText(/מבעיה למוצר\./)
  })

  test('the layer passes axe while the film plays', async ({ page }) => {
    await stageFilms(page)
    await page.goto('/en')
    await expectIntroPlaying(page)
    const { violations } = await new AxeBuilder({ page })
      .include('dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
  })

  test('never for reduced motion, without scripting, or on another first page', async ({
    page,
    browser,
  }) => {
    for (const options of [{ reducedMotion: 'reduce' as const }, { javaScriptEnabled: false }]) {
      await withContext(browser, options, async (other) => {
        const requested = await stageFilms(other)
        await other.goto('/en')
        await expect(other.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(layer(other)).toHaveCount(0)
        expect(requested).toEqual([])
      })
    }

    // A session that starts on another page (or on a section link) never gets the film later.
    const requested = await stageFilms(page)
    await page.goto('/en/contact')
    await page.goto('/en')
    await expectNoIntro(page)
    expect(requested).toEqual([])

    await withContext(browser, {}, async (other) => {
      const seen = await stageFilms(other)
      await other.goto('/en#about')
      await expect(layer(other)).toHaveCount(0)
      expect(seen).toEqual([])
    })
  })

  test('a browser that cannot play the films never sees the layer or downloads them', async ({
    page,
  }) => {
    const requested: string[] = []
    await page.route(FILM_ROUTE, (route) => {
      requested.push(route.request().url())
      return route.abort()
    })
    await page.goto('/en')
    await expectNoIntro(page)
    expect(requested).toEqual([])
  })

  const failures = {
    missing: 'a missing film',
    refused: 'refused autoplay',
    hang: 'a film that never starts',
  } as const
  for (const failure of ['missing', 'refused', 'hang'] as const) {
    test(`${failures[failure]} never holds the site back`, async ({ page }) => {
      await stageFilms(page, failure)
      const started = Date.now()
      await page.goto('/en')
      await expectIntroGone(page, INTRO_START_TIMEOUT_MS + 3_000)
      if (failure !== 'hang') expect(Date.now() - started).toBeLessThan(INTRO_START_TIMEOUT_MS)
      await expect(page.getByRole('link', { name: 'MARTIN.G, home' }).first()).toBeVisible()
      await page.reload()
      await expectNoIntro(page)
    })
  }
})

test.describe('brand intro at every screen', () => {
  const screens = [
    { name: 'desktop widescreen', width: 1920, height: 1080, fit: 'cover' },
    { name: 'laptop', width: 1440, height: 900, fit: 'cover' },
    { name: 'tablet landscape', width: 1024, height: 768, fit: 'contain' },
    { name: 'tablet portrait', width: 768, height: 1024, fit: 'cover' },
    { name: 'iPhone', width: 390, height: 844, fit: 'cover' },
    { name: '320px', width: 320, height: 568, fit: 'cover' },
  ]

  for (const screen of screens) {
    test(`${screen.name}: the right edit fills the screen, Skip in reach`, async ({
      browser,
      isMobile,
    }) => {
      test.skip(isMobile, 'viewports are set explicitly')
      const viewport = { width: screen.width, height: screen.height }
      await withContext(browser, { viewport }, async (page) => {
        const requested = await stageFilms(page)
        await page.goto('/en')
        await expectIntroPlaying(page)
        const film = screen.height > screen.width ? INTRO_FILMS.portrait : INTRO_FILMS.landscape
        expect(requested).toEqual([film.src])

        const layout = await page.evaluate(() => {
          const dialog = document.querySelector('dialog')!.getBoundingClientRect()
          const video = document.querySelector('dialog video')!
          return {
            dialog: [dialog.x, dialog.y, dialog.width, dialog.height],
            fit: getComputedStyle(video).objectFit,
            overflow: document.documentElement.scrollWidth > innerWidth,
          }
        })
        expect(layout.dialog).toEqual([0, 0, screen.width, screen.height])
        expect(layout.fit).toBe(screen.fit)
        expect(layout.overflow).toBe(false)

        const skip = (await page.getByRole('button', { name: 'Skip' }).boundingBox())!
        expect(skip.x).toBeGreaterThanOrEqual(0)
        expect(skip.y).toBeGreaterThanOrEqual(0)
        expect(skip.x + skip.width).toBeLessThanOrEqual(screen.width)
        expect(skip.y + skip.height).toBeLessThanOrEqual(screen.height)

        await expectIntroGone(page, 10_000)
      })
    })
  }
})

test.describe('the header Film control', () => {
  const film = (page: Page, name = 'Film') =>
    page.getByRole('banner').getByRole('button', { name, exact: true })
  const seenState = (page: Page) =>
    page.evaluate((key) => sessionStorage.getItem(key), INTRO_SESSION_KEY)

  test('plays the film again after the automatic intro, as often as asked, never touching the session', async ({
    page,
  }) => {
    const requested = await stageFilms(page)
    await page.goto('/en')
    await expectIntroPlaying(page)
    await page.getByRole('button', { name: 'Skip' }).click()
    await expectIntroGone(page, 2_000)
    expect(await seenState(page)).toBe('seen')

    // Already seen this session: the header plays it anyway, on any page, twice.
    for (const path of ['/en', '/en/contact']) {
      if (path !== '/en') await page.goto(path)
      await film(page).click()
      await expectIntroPlaying(page)
      expect(await seenState(page)).toBe('seen')
      await expectIntroGone(page, 10_000)
      expect(await seenState(page)).toBe('seen')
    }
    expect(requested).toHaveLength(3)

    // The automatic intro is still spent for the session.
    await page.goto('/en')
    await expectNoIntro(page)
    expect(requested).toHaveLength(3)
  })

  test('Skip and Escape end a replay, and focus returns to Film', async ({ page, isMobile }) => {
    await stageFilms(page)
    await page.addInitScript((key) => sessionStorage.setItem(key, 'seen'), INTRO_SESSION_KEY)
    await page.goto('/en/contact')
    await expectNoIntro(page)

    await film(page).click()
    await expectIntroPlaying(page)
    await page.getByRole('button', { name: 'Skip' }).click()
    await expectIntroGone(page, 2_000)
    expect(await seenState(page)).toBe('seen')

    test.skip(isMobile, 'keyboard navigation')
    await film(page).focus()
    await page.keyboard.press('Enter')
    await expectIntroPlaying(page)
    await page.keyboard.press('Escape')
    await expectIntroGone(page, 2_000)
    await expect(film(page)).toBeFocused()
    expect(await film(page).evaluate((el) => el.matches(':focus-visible'))).toBe(true)
    await expect(film(page)).toHaveCSS('outline-style', 'solid')

    // Space activates it too, and Skip is reached with Tab during the replay.
    await page.keyboard.press(' ')
    await expectIntroPlaying(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Skip' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expectIntroGone(page, 2_000)
    expect(await seenState(page)).toBe('seen')
  })

  test('Hebrew: סרט plays the film, with the Hebrew Skip', async ({ page }) => {
    await stageFilms(page)
    await page.addInitScript((key) => sessionStorage.setItem(key, 'seen'), INTRO_SESSION_KEY)
    await page.goto('/he')
    await expectNoIntro(page)
    await film(page, 'סרט').click()
    await expectIntroPlaying(page)
    await page.getByRole('button', { name: 'דלג' }).click()
    await expectIntroGone(page, 2_000)
  })

  test('is a button in the primary navigation, shown only where the film can play', async ({
    page,
    browser,
  }) => {
    await stageFilms(page)
    await page.addInitScript((key) => sessionStorage.setItem(key, 'seen'), INTRO_SESSION_KEY)
    await page.goto('/en')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await expect(nav.getByRole('button', { name: 'Film', exact: true })).toBeVisible()
    // The destinations around it are unchanged and still lead where they did.
    for (const name of ['Work', 'About', 'Contact']) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible()
    }
    await nav.getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/contact$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: /HE/ })
      .click()
    await expect(page).toHaveURL(/\/he\/contact$/)
    await expect(film(page, 'סרט')).toBeVisible()
    await expectNoIntro(page)

    // No film for this browser (it cannot decode it), with reduced motion, or without scripting.
    await withContext(browser, {}, async (other) => {
      await other.goto('/en')
      await expect(other.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(film(other)).toHaveCount(0)
    })
    for (const options of [{ reducedMotion: 'reduce' as const }, { javaScriptEnabled: false }]) {
      await withContext(browser, options, async (other) => {
        await stageFilms(other)
        await other.goto('/en')
        await expect(other.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(film(other)).toHaveCount(0)
      })
    }
  })

  for (const width of [320, 360, 390, 412, 768, 1280]) {
    test(`the header holds one row with Film at ${width}px, in both languages`, async ({
      browser,
      isMobile,
    }) => {
      test.skip(isMobile, 'viewports are set explicitly')
      await withContext(browser, { viewport: { width, height: 800 } }, async (page) => {
        await stageFilms(page)
        await page.addInitScript((key) => sessionStorage.setItem(key, 'seen'), INTRO_SESSION_KEY)
        for (const locale of ['en', 'he'] as const) {
          await page.goto(`/${locale}/contact`)
          await page.evaluate(() => document.fonts.ready.then(() => undefined))
          const button = film(page, locale === 'en' ? 'Film' : 'סרט')
          await expect(button).toBeVisible()
          const layout = await page.evaluate(() => {
            const header = document.querySelector('header')!
            const items = [...header.querySelectorAll('nav li')]
              .map((li) => li.getBoundingClientRect())
              .filter((r) => r.width > 0)
            return {
              overflow: document.documentElement.scrollWidth - innerWidth,
              rows: new Set(items.map((r) => Math.round(r.top))).size,
              inside: items.every((r) => r.left >= 0 && r.right <= innerWidth),
            }
          })
          expect(layout).toEqual({ overflow: 0, rows: 1, inside: true })
          const box = (await button.boundingBox())!
          expect(box.width).toBeGreaterThanOrEqual(24)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      })
    })
  }
})
