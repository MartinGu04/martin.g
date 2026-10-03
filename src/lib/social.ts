import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/en'
import type { SocialImage } from '@/lib/site'
import cardEn from '@/assets/social/martin-g-en.png'
import cardHe from '@/assets/social/martin-g-he.png'

/**
 * The MARTIN.G social cards (Phase 7A.3): 1200 x 630, one per locale, rendered by
 * `pnpm brand:og` (scripts/og-cards.mjs) from the approved lockup, the site's fonts and the
 * approved principle. Imported, so they are served from content-hashed URLs: a new render
 * gets a new URL, and platforms that cache previews by URL pick it up.
 *
 * `status` stays 'pending' until Martin approves the artwork; it does not gate builds.
 */
export const siteCards = {
  status: 'pending' as 'pending' | 'approved',
  images: { en: cardEn, he: cardHe } satisfies Record<Locale, unknown>,
}

/**
 * The locale's card, for the homepage and the pages without artwork of their own (Contact,
 * Privacy, Accessibility). Its alt text names what it shows, in approved words only: the
 * brand and its principle, as the hero's heading does ("MARTIN.G: ...").
 */
export function siteSocialImage(locale: Locale, site: Dictionary['site']): SocialImage {
  const image = siteCards.images[locale]
  return {
    url: image.src,
    width: image.width,
    height: image.height,
    alt: `${site.name}: ${site.principle}`,
  }
}
