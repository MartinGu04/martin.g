export const locales = ['en', 'he'] as const
export type Locale = (typeof locales)[number]

/** The site's primary language: unprefixed URLs resolve here unless the visitor chose otherwise. */
export const defaultLocale: Locale = 'he'

export const localeCookie = 'NEXT_LOCALE'

/**
 * Request header the proxy sets on locale-prefixed URLs, so the not-found page (which has
 * no route params) can answer a missing /en or /he address in that language.
 */
export const localeHeader = 'x-mg-locale'

export type Direction = 'ltr' | 'rtl'

export const localeMeta = {
  en: { dir: 'ltr', ogLocale: 'en_US', nativeName: 'English' },
  he: { dir: 'rtl', ogLocale: 'he_IL', nativeName: 'עברית' },
} as const satisfies Record<Locale, { dir: Direction; ogLocale: string; nativeName: string }>

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export function directionOf(locale: Locale): Direction {
  return localeMeta[locale].dir
}

/** Localized value: every locale must be present, so a missing translation is a type error. */
export type Localized<T = string> = Readonly<Record<Locale, T>>

/** Copy review state. Production builds refuse draft copy (see release-gate.ts). */
export type ReviewStatus = 'draft' | 'approved'
