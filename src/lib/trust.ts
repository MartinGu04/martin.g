import type { Route } from 'next'
import type { Locale } from '@/i18n/config'
import type { TrustPage } from '@/i18n/dictionaries/legal'

/** The Phase 6 destinations: the project inquiry, Privacy and Accessibility. */
export function trustHref(locale: Locale, page: TrustPage): Route {
  return `/${locale}/${page}` as Route
}
