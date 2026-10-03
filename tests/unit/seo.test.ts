import { afterEach, describe, expect, it, vi } from 'vitest'
import nextConfig from '../../next.config'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { isIndexable, openGraphLocales, pageMetadata, siteUrl } from '@/lib/site'
import { homeStructuredData, serializeJsonLd } from '@/lib/structured-data'

describe('site origin', () => {
  it('falls back to Vercel’s production domain, then localhost', () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'example.vercel.app' }).origin).toBe(
      'https://example.vercel.app',
    )
    expect(siteUrl({}).origin).toBe('http://localhost:3000')
  })

  it('prefers SITE_URL and normalizes it to an origin', () => {
    const url = siteUrl({
      SITE_URL: ' https://example.com/ ',
      VERCEL_PROJECT_PRODUCTION_URL: 'example.vercel.app',
    })
    expect(url.toString()).toBe('https://example.com/')
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
    }
  })

  it('refuses a development origin in a Vercel production build', () => {
    expect(() => siteUrl({ VERCEL_ENV: 'production' })).toThrow(/https site origin/)
    expect(() => siteUrl({ VERCEL_ENV: 'production', SITE_URL: 'http://example.com' })).toThrow(
      /https site origin/,
    )
    expect(
      siteUrl({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'example.com' }).origin,
    ).toBe('https://example.com')
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
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'example.com')
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://example.com/sitemap.xml',
    })
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } })
  })

  it('sends X-Robots-Tag: noindex outside production only', async () => {
    const robotsHeader = async () => {
      const rules = (await nextConfig.headers?.()) ?? []
      return rules.flatMap((rule) => rule.headers).find((header) => header.key === 'X-Robots-Tag')
        ?.value
    }
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(await robotsHeader()).toBe('noindex, nofollow')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(await robotsHeader()).toBeUndefined()
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
