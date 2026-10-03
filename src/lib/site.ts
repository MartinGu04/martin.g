import type { Metadata } from 'next'
import { defaultLocale, localeMeta, locales, type Locale } from '@/i18n/config'

type Env = Record<string, string | undefined>

/**
 * The origin of every absolute URL: canonical URLs, hreflang alternates, Open Graph URLs
 * and images, the sitemap, robots.txt and structured data. Server-side only; never exposed
 * through NEXT_PUBLIC_ variables. No domain is written in the code.
 *
 * - Vercel production: `SITE_URL`, required (https://martin-g.dev, set in the Vercel
 *   project for the Production environment only). It must be an https origin that is not
 *   localhost; anything else fails the build, so the production site can never publish
 *   another host as its canonical address.
 * - Vercel preview: the deployment's own branch URL (or its unique URL). `SITE_URL` is
 *   ignored here, so a preview, which is noindex, never claims the production domain or
 *   points its social images at files production may not have.
 * - Local, CI and `vercel dev`: `SITE_URL` when set, else http://localhost:3000.
 */
export function siteUrl(env: Env = process.env): URL {
  if (env.VERCEL_ENV === 'production') {
    if (!env.SITE_URL?.trim()) {
      throw new Error('[site] A production build needs SITE_URL (the canonical https origin).')
    }
    const url = parseSiteUrl(env.SITE_URL)
    if (url.protocol !== 'https:' || url.hostname === 'localhost') {
      throw new Error(`[site] A production build needs an https site origin, not ${url.origin}.`)
    }
    return url
  }
  if (env.VERCEL_ENV === 'preview') {
    const host = env.VERCEL_BRANCH_URL || env.VERCEL_URL
    if (host) return new URL(`https://${host}`)
  }
  const explicit = env.SITE_URL?.trim()
  return explicit ? parseSiteUrl(explicit) : new URL('http://localhost:3000')
}

function parseSiteUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('[site] SITE_URL is not a valid URL.')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('[site] SITE_URL must be an http(s) URL.')
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('[site] SITE_URL must be an origin only, such as https://example.com.')
  }
  return new URL(url.origin)
}

/**
 * Only the Vercel production deployment may be indexed. Preview, local and CI builds are
 * served with `X-Robots-Tag: noindex` (next.config.ts) and a robots.txt that disallows
 * everything, so a preview URL never competes with the real site in search results.
 */
export function isIndexable(env: Env = process.env): boolean {
  return env.VERCEL_ENV === 'production'
}

/** Canonical + hreflang alternates for a locale-agnostic path such as '' or '/work/on'. */
export function localeAlternates(locale: Locale, path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const l of locales) languages[l] = `/${l}${path}`
  languages['x-default'] = `/${defaultLocale}${path}`
  return { canonical: `/${locale}${path}`, languages }
}

/** Open Graph locale of a page, and of its translations. */
export function openGraphLocales(locale: Locale): { locale: string; alternateLocale: string[] } {
  return {
    locale: localeMeta[locale].ogLocale,
    alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].ogLocale),
  }
}

/** A social preview image: an approved asset, with its intrinsic size and localized alt. */
export interface SocialImage {
  url: string
  width: number
  height: number
  alt: string
}

interface PageMetadataInput {
  locale: Locale
  /** Locale-agnostic path: '' for home, '/contact', '/work/on'. */
  path: string
  /** The document title; the layout's template adds the site name (unless `absolute`). */
  title: string | { absolute: string }
  description: string
  siteName: string
  type?: 'website' | 'article'
  /** Social preview image; without one, cards fall back to the text-only summary. */
  image?: SocialImage
}

/**
 * The metadata of every indexable page, in one shape: title, description, the canonical
 * URL and its hreflang alternates, and an Open Graph block whose URL is the canonical one.
 * Next derives the Twitter card from it (`summary_large_image` with an image, `summary`
 * without). A page's Open Graph block replaces the layout's rather than merging with it,
 * so it is always complete here. Relative URLs resolve against the layout's metadataBase.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  siteName,
  type = 'website',
  image,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: {
      // Omitting the title lets Open Graph use the resolved document title, template
      // included, so a shared link reads like the browser tab.
      description,
      siteName,
      ...openGraphLocales(locale),
      type,
      url: `/${locale}${path}`,
      ...(image ? { images: [image] } : {}),
    },
  }
}
