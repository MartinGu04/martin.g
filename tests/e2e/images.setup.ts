import type { Browser, BrowserContextOptions, Page } from '@playwright/test'
import { expect, test as setup } from '../support/test'

/*
 * Warms Next's image optimizer before any test runs (the `setup` project in
 * playwright.config.ts; every test project depends on it).
 *
 * On a fresh server each optimized image is encoded on its first request. On a fresh CI
 * runner that is every image, encoded while the tests compete for the same CPUs, and a
 * page's load event (or a test that waits for its images) can then outlast the test.
 * Here the image routes are rendered in a real browser at every viewport and density the
 * suite opens them at, with each test project's own device, and every `_next/image`
 * request the pages make is awaited until the server has answered it. The optimizer
 * caches what it encodes, so the tests then read finished images.
 *
 * Nothing here hardcodes an optimizer URL or width: the candidates are the ones the
 * browser chose for each profile. A profile mirrors where the suite opens a page; keep
 * this table in step when a test opens an image route at a new viewport or density.
 */

interface Profile {
  /** The viewport the suite sets (the project's own when absent). */
  viewport?: { width: number; height: number }
  /** The density the suite sets (the project's own when absent). */
  deviceScaleFactor?: number
  javaScriptEnabled?: false
  reducedMotion?: 'reduce'
  /** Only where every test at this profile skips the mobile project. */
  desktopOnly?: boolean
  /**
   * How the suite reads the page at this profile: 'through' when a test scrolls it (every
   * drawn image is brought into view until it has loaded), 'open' when tests only open it
   * (what the page requests by its load event, and any lazy image layout requests next).
   */
  read: 'through' | 'open'
  routes: readonly string[]
}

const home = ['/en', '/he'] as const
const on = ['/en/work/on', '/he/work/on'] as const
const miMaMo = ['/en/work/mi-ma-mo', '/he/work/mi-ma-mo'] as const
const all = [...miMaMo, ...on, ...home]

const profiles: Record<string, Profile[]> = {
  // Each project's device as configured: most tests, every walk through a page, and the
  // no-JavaScript reads, where Chromium ignores loading="lazy" and fetches every image.
  'as each project is configured': [
    { read: 'through', routes: all },
    { reducedMotion: 'reduce', read: 'through', routes: all },
    { javaScriptEnabled: false, read: 'open', routes: all },
  ],
  // Desktop widths: the primary proof's scale, the header wordmark at 1x and 2x, the
  // one-viewport composition, the ON title, the Enable launcher and the 12-column grid.
  desktop: [
    { viewport: { width: 1440, height: 900 }, read: 'open', routes: [miMaMo[0], ...home] },
    {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      desktopOnly: true,
      read: 'open',
      routes: [home[0]],
    },
    { viewport: { width: 1366, height: 768 }, desktopOnly: true, read: 'open', routes: [home[1]] },
    {
      viewport: { width: 1920, height: 1080 },
      desktopOnly: true,
      read: 'open',
      routes: [home[1]],
    },
    ...[1200, 1280, 1920, 900].map((width) => ({
      viewport: { width, height: 900 },
      read: 'open' as const,
      routes: [home[0]],
    })),
  ],
  // Every layout tier at 900 px tall: the overflow sweep over every page.
  'every layout tier': [1920, 1440, 1180, 820, 390, 320].map((width) => ({
    viewport: { width, height: 900 },
    read: 'open' as const,
    routes: all,
  })),
  // 390 px phones: the Enable launcher and the one-row header (with 360 px).
  '390 px phones': [
    { viewport: { width: 390, height: 844 }, read: 'open', routes: home },
    { viewport: { width: 390, height: 640 }, deviceScaleFactor: 2, read: 'open', routes: home },
    { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, read: 'open', routes: home },
  ],
  // 320 px phones at 2x and at 4x (400% zoom): the one-row header and reflow.
  '320 px phones': [
    { viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, read: 'open', routes: home },
    { viewport: { width: 320, height: 640 }, deviceScaleFactor: 4, read: 'open', routes: home },
    {
      viewport: { width: 320, height: 400 },
      deviceScaleFactor: 4,
      read: 'open',
      routes: [...home, on[0], miMaMo[1]],
    },
  ],
  // 640 px, short (200% zoom): reflow and the sticky frame's fallback.
  '640 px, short': [
    { viewport: { width: 640, height: 400 }, read: 'open', routes: [home[0]] },
    {
      viewport: { width: 640, height: 400 },
      deviceScaleFactor: 2,
      read: 'open',
      routes: [...home, on[0], miMaMo[1]],
    },
  ],
}

