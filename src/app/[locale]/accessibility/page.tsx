import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { accessibilityCopy } from '@/i18n/dictionaries/accessibility'
import { pageMetadata } from '@/lib/site'
import { siteSocialImage } from '@/lib/social'
import { TrustPage } from '@/components/trust/TrustPage'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/accessibility'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { seo } = accessibilityCopy[locale]
  const { site } = getDictionary(locale)
  return pageMetadata({
    locale,
    path: '/accessibility',
    title: seo.title,
    description: seo.description,
    siteName: site.name,
    // No artwork of its own: the locale's site card.
    image: siteSocialImage(locale, site),
  })
}

/** Accessibility (Phase 6). Copy: src/i18n/dictionaries/accessibility.ts (draft until approved). */
export default async function AccessibilityPage({ params }: PageProps<'/[locale]/accessibility'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <TrustPage copy={accessibilityCopy[locale]} locale={locale} />
}
