import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import nextConfig, { securityHeaders } from '../../next.config'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import manifest from '@/app/manifest'
import { getDictionary } from '@/i18n/get-dictionary'
import { brandSurface } from '@/lib/theme'
import { isIndexable, openGraphLocales, pageMetadata, siteUrl } from '@/lib/site'
import { homeStructuredData, serializeJsonLd } from '@/lib/structured-data'

const PRODUCTION = { VERCEL_ENV: 'production', SITE_URL: 'https://martin-g.dev' }

describe('site origin', () => {
  it('is SITE_URL in production, normalized to an origin', () => {
    expect(siteUrl(PRODUCTION).toString()).toBe('https://martin-g.dev/')
    expect(siteUrl({ ...PRODUCTION, SITE_URL: ' https://martin-g.dev/ ' }).toString()).toBe(
      'https://martin-g.dev/',
    )
  })

  it('refuses a production build without an https SITE_URL', () => {
    expect(() =>
      siteUrl({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'example.com' }),
    ).toThrow(/needs SITE_URL/)
    expect(() => siteUrl({ VERCEL_ENV: 'production', SITE_URL: ' ' })).toThrow(/needs SITE_URL/)
    for (const SITE_URL of ['http://example.com', 'https://localhost:3000']) {
      expect(() => siteUrl({ VERCEL_ENV: 'production', SITE_URL }), SITE_URL).toThrow(
        /https site origin/,
      )
    }
  })

  it('is the deployment’s own URL in a preview, never the production SITE_URL', () => {
    const preview = {
      VERCEL_ENV: 'preview',
      SITE_URL: 'https://martin-g.dev',
      VERCEL_URL: 'synthetic-abc123.vercel.app',
    }
    expect(siteUrl(preview).origin).toBe('https://synthetic-abc123.vercel.app')
    expect(
      siteUrl({ ...preview, VERCEL_BRANCH_URL: 'synthetic-git-branch.vercel.app' }).origin,
    ).toBe('https://synthetic-git-branch.vercel.app')
  })

  it('is SITE_URL or localhost in local and CI builds', () => {
    expect(siteUrl({}).origin).toBe('http://localhost:3000')
    expect(siteUrl({ SITE_URL: 'https://martin-g.dev' }).origin).toBe('https://martin-g.dev')
  })

  it('refuses a SITE_URL that is not an origin', () => {
    for (const SITE_URL of [
      'example.com',
      'ftp://example.com',
      'https://example.com/he',
      'https://example.com/?a=1',
      'https://example.com/#top',
      'https://user:pass@example.com',
    ]) {
      expect(() => siteUrl({ SITE_URL }), SITE_URL).toThrow(/SITE_URL/)
      expect(() => siteUrl({ VERCEL_ENV: 'production', SITE_URL }), SITE_URL).toThrow(/SITE_URL/)
    }
  })
})

describe('indexing', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('allows indexing only in the Vercel production deployment', () => {
    expect(isIndexable({ VERCEL_ENV: 'production' })).toBe(true)
    expect(isIndexable({ VERCEL_ENV: 'preview' })).toBe(false)
    expect(isIndexable({ VERCEL_ENV: 'development' })).toBe(false)
    expect(isIndexable({})).toBe(false)
  })

  it('robots.txt opens production to crawlers and closes every other build', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('SITE_URL', 'https://martin-g.dev')
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://martin-g.dev/sitemap.xml',
    })
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } })
  })

  it('the production sitemap is on the canonical origin', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('SITE_URL', 'https://martin-g.dev')
    for (const entry of sitemap()) {
      expect(new URL(entry.url).origin).toBe('https://martin-g.dev')
      for (const href of Object.values(entry.alternates?.languages ?? {})) {
        expect(new URL(href!).origin).toBe('https://martin-g.dev')
      }
    }
  })

  it('the sitemap lists only public pages, each with its alternates', () => {
    const entries = sitemap()
    const paths = entries.map((entry) => new URL(entry.url).pathname)
    expect(paths).toEqual([
      '/en',
      '/he',
      '/en/work/on',
      '/he/work/on',
      '/en/work/mi-ma-mo',
      '/he/work/mi-ma-mo',
      '/en/contact',
      '/he/contact',
      '/en/privacy',
      '/he/privacy',
      '/en/accessibility',
      '/he/accessibility',
    ])
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {})).toEqual(['en', 'he', 'x-default'])
    }
  })
})

