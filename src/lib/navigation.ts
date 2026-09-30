import type { Route } from 'next'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'

/**
 * Primary navigation. Only destinations that exist are listed: no placeholders, no dead
 * links. About is added with the About section and Contact with Phase 6; e2e tests assert
 * that every header and footer link resolves.
 */
const primaryItems = [{ key: 'work', hash: 'work' }] as const satisfies readonly {
  key: keyof Dictionary['nav']
  hash: string
}[]

export interface NavLink {
  key: string
  href: Route
  label: string
}

export function primaryNav(locale: Locale, dict: Dictionary): NavLink[] {
  return primaryItems.map((item) => ({
    key: item.key,
    href: `/${locale}#${item.hash}` as Route,
    label: dict.nav[item.key],
  }))
}
