import type { Metadata } from 'next'
import { defaultLocale, locales, type Locale } from '@/i18n/config'

/** Server-side only. Never exposed through NEXT_PUBLIC_ variables. */
export function siteUrl(): URL {
  const explicit = process.env.SITE_URL
  if (explicit) return new URL(explicit)
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return new URL(`https://${vercel}`)
  return new URL('http://localhost:3000')
}

/** Canonical + hreflang alternates for a locale-agnostic path such as '' or '/work/on'. */
export function localeAlternates(locale: Locale, path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const l of locales) languages[l] = `/${l}${path}`
  languages['x-default'] = `/${defaultLocale}${path}`
  return { canonical: `/${locale}${path}`, languages }
}
