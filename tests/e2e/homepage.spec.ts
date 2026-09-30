import { expect, test, type Page } from '@playwright/test'

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
  test('moves through distinct worlds', async ({ page }) => {
    await page.goto('/en')
    const backgrounds = await page
      .locator('[data-scene]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    // MARTIN.G, ON cream, ON bordeaux, mi-ma-mo and confidential are all present.
    expect(new Set(backgrounds).size).toBeGreaterThanOrEqual(5)
    expect(backgrounds).toContain('rgb(239, 231, 218)')
  })

  test('the header takes on the world beneath it and hands it back', async ({ page }) => {
    await page.goto('/en')
    await expect.poll(() => headerBackground(page)).toBe('rgb(6, 6, 6)')
    await bringSceneUnderHeader(page, '#on-title')
    await expect.poll(() => headerBackground(page)).toBe('rgb(239, 231, 218)')
    await bringSceneUnderHeader(page, '#mi-ma-mo-title')
    await expect.poll(() => headerBackground(page)).toBe('rgb(11, 13, 16)')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => headerBackground(page)).toBe('rgb(6, 6, 6)')
  })

  test('stages are static compositions with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/he')
    const positions = await page
      .locator('#hero-title, #process-title')
      .evaluateAll((els) =>
        els.map((el) => getComputedStyle(el.parentElement!.parentElement!).position),
      )
    expect(positions).not.toContain('sticky')
    const steps = page
      .getByRole('region', { name: 'דרך העבודה' })
      .getByRole('heading', { level: 3 })
    await expect(steps).toHaveCount(5)
    for (const opacity of await steps.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el.closest('li')!).opacity),
    )) {
      expect(opacity).toBe('1')
    }
    await context.close()
  })

  test('short or zoomed viewports never get a sticky frame', async ({ browser }) => {
    // 200% zoom on a 1280 x 800 window is a 640 x 400 CSS px viewport.
    const context = await browser.newContext({ viewport: { width: 640, height: 400 } })
    const page = await context.newPage()
    await page.goto('/en')
    const frame = page.locator('#hero-title').locator('xpath=../..')
    expect(await frame.evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(0)
    await context.close()
  })

  test('every scene is readable without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/en')
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
    await context.close()
  })

  test('the ON title always sets on one line', async ({ browser }) => {
    for (const width of [1200, 1280, 1440, 1920]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      const page = await context.newPage()
      await page.goto('/en')
      const lines = await page.locator('#on-title a').evaluate((el) => el.getClientRects().length)
      expect(lines, `at ${width}px`).toBe(1)
      await context.close()
    }
  })

  test('the closing scene renders no dead contact link', async ({ page }) => {
    await page.goto('/en')
    const contact = page.getByRole('region', { name: 'Have a problem worth solving?' })
    await expect(contact).toHaveCount(1)
    await expect(contact.getByRole('link')).toHaveCount(0)
  })
})
