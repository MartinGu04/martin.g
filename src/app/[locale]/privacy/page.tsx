import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { privacyCopy } from '@/i18n/dictionaries/privacy'
import { pageMetadata } from '@/lib/site'
import { TrustPage } from '@/components/trust/TrustPage'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { seo } = privacyCopy[locale]
  return pageMetadata({
    locale,
    path: '/privacy',
    title: seo.title,
    description: seo.description,
    siteName: getDictionary(locale).site.name,
  })
}

/** Privacy (Phase 6). Copy: src/i18n/dictionaries/privacy.ts (draft until approved). */
export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <TrustPage copy={privacyCopy[locale]} locale={locale} />
}
