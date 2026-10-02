import { expect, test, type Page } from '@playwright/test'
import { openRendered } from '../support/navigation'

/** Scrolls so the scene containing `selector` sits just under the header. */
async function bringSceneUnderHeader(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const scene = document.querySelector(sel)!.closest('[data-scene]')!
    window.scrollTo({
      top: scene.getBoundingClientRect().top + window.scrollY - 8,
      behavior: 'instant',
    })
  }, selector)
}

const headerBackground = (page: Page) =>
  page.getByRole('banner').evaluate((el) => getComputedStyle(el).backgroundColor)

test.describe('homepage scenes', () => {
  test('identity is in the first viewport, without scrolling', async ({ page }) => {
    await page.goto('/en')
    const hero = page.getByRole('region', { name: /^MARTIN\.G/ })
    for (const text of [
      'Martin Gusin',
      'Product Builder',
      'Digital products, systems & experiences.',
    ]) {
      await expect(hero.getByText(text, { exact: true }).first()).toBeInViewport()
    }
    await expect(hero.getByRole('heading', { level: 1 })).toContainText('From problem to product.')
    await expect(hero.getByRole('heading', { level: 1 })).toBeInViewport()
  })

  test('the work is reached quickly and its index leads to real scenes', async ({ page }) => {
    await page.goto('/en')
    const top = await page
      .locator('#work-title')
      .evaluate((el) => el.getBoundingClientRect().top / window.innerHeight)
    expect(top).toBeLessThan(1.6)
    const hrefs = await page
      .locator('#work ol a[href^="#"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')!))
    expect(hrefs).toEqual(['#on', '#mi-ma-mo', '#confidential'])
    for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1)
  })

  test('moves through distinct worlds', async ({ page }) => {
    await page.goto('/en')
    const backgrounds = await page
      .locator('[data-scene]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    // MARTIN.G, ON cream, המחלבה and confidential are all present.
    expect(new Set(backgrounds).size).toBeGreaterThanOrEqual(5)
    expect(backgrounds).toContain('rgb(246, 240, 229)')
  })

  test('the header takes on the world beneath it and hands it back', async ({ page }) => {
    await page.goto('/en')
    await expect.poll(() => headerBackground(page)).toBe('rgb(6, 6, 6)')
    await bringSceneUnderHeader(page, '#on-title')
    await expect.poll(() => headerBackground(page)).toBe('rgb(246, 240, 229)')
    await bringSceneUnderHeader(page, '#mi-ma-mo-title')
    await expect.poll(() => headerBackground(page)).toBe('rgb(11, 18, 28)')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => headerBackground(page)).toBe('rgb(6, 6, 6)')
  })

  test('a page that opens in a light world takes it at once, without fading from dark', async ({
    page,
  }) => {
    // Records the header's state at the moment it first takes on a world.
    await page.addInitScript(() => {
      const w = window as unknown as { __firstWorld?: { instant: boolean } }
      new MutationObserver((records, observer) => {
        for (const record of records) {
          const el = record.target as HTMLElement
          if (record.attributeName === 'data-world-scheme' && el.dataset.worldScheme) {
            w.__firstWorld = { instant: el.hasAttribute('data-world-instant') }
            observer.disconnect()
          }
        }
      }).observe(document, { attributes: true, subtree: true })
    })
    for (const url of ['/en/privacy', '/he/accessibility']) {
      await page.goto(url)
      await expect.poll(() => headerBackground(page)).toBe('rgb(235, 232, 225)')
      const first = await page.evaluate(
        () => (window as unknown as { __firstWorld?: { instant: boolean } }).__firstWorld,
      )
      expect(first, url).toEqual({ instant: true })
      // Crossfades return for the scroll that follows.
      await expect(page.getByRole('banner')).not.toHaveAttribute('data-world-instant')
    }
  })

  test('stages are static compositions with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await page.goto('/he')
      const frame = page.locator('[aria-labelledby="process-title"]')
      expect(await frame.evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky')
      const steps = page
        .getByRole('region', { name: 'דרך העבודה' })
        .getByRole('heading', { level: 3 })
      await expect(steps).toHaveCount(5)
      for (const opacity of await steps.evaluateAll((els) =>
        els.map((el) => getComputedStyle(el.closest('li')!).opacity),
      )) {
        expect(opacity).toBe('1')
      }
    } finally {
      await context.close()
    }
  })

  test('short or zoomed viewports never get a sticky frame', async ({ browser }) => {
    // 200% zoom on a 1280 x 800 window is a 640 x 400 CSS px viewport.
    const context = await browser.newContext({ viewport: { width: 640, height: 400 } })
    try {
      const page = await context.newPage()
      await page.goto('/en')
      const frame = page.locator('[aria-labelledby="process-title"]')
      expect(await frame.evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky')
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(0)
    } finally {
      await context.close()
    }
  })

  test('every scene is readable without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      await openRendered(page, '/en')
      for (const name of [
        'From problem to product.',
        'Understand',
        'Refine',
        'Have a problem worth solving?',
      ]) {
        const target = page.getByText(name, { exact: true }).first()
        await target.scrollIntoViewIfNeeded()
        await expect(target).toBeVisible()
        const opacity = await target.evaluate(
          (el) => getComputedStyle(el.closest('li') ?? el).opacity,
        )
        expect(opacity).toBe('1')
      }
    } finally {
      await context.close()
    }
  })

  test('the ON title always sets on one line', async ({ browser }) => {
    for (const width of [1200, 1280, 1440, 1920]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      try {
        const page = await context.newPage()
        await page.goto('/en')
        const lines = await page.locator('#on-title a').evaluate((el) => el.getClientRects().length)
        expect(lines, `at ${width}px`).toBe(1)
      } finally {
        await context.close()
      }
    }
  })

  test('the closing scene has one action, and it leads to the project inquiry', async ({
    page,
  }) => {
    for (const [locale, region, label] of [
      ['en', 'Have a problem worth solving?', 'Start a project'],
      ['he', 'יש בעיה ששווה לפתור?', 'מתחילים פרויקט'],
    ] as const) {
      await page.goto(`/${locale}`)
      const contact = page.getByRole('region', { name: region })
      await expect(contact).toHaveCount(1)
      await expect(contact.getByRole('link')).toHaveCount(1)
      const action = contact.getByRole('link', { name: label })
      await expect(action).toHaveAttribute('href', `/${locale}/contact`)
      await action.scrollIntoViewIfNeeded()
      await expect(action).toBeVisible()
      const box = (await action.boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(44)
      await action.click()
      await expect(page).toHaveURL(new RegExp(`/${locale}/contact$`))
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
  })
})
