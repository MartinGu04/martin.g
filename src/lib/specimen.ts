/**
 * The design-system specimen (/[locale]/system) exists for QA in local, CI and preview
 * builds only. Vercel production builds render a 404 for it, it is marked noindex, it is
 * not in the sitemap and nothing links to it.
 */
export function isSpecimenEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV !== 'production'
}
