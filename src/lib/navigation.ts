import type { Route } from 'next'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ContactCopy } from '@/i18n/dictionaries/contact'
import { trustHref } from './trust'

/**
 * Navigation. Only destinations that exist are listed: no placeholders, no dead links.
 * Contact arrived with Phase 6; e2e tests assert that every header and footer link
 * resolves.
 */
export interface NavLink {
  key: string
  href: Route
  label: string
}

/** Header and footer: the work, then the project inquiry. */
export function primaryNav(
  locale: Locale,
  dict: Dictionary,
  contact: Pick<ContactCopy, 'nav'>,
): NavLink[] {
  return [
    { key: 'work', href: `/${locale}#work` as Route, label: dict.nav.work },
    { key: 'contact', href: trustHref(locale, 'contact'), label: contact.nav },
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
