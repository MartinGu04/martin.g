import { defaultLocale, isLocale, type Locale } from './config'

interface LanguageRange {
  tag: string
  q: number
}

/** Parses an Accept-Language header into ranges ordered by quality (stable for ties). */
export function parseAcceptLanguage(header: string | null | undefined): LanguageRange[] {
  if (!header) return []
  return header
    .split(',')
    .map((part, index) => {
      const [rawTag = '', ...params] = part.trim().split(';')
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1
      return { tag: rawTag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0, index }
    })
    .filter((r) => r.tag.length > 0 && r.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map(({ tag, q }) => ({ tag, q }))
}

function localeFromTag(tag: string): Locale | undefined {
  const primary = tag.split('-')[0]
  // 'iw' is the legacy code for Hebrew and is still sent by some clients.
  if (primary === 'he' || primary === 'iw') return 'he'
  if (primary === 'en') return 'en'
  return undefined
}

/** Explicit choice (cookie) wins, then the browser preference, then the default. */
export function negotiateLocale(input: {
  cookie?: string | undefined
  acceptLanguage?: string | null | undefined
}): Locale {
  if (isLocale(input.cookie)) return input.cookie
  for (const { tag } of parseAcceptLanguage(input.acceptLanguage)) {
    const locale = localeFromTag(tag)
    if (locale) return locale
  }
  return defaultLocale
}

/** Returns the locale prefix of a pathname, if any. */
export function localeFromPathname(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1]
  return isLocale(segment) ? segment : undefined
}
