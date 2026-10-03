import type { Locale } from '@/i18n/config'

interface HomeStructuredDataInput {
  locale: Locale
  /** The canonical origin (siteUrl()). */
  origin: URL
  siteName: string
  description: string
  person: { name: string; role: string }
}

/**
 * schema.org JSON-LD for the homepage: the site (its name is what search engines show as
 * the site name, "MARTIN.G" rather than a domain) and the person behind it. Facts only,
 * all of them approved copy already on the page: no ratings, clients, awards or claims.
 */
export function homeStructuredData({
  locale,
  origin,
  siteName,
  description,
  person,
}: HomeStructuredDataInput) {
  const home = new URL(`/${locale}`, origin).toString()
  const personId = new URL('/#person', origin).toString()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': new URL('/#website', origin).toString(),
        url: home,
        name: siteName,
        description,
        inLanguage: locale,
        publisher: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: person.name,
        jobTitle: person.role,
        url: home,
      },
    ],
  }
}

/** JSON for an inline `application/ld+json` block, safe against closing the script early. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
