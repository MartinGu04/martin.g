import { defaultLocale, isLocale, type Locale } from './config'

/**
 * The locale for an unprefixed URL: the visitor's explicit choice (the cookie the language
 * switch sets) wins, otherwise the site's default, Hebrew. The browser language is not
 * consulted, so / always opens the Hebrew site until someone switches.
 */
export function negotiateLocale(input: { cookie?: string | undefined }): Locale {
  return isLocale(input.cookie) ? input.cookie : defaultLocale
}

/** Returns the locale prefix of a pathname, if any. */
export function localeFromPathname(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1]
  return isLocale(segment) ? segment : undefined
}
