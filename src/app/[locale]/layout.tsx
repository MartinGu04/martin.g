import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import '@/styles/global.css'
import { fontVariables } from '@/styles/fonts'
import { directionOf, isLocale, localeMeta, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { assertReleasableCopy } from '@/i18n/release-gate'
import { contactCopy } from '@/i18n/dictionaries/contact'
import { assertContactDelivery } from '@/lib/contact/notifiers'
import { localeAlternates, siteUrl } from '@/lib/site'
import { SkipLink } from '@/components/layout/SkipLink'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { MotionController } from '@/components/motion/MotionController'
import { motionHeadScript } from '@/components/motion/motion-script'
import { EnableWidget } from '@/components/a11y/EnableWidget'

export const dynamicParams = false

export function generateStaticParams() {
  assertReleasableCopy()
  assertContactDelivery()
  return locales.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: '#0b0b0b',
  colorScheme: 'dark',
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return {
    metadataBase: siteUrl(),
    title: { default: dict.site.name, template: `%s · ${dict.site.name}` },
    description: dict.site.description,
    alternates: localeAlternates(locale, ''),
    openGraph: {
      siteName: dict.site.name,
      locale: localeMeta[locale].ogLocale,
      type: 'website',
    },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const contact = contactCopy[locale]

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
        <SiteHeader locale={locale} dict={dict} contact={contact} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} contact={contact} />
        <MotionController />
        <EnableWidget />
      </body>
    </html>
  )
}
