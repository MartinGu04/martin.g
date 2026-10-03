import type { Metadata } from 'next'
import { defaultLocale, localeMeta, locales, type Locale } from '@/i18n/config'

type Env = Record<string, string | undefined>

/**
 * The canonical origin for metadata, the sitemap and robots.txt. Server-side only; never
 * exposed through NEXT_PUBLIC_ variables.
 *
 * `SITE_URL` pins it (an origin such as https://example.com, nothing after it). Without
 * it, Vercel's `VERCEL_PROJECT_PRODUCTION_URL` is used: the project's shortest production
 * custom domain, or its vercel.app domain while it has none. Local and CI builds fall back
 * to http://localhost:3000. A Vercel production build refuses anything but an https
 * origin that is not localhost, so canonical URLs can never point at a development host.
 */
export function siteUrl(env: Env = process.env): URL {
  const url = resolveSiteUrl(env)
  if (env.VERCEL_ENV === 'production') {
    if (url.protocol !== 'https:' || url.hostname === 'localhost') {
      throw new Error(`[site] A production build needs an https site origin, not ${url.origin}.`)
    }
  }
  return url
}

function resolveSiteUrl(env: Env): URL {
  const explicit = env.SITE_URL?.trim()
  if (explicit) {
    let url: URL
    try {
      url = new URL(explicit)
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
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return new URL(`https://${vercel}`)
  return new URL('http://localhost:3000')
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
