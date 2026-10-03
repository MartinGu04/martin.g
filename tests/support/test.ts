import { test as base, type BrowserContext } from '@playwright/test'
import { INTRO_SESSION_KEY } from '../../src/components/intro/intro-script'

export { expect } from '@playwright/test'

/**
 * Every Playwright context is a new browser session, so the brand intro would open the
 * first homepage visit of every test (src/components/intro/intro-script.ts). The suite
 * tests the site beneath it: each context, the default one and any a test opens with
 * `browser.newContext()`, starts with the intro already seen for its session.
 * tests/e2e/intro.spec.ts imports @playwright/test directly and tests the intro itself.
 */
async function markIntroSeen(context: BrowserContext) {
  await context.addInitScript((key) => {
    try {
      sessionStorage.setItem(key, 'seen')
    } catch {
      // about:blank and opaque origins have no session storage, and no intro either.
    }
  }, INTRO_SESSION_KEY)
}

export const test = base.extend({
  context: async ({ context }, provide) => {
    await markIntroSeen(context)
    await provide(context)
  },
  browser: [
    async ({ browser }, provide) => {
      const newContext = browser.newContext.bind(browser)
      browser.newContext = async (options) => {
        const context = await newContext(options)
        await markIntroSeen(context)
        return context
      }
      await provide(browser)
    },
    { scope: 'worker' },
  ],
})
