import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import '@/styles/global.css'
import { fontVariables } from '@/styles/fonts'
import { directionOf, isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { assertReleasableArtwork, assertReleasableCopy } from '@/i18n/release-gate'
import { contactCopy } from '@/i18n/dictionaries/contact'
import { homeCopy } from '@/i18n/dictionaries/home'
import { assertContactDelivery } from '@/lib/contact/notifiers'
import { assertLeadStorage } from '@/lib/leads/config'
import { assertAdminConfiguration } from '@/lib/admin/config'
import { openGraphLocales, siteUrl } from '@/lib/site'
import { brandSurface } from '@/lib/theme'
import { SkipLink } from '@/components/layout/SkipLink'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { MotionController } from '@/components/motion/MotionController'
import { motionHeadScript } from '@/components/motion/motion-script'
import { EnableWidget } from '@/components/a11y/EnableWidget'

export const dynamicParams = false

export function generateStaticParams() {
  // Configuration first, so a missing variable is named even while copy awaits approval.
  assertContactDelivery()
  assertLeadStorage()
  assertAdminConfiguration()
  // A production build without its canonical origin fails here, before any page renders.
  siteUrl()
  assertReleasableArtwork()
  assertReleasableCopy()
  return locales.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: brandSurface,
  colorScheme: 'dark',
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  // Site-wide defaults only. Canonical URLs and complete Open Graph blocks belong to each
  // indexable page (pageMetadata in src/lib/site.ts), so a page without its own metadata
  // (the noindex specimen) never inherits the homepage's canonical URL.
  return {
    metadataBase: siteUrl(),
    title: { default: dict.site.name, template: `%s · ${dict.site.name}` },
    description: dict.site.description,
    openGraph: {
      siteName: dict.site.name,
      ...openGraphLocales(locale),
      type: 'website',
    },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const contact = contactCopy[locale]
  // About's label is the About scene's own approved title ("About" / "אודות").
  const labels = { about: homeCopy[locale].about.title, contact }

  return (
    // suppressHydrationWarning: the motion head script sets data-motion before hydration.
    <html
      lang={locale}
      dir={directionOf(locale)}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionHeadScript }} />
      </head>
      <body>
        <SkipLink label={dict.a11y.skipToContent} />
        <SiteHeader locale={locale} dict={dict} labels={labels} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} labels={labels} contact={contact} />
        <MotionController />
        <EnableWidget />
      </body>
    </html>
  )
}
