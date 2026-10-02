import type { Route } from 'next'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ContactCopy } from '@/i18n/dictionaries/contact'
import { trustHref } from './trust'

/**
 * Navigation. Only destinations that exist are listed: no placeholders, no dead links.
 * Contact arrived with Phase 6, and About (the homepage scene, not a page of its own) with
 * it; e2e tests assert that every header and footer link resolves.
 */
export interface NavLink {
  key: string
  href: Route
  label: string
}

/** The labels the navigation borrows: About from the approved homepage copy (its scene's own
 * title), Contact from the Phase 6 copy. */
export interface NavLabels {
  about: string
  contact: Pick<ContactCopy, 'nav'>
}

/**
 * Header and footer: the work, who is behind it (the homepage's About scene, from any page),
 * then the project inquiry.
 */
export function primaryNav(locale: Locale, dict: Dictionary, labels: NavLabels): NavLink[] {
  return [
    { key: 'work', href: `/${locale}#work` as Route, label: dict.nav.work },
    { key: 'about', href: `/${locale}#about` as Route, label: labels.about },
    { key: 'contact', href: trustHref(locale, 'contact'), label: labels.contact.nav },
  ]
}

/** Footer only: the trust pages. */
export function trustNav(locale: Locale, contact: Pick<ContactCopy, 'footer'>): NavLink[] {
  return [
    { key: 'privacy', href: trustHref(locale, 'privacy'), label: contact.footer.privacy },
    {
      key: 'accessibility',
      href: trustHref(locale, 'accessibility'),
      label: contact.footer.accessibility,
    },
  ]
}
