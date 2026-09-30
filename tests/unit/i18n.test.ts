import { describe, expect, it } from 'vitest'
import { EM_DASH } from '../../scripts/lint-policy.mjs'
import { directionOf, isLocale, locales } from '@/i18n/config'
import { dictionaries } from '@/i18n/dictionaries'
import { notFoundCopy } from '@/i18n/dictionaries/not-found'
import { format } from '@/i18n/get-dictionary'
import { localeFromPathname, negotiateLocale, parseAcceptLanguage } from '@/i18n/negotiate'

function shape(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k))
}

function leaves(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object' || value === null) return []
  return Object.values(value).flatMap(leaves)
}

describe('locale config', () => {
  it('maps directions', () => {
    expect(directionOf('en')).toBe('ltr')
    expect(directionOf('he')).toBe('rtl')
  })

  it('validates locales', () => {
    expect(isLocale('he')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

describe('negotiation', () => {
  it('prefers the cookie, then Accept-Language, then English', () => {
    expect(negotiateLocale({ cookie: 'he', acceptLanguage: 'en-US' })).toBe('he')
    expect(negotiateLocale({ cookie: 'xx', acceptLanguage: 'he-IL,he;q=0.9' })).toBe('he')
    expect(negotiateLocale({ acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('en')
    expect(negotiateLocale({})).toBe('en')
  })

  it('respects quality values and the legacy iw code', () => {
    expect(negotiateLocale({ acceptLanguage: 'en;q=0.5, he;q=0.8' })).toBe('he')
    expect(negotiateLocale({ acceptLanguage: 'iw' })).toBe('he')
    expect(negotiateLocale({ acceptLanguage: 'fr, en;q=0.1' })).toBe('en')
    expect(negotiateLocale({ acceptLanguage: 'he;q=0' })).toBe('en')
  })

  it('parses malformed headers safely', () => {
    expect(parseAcceptLanguage(',,; q=abc')).toEqual([])
  })

  it('reads the locale prefix of a path', () => {
    expect(localeFromPathname('/he/work/on')).toBe('he')
    expect(localeFromPathname('/en')).toBe('en')
    expect(localeFromPathname('/english')).toBeUndefined()
    expect(localeFromPathname('/')).toBeUndefined()
  })
})

describe('dictionaries', () => {
  it('have identical shapes in every locale', () => {
    const reference = shape(dictionaries.en.messages).sort()
    for (const locale of locales)
      expect(shape(dictionaries[locale].messages).sort()).toEqual(reference)
  })

  it('have no empty strings and no em dashes', () => {
    for (const locale of locales) {
      for (const s of [...leaves(dictionaries[locale].messages), ...leaves(notFoundCopy[locale])]) {
        expect(s.trim()).not.toBe('')
        expect(s).not.toContain(EM_DASH)
      }
    }
  })

  it('interpolates values', () => {
    expect(format('© {year} Martin Gusin', { year: 2026 })).toBe('© 2026 Martin Gusin')
    expect(format('{missing}', {})).toBe('{missing}')
  })
})
