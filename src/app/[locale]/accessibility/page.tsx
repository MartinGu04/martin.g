import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { accessibilityCopy } from '@/i18n/dictionaries/accessibility'
import { localeAlternates } from '@/lib/site'
import { TrustPage } from '@/components/trust/TrustPage'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/accessibility'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { seo } = accessibilityCopy[locale]
  return {
    title: seo.title,
    description: seo.description,
    alternates: localeAlternates(locale, '/accessibility'),
  }
}

/** Accessibility (Phase 6). Copy: src/i18n/dictionaries/accessibility.ts (draft until approved). */
export default async function AccessibilityPage({ params }: PageProps<'/[locale]/accessibility'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <TrustPage copy={accessibilityCopy[locale]} locale={locale} />
}
