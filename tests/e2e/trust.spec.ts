import type { BrowserContext, Page } from '@playwright/test'
import { expect, test } from '../support/test'
import { openRendered } from '../support/navigation'

const ENABLE_SRC = 'https://cdn.enable.co.il/licenses/enable-L56389fiq4mpysr4-0926-83906/init.js'

const trustPages = [
  ['en', 'privacy', 'Privacy · MARTIN.G', 'Privacy'],
  ['he', 'privacy', 'פרטיות · MARTIN.G', 'פרטיות'],
  ['en', 'accessibility', 'Accessibility · MARTIN.G', 'Accessibility'],
  ['he', 'accessibility', 'נגישות · MARTIN.G', 'הצהרת נגישות'],
] as const

test.describe('privacy and accessibility pages', () => {
  for (const [locale, page_, title, h1] of trustPages) {
    test(`/${locale}/${page_}: one h1, ordered headings, metadata`, async ({ page }) => {
      const response = await page.goto(`/${locale}/${page_}`)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(title)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1)
      await expect(page.locator('h1')).toHaveCount(1)
      // h1, then h2 sections only: no skipped levels.
      const levels = await page
        .locator('main :is(h1, h2, h3, h4)')
        .evaluateAll((els) => els.map((el) => Number(el.tagName[1])))
      expect(levels[0]).toBe(1)
      for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!).toBeLessThan(2)
      await expect(page.locator('main section[aria-labelledby]').first()).toBeVisible()
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`/${locale}/${page_}$`),
      )
      // Every link inside the page leads to a page of this site that exists.
      for (const href of await page
        .locator('main a[href]')
        .evaluateAll((els) => els.map((a) => a.getAttribute('href')!))) {
        expect(href.startsWith(`/${locale}/`), href).toBe(true)
        expect((await page.request.get(href)).status(), href).toBe(200)
      }
      // Never the confidential projects, never a dossier.
      const text = (await page.locator('main').innerText()).toLowerCase()
      for (const term of ['confidential', 'classified', 'clearance', 'מסווג'])
        expect(text).not.toContain(term)
    })
  }

  test('the accessibility statement describes the work, not a certificate', async ({ page }) => {
    await page.goto('/en/accessibility')
    const main = page.locator('main')
    for (const topic of [
      'Keyboard',
      'Motion',
      'Zoom and small screens',
      'Contrast',
      'Images and video',
      'Languages',
      'Forms',
      'Known limitations',
      'Report a problem',
      'Enable',
    ])
      await expect(main.getByText(topic, { exact: false }).first()).toBeVisible()
    await expect(main).toContainText('It is a goal, not a certification')
    await expect(main.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/contact')
    await expect(main.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/en/privacy')
  })

  test('the privacy page names the third-party script and the one cookie', async ({ page }) => {
    await page.goto('/he/privacy')
    const main = page.locator('main')
    await expect(main).toContainText('cdn.enable.co.il')
    await expect(main).toContainText('NEXT_LOCALE')
    await expect(main).toContainText('Resend')
    await expect(main).toContainText('Vercel')
  })

  test('are in the sitemap with their alternates', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text()
    for (const path of ['/contact', '/privacy', '/accessibility']) {
      expect(body).toContain(`/en${path}`)
      expect(body).toContain(`/he${path}`)
    }
  })
})

test.describe('footer trust layer', () => {
  for (const [locale, names] of [
    ['en', ['Work', 'About', 'Contact', 'Privacy', 'Accessibility']],
    ['he', ['עבודות', 'אודות', 'יצירת קשר', 'פרטיות', 'נגישות']],
  ] as const) {
    test(`offers the real destinations in ${locale}, and nothing invented`, async ({ page }) => {
      await page.goto(`/${locale}/contact`)
      const footer = page.getByRole('contentinfo')
      const nav = footer.getByRole('navigation')
      await expect(nav).toHaveCount(1)
      const links = nav.locator(':scope > ul > li > a')
      await expect(links).toHaveText([...names])
      expect(await links.evaluateAll((els) => els.map((a) => a.getAttribute('href')))).toEqual([
        `/${locale}#work`,
        `/${locale}#about`,
        `/${locale}/contact`,
        `/${locale}/privacy`,
        `/${locale}/accessibility`,
      ])
      await expect(nav.getByRole('group')).toHaveCount(1) // the language switch
      // No social, phone, address or registration placeholders.
      await expect(
        footer.locator('a[href^="http"], a[href^="tel:"], a[href^="mailto:"]'),
      ).toHaveCount(0)
      for (const href of await footer
        .locator('a[href]')
        .evaluateAll((els) => els.map((a) => a.getAttribute('href')!))) {
        expect((await page.request.get(href.split('#')[0]!)).status(), href).toBe(200)
      }
    })
  }
})

/**
 * Serves a stand-in for the Enable script that counts its loads and builds a launcher with
 * the live widget's own markup (confirmed on the Vercel preview): a button
 * #enable-toolbar-trigger with an icon and the aria-hidden "ESC" badge. Enter (a click)
 * and Escape toggle a menu, as the real one does; a second ".keyboard-shorcut" inside the
 * menu shows that the MARTIN.G override hides only the launcher's own badge.
 */