describe('page metadata', () => {
  it('pairs the canonical URL, its alternates and the Open Graph URL', () => {
    const metadata = pageMetadata({
      locale: 'he',
      path: '/contact',
      title: 'Synthetic title',
      description: 'Synthetic description',
      siteName: 'MARTIN.G',
    })
    expect(metadata.alternates).toEqual({
      canonical: '/he/contact',
      languages: { en: '/en/contact', he: '/he/contact', 'x-default': '/he/contact' },
    })
    expect(metadata.openGraph).toEqual({
      description: 'Synthetic description',
      siteName: 'MARTIN.G',
      locale: 'he_IL',
      alternateLocale: ['en_US'],
      type: 'website',
      url: '/he/contact',
    })
  })

  it('carries a social image only when one is given', () => {
    const image = { url: '/synthetic.jpg', width: 1200, height: 630, alt: 'Synthetic alt' }
    const metadata = pageMetadata({
      locale: 'en',
      path: '/work/on',
      title: 'Synthetic',
      description: 'Synthetic',
      siteName: 'MARTIN.G',
      type: 'article',
      image,
    })
    expect(metadata.openGraph).toMatchObject({ type: 'article', images: [image] })
  })

  it('names the other locale as the Open Graph alternate', () => {
    expect(openGraphLocales('en')).toEqual({ locale: 'en_US', alternateLocale: ['he_IL'] })
  })
})

describe('structured data', () => {
  it('describes the site and the person, from approved copy only', () => {
    const data = homeStructuredData({
      locale: 'en',
      origin: new URL('https://example.com'),
      siteName: 'MARTIN.G',
      description: 'Synthetic description',
      person: { name: 'Synthetic Person', role: 'Synthetic role' },
    })
    expect(data['@graph']).toEqual([
      {
        '@type': 'WebSite',
        '@id': 'https://example.com/#website',
        url: 'https://example.com/en',
        name: 'MARTIN.G',
        description: 'Synthetic description',
        inLanguage: 'en',
        publisher: { '@id': 'https://example.com/#person' },
      },
      {
        '@type': 'Person',
        '@id': 'https://example.com/#person',
        name: 'Synthetic Person',
        jobTitle: 'Synthetic role',
        url: 'https://example.com/en',
      },
    ])
  })

  it('cannot close its script element early', () => {
    const json = serializeJsonLd({ text: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('<')
    expect(JSON.parse(json)).toEqual({ text: '</script><script>alert(1)</script>' })
  })
})

describe('security headers', () => {
  afterEach(() => vi.unstubAllEnvs())

  const header = (production: boolean, key: string) =>
    securityHeaders(production).find((h) => h.key === key)?.value

  it('apply to every path, by deployment', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const production = (await nextConfig.headers?.()) ?? []
    expect(production).toEqual([{ source: '/:path*', headers: securityHeaders(true) }])
    vi.stubEnv('VERCEL_ENV', 'preview')
    const preview = (await nextConfig.headers?.()) ?? []
    expect(preview).toEqual([{ source: '/:path*', headers: securityHeaders(false) }])
  })

  it('production is https only, subdomains included, and indexable', () => {
    expect(header(true, 'Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains')
    expect(header(true, 'Content-Security-Policy')).toContain('upgrade-insecure-requests')
    expect(header(true, 'X-Robots-Tag')).toBeUndefined()
  })

  it('other builds send no HSTS, never upgrade http, and are noindex', () => {
    expect(header(false, 'Strict-Transport-Security')).toBeUndefined()
    expect(header(false, 'Content-Security-Policy')).not.toContain('upgrade-insecure-requests')
    expect(header(false, 'X-Robots-Tag')).toBe('noindex, nofollow')
  })

  it('keep the shared baseline in every build', () => {
    for (const production of [true, false]) {
      expect(header(production, 'X-Content-Type-Options')).toBe('nosniff')
      expect(header(production, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(header(production, 'X-Frame-Options')).toBe('DENY')
      expect(header(production, 'Cross-Origin-Opener-Policy')).toBe('same-origin')
      const permissions = header(production, 'Permissions-Policy')!
      for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
        expect(permissions).toContain(`${feature}=()`)
      }
      // The retired FLoC token is gone; Topics replaced it.
      expect(permissions).not.toContain('interest-cohort')
      expect(permissions).toContain('browsing-topics=()')

      const csp = header(production, 'Content-Security-Policy')!
      const directives = Object.fromEntries(
        csp.split(';').map((d) => {
          const [name = '', ...values] = d.trim().split(/\s+/)
          return [name, values.join(' ')]
        }),
      )
      expect(directives['default-src']).toBe("'self'")
      expect(directives['script-src']).toBe("'self' 'unsafe-inline' https://cdn.enable.co.il")
      expect(csp).not.toContain('unsafe-eval')
      expect(directives['frame-ancestors']).toBe("'none'")
      expect(directives['object-src']).toBe("'none'")
      expect(directives['form-action']).toBe("'self'")
      expect(directives['base-uri']).toBe("'self'")
    }
  })
})

describe('homepage title and theme color', () => {
  it('the homepage has a search title in each locale, beyond the brand name', () => {
    expect(getDictionary('en').site.title).toBe('MARTIN.G · Product Builder')
    expect(getDictionary('he').site.title).toBe('MARTIN.G · בניית מוצרים דיגיטליים')
  })

  it('theme-color and the manifest use the page background token', () => {
    const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8')
    expect(tokens).toMatch(new RegExp(`--mg-black:\\s*${brandSurface};`))
    expect(tokens).toMatch(/--surface-0:\s*var\(--mg-black\);/)
    expect(manifest()).toMatchObject({ theme_color: brandSurface, background_color: brandSurface })
  })
})
