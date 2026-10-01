import { expect, type Page } from '@playwright/test'

/*
 * Navigation for assertions that need the rendered page, not every resource on it.
 *
 * The full load event waits for every image. Without scripting Chromium ignores
 * loading="lazy", so on a long page `load` waits for all of its images, and on a cold
 * image cache that can outlast a test. Images cannot change what these assertions read:
 * every media frame reserves its aspect ratio.
 *
 * DOMContentLoaded alone is not enough either: with JavaScript disabled it fires before
 * any stylesheet has applied, and a visibility, opacity, clip-path or overflow check made
 * then would read an unstyled page. Stylesheets are polled from the test side, because
 * waitForFunction needs page scripts, which no-JS contexts disable.
 */

async function stylesheetsApplied(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).every(
          (link) => link.sheet !== null,
        ),
      ),
    )
    .toBe(true)
}

/**
 * For DOM and style assertions (presence, visibility, opacity, clip-path), including
 * without JavaScript: the server-rendered HTML with every stylesheet applied. Fonts are
 * not awaited: they change no visibility (text renders in the fallback face until they
 * swap in), and on a no-JS page they queue behind every eagerly loaded image.
 */
export async function openRendered(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await stylesheetsApplied(page)
}

/**
 * For layout and overflow measurements: DOMContentLoaded, stylesheets applied, then the
 * web fonts, which decide text widths; then measure.
 */
export async function openForLayout(page: Page, url: string) {
  await openRendered(page, url)
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
}
