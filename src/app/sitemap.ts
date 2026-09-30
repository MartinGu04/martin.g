import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'
import { getPublicProjects } from '@/content/registry'
import { siteUrl } from '@/lib/site'

/** Public routes only. Confidential work has no routes and never appears here. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const paths = ['', ...getPublicProjects().map((p) => `/work/${p.id}`)]
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: new URL(`/${locale}${path}`, base).toString(),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, new URL(`/${l}${path}`, base).toString()]),
        ),
      },
    })),
  )
}