async function stubEnable(target: Page | BrowserContext) {
  await target.route('https://cdn.enable.co.il/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `(function () {
        var w = window
        w.__enableLoads = (w.__enableLoads || 0) + 1
        w.__enableReadyState = document.readyState
        var b = document.createElement('button')
        b.type = 'button'
        b.id = 'enable-toolbar-trigger'
        b.setAttribute('aria-label', 'Accessibility menu')
        b.setAttribute('aria-expanded', 'false')
        b.style.cssText = 'position:fixed;inset-block-end:16px;inset-inline-start:16px;z-index:9;display:inline-flex;gap:4px;align-items:center;min-inline-size:48px;min-block-size:48px'
        b.innerHTML = '<span class="enable-icon" aria-hidden="true">A11Y</span><span class="keyboard-shorcut" aria-hidden="true">ESC</span>'
        var menu = document.createElement('div')
        menu.id = 'enable-stub-menu'
        menu.hidden = true
        menu.innerHTML = '<p>Menu <span class="keyboard-shorcut">ESC</span></p>'
        var toggle = function (open) {
          menu.hidden = !open
          b.setAttribute('aria-expanded', String(open))
        }
        b.addEventListener('click', function () { toggle(menu.hidden) })
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') toggle(menu.hidden)
        })
        document.body.appendChild(b)
        document.body.appendChild(menu)
      })()`,
    }),
  )
}

test.describe('the Enable accessibility menu', () => {
  for (const [project, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['phone', { width: 390, height: 844 }],
  ] as const) {
    test(`hides only the launcher's ESC badge; the launcher still works (${project})`, async ({
      page,
      isMobile,
    }) => {
      await page.setViewportSize(viewport)
      await stubEnable(page)
      for (const locale of ['he', 'en']) {
        await page.goto(`/${locale}`)
        const launcher = page.locator('#enable-toolbar-trigger')
        await expect(launcher).toBeVisible()
        // The badge: in the DOM untouched, not displayed.
        const badge = launcher.locator('> .keyboard-shorcut')
        await expect(badge).toHaveCount(1)
        await expect(badge).toHaveText('ESC')
        await expect(badge).toBeHidden()
        // Everything else stays as the vendor drew it: the icon, and any other element
        // that happens to share the class.
        await expect(launcher.locator('.enable-icon')).toBeVisible()
        // The accessible name is the vendor's own (the badge was aria-hidden all along).
        await expect(launcher).toHaveAccessibleName('Accessibility menu')
        const box = (await launcher.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)

        if (!isMobile) {
          // Reached with the keyboard, opened with Enter, Escape as before.
          await launcher.focus()
          await expect(launcher).toBeFocused()
          await page.keyboard.press('Enter')
          await expect(page.locator('#enable-stub-menu')).toBeVisible()
          await expect(launcher).toHaveAttribute('aria-expanded', 'true')
          await expect(page.locator('#enable-stub-menu .keyboard-shorcut')).toBeVisible()
          await page.keyboard.press('Escape')
          await expect(page.locator('#enable-stub-menu')).toBeHidden()
          await page.keyboard.press('Escape')
          await expect(page.locator('#enable-stub-menu')).toBeVisible()
          await page.keyboard.press('Escape')
        } else {
          await launcher.tap()
          await expect(page.locator('#enable-stub-menu')).toBeVisible()
          await launcher.tap()
          await expect(page.locator('#enable-stub-menu')).toBeHidden()
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(0)
      }
    })
  }

  test('is the exact licensed script, loaded once per document, after the page', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await stubEnable(page)
    for (const locale of ['en', 'he']) {
      await page.goto(`/${locale}`)
      await expect
        .poll(() =>
          page.evaluate(() => (window as unknown as Record<string, unknown>).__enableLoads),
        )
        .toBe(1)
      await expect(page.locator(`script[src="${ENABLE_SRC}"]`)).toHaveCount(1)
      await expect(page.locator('script[src*="enable.co.il"]')).toHaveCount(1)
      // Deferred until the page has loaded: it never blocks rendering.
      expect(
        await page.evaluate(
          () => (window as unknown as Record<string, unknown>).__enableReadyState,
        ),
      ).toBe('complete')
      await expect(page.locator('#enable-toolbar-trigger')).toHaveCount(1)
    }
    // A client-side navigation keeps the one instance.
    await page.goto('/en/privacy')
    await expect
      .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__enableLoads))
      .toBe(1)
    await page.getByRole('banner').getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL(/\/en\/contact$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(() => (window as unknown as Record<string, unknown>).__enableLoads),
    ).toBe(1)
    await expect(page.locator('script[src*="enable.co.il"]')).toHaveCount(1)
    await expect(page.locator('#enable-toolbar-trigger')).toHaveCount(1)
    expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([])
  })

  test('is not part of the server-rendered HTML, so it cannot block it', async ({ request }) => {
    for (const url of ['/en', '/he/contact']) {
      const html = await (await request.get(url)).text()
      expect(html).not.toMatch(/<script[^>]+src="https:\/\/cdn\.enable\.co\.il/)
    }
  })

  test('is allowed by the Content Security Policy, and only its vendor is', async ({ request }) => {
    const csp = (await request.get('/en')).headers()['content-security-policy']!
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'))!
    expect(scriptSrc.trim()).toBe("script-src 'self' 'unsafe-inline' https://cdn.enable.co.il")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("form-action 'self'")
  })

  test('the site stays usable when the menu cannot load', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation')
    // The suite's browsers never resolve the vendor's host (playwright.config.ts).
    await page.goto('/en')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.goto('/en/contact')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('#enable-toolbar-trigger')).toHaveCount(0)
  })
})

test.describe('the Enable accessibility menu without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('nothing is requested from the vendor', async ({ page }) => {
    const vendor: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('enable.co.il')) vendor.push(r.url())
    })
    // Pages without images: without JavaScript the load event waits for every image
    // (tests/support/navigation.ts), and the full load is what this test needs.
    for (const url of ['/he/privacy', '/en/contact']) {
      await openRendered(page, url)
      await page.waitForLoadState('load')
    }
    expect(vendor).toEqual([])
  })
})