type Device = Pick<
  BrowserContextOptions,
  | 'viewport'
  | 'deviceScaleFactor'
  | 'isMobile'
  | 'hasTouch'
  | 'userAgent'
  | 'javaScriptEnabled'
  | 'reducedMotion'
>

/**
 * Opens `url`, reads it as `read` says, and waits for the server's answer to every optimized
 * image the page requested. Returns those URLs.
 */
async function warm(browser: Browser, device: Device, url: string, read: Profile['read']) {
  const context = await browser.newContext(device)
  const served: Promise<string>[] = []
  context.on('request', (request) => {
    if (!new URL(request.url()).pathname.startsWith('/_next/image')) return
    const answer = (async () => {
      const response = await request.response()
      expect(response, request.url()).not.toBeNull()
      expect(await response!.finished(), request.url()).toBeNull()
      expect(response!.status(), request.url()).toBe(200)
      return request.url()
    })()
    // Reported where it is awaited (settled), not as an unhandled rejection before that.
    answer.catch(() => {})
    served.push(answer)
  })
  // Until every optimized image the page requested has been answered and no new one starts
  // within two frames of the last answer (lazy images are requested as layout finds them).
  // Without scripting there is no lazy loading: every image is requested before `load`,
  // and no frame callback would run.
  const settled = async (page: Page) => {
    for (let seen = -1; seen !== served.length;) {
      seen = served.length
      await Promise.all(served)
      if (device.javaScriptEnabled === false) break
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      )
    }
    return Promise.all(served)
  }
  try {
    const page = await context.newPage()
    await page.goto(url)
    if (read === 'open') return await settled(page)
    // Scroll each drawn image that has not loaded into view, a frame apart so lazy loading
    // sees it, until every one has. Hidden art-direction alternatives are never fetched by
    // a browser at this profile, so they are not warmed either.
    await expect
      .poll(
        () =>
          page.locator('img').evaluateAll(async (els) => {
            const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
            const pending = (els as HTMLImageElement[]).filter(
              (img) =>
                img.getBoundingClientRect().width > 0 && !(img.complete && img.naturalWidth > 0),
            )
            for (const img of pending) {
              img.scrollIntoView({ block: 'center', behavior: 'instant' })
              await frame()
              await frame()
            }
            return pending.length
          }),
        { message: `every drawn image on ${url} loads`, timeout: 120_000 },
      )
      .toBe(0)
    return await settled(page)
  } finally {
    await context.close()
  }
}

for (const [name, list] of Object.entries(profiles)) {
  setup(`warm optimized images: ${name}`, async ({ browser }, setupInfo) => {
    // Cold encodes are the point of this step; on a slow runner they take minutes.
    setup.setTimeout(300_000)
    const dependents = setupInfo.config.projects.filter((p) =>
      p.dependencies.includes(setupInfo.project.name),
    )
    expect(dependents.length).toBeGreaterThan(0)
    for (const project of dependents) {
      const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = project.use
      for (const profile of list) {
        if (profile.desktopOnly && isMobile) continue
        const device: Device = {
          viewport: profile.viewport ?? viewport,
          deviceScaleFactor: profile.deviceScaleFactor ?? deviceScaleFactor,
          isMobile,
          hasTouch,
          userAgent,
          javaScriptEnabled: profile.javaScriptEnabled ?? true,
          reducedMotion: profile.reducedMotion ?? 'no-preference',
        }
        await Promise.all(
          profile.routes.map(async (url) => {
            const warmed = await warm(browser, device, url, profile.read)
            // Every image route draws images once read through.
            if (profile.read === 'through')
              expect(warmed.length, `${project.name} ${url}`).toBeGreaterThan(0)
          }),
        )
      }
    }
  })
}
