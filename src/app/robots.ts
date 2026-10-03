import type { MetadataRoute } from 'next'
import { isIndexable, siteUrl } from '@/lib/site'

/**
 * The production deployment is open to crawlers and names its sitemap. Every other build
 * (preview, local, CI) disallows everything; next.config.ts also marks it noindex.
 * Non-public routes need no entry: the specimen is a 404 in production and noindex
 * elsewhere, and confidential work has no routes at all.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', siteUrl()).toString(),
  }
}
