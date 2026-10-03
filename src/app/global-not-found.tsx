import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import '@/styles/global.css'
import { fontVariables } from '@/styles/fonts'
import { directionOf, isLocale, localeHeader, localeMeta, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { notFoundCopy } from '@/i18n/dictionaries/not-found'
import { contactCopy } from '@/i18n/dictionaries/contact'
import { homeCopy } from '@/i18n/dictionaries/home'
import { Cell, Grid } from '@/components/layout/Grid'
import { SkipLink } from '@/components/layout/SkipLink'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { NotFoundContent } from '@/components/layout/NotFoundContent'
import { MotionController } from '@/components/motion/MotionController'
import { motionHeadScript } from '@/components/motion/motion-script'
import { EnableWidget } from '@/components/a11y/EnableWidget'
import { Wordmark } from '@/components/brand/BrandMark'
import styles from './global-not-found.module.css'

export const metadata: Metadata = {
  title: `404 · MARTIN.G`,
}

/**
 * Every 404 is rendered here, on the server, so it is complete without JavaScript. (Next
 * renders [locale]/not-found.tsx only in the browser after a server-side notFound().)
 * A missing /en or /he address is answered in that language, inside the site's header and
 * footer: the proxy passes the URL's locale in `localeHeader`. URLs outside any locale get
 * the bilingual page.
 */
export default async function GlobalNotFound() {
  const locale = (await headers()).get(localeHeader)
  return isLocale(locale) ? <LocaleNotFoundDocument locale={locale} /> : <BilingualNotFound />
}

/** The locale layout's document (src/app/[locale]/layout.tsx) around the locale's 404. */
function LocaleNotFoundDocument({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const contact = contactCopy[locale]
  const labels = { about: homeCopy[locale].about.title, contact }
  return (
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
          <NotFoundContent locale={locale} />
        </main>
        <SiteFooter locale={locale} dict={dict} labels={labels} contact={contact} />
        <MotionController />
        <EnableWidget />
      </body>
    </html>
  )
}

/** For URLs outside any locale (e.g. an unsupported locale prefix). */
function BilingualNotFound() {
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <body>
        <header>
          <Grid className={styles.bar}>
            <Cell span={{ base: 4, md: 8, lg: 12 }}>
              <Link href="/en" hrefLang="en" className={styles.home}>
                <Wordmark height="1.125rem" />
              </Link>
            </Cell>
          </Grid>
        </header>
        <main id="main">
          <Grid>
            <Cell span={{ base: 4, md: 4, lg: 6 }} className={styles.copy}>
              <p className="t-label muted">404</p>
              <h1 className="t-heading-2">{notFoundCopy.en.title}</h1>
              <p>
                <Link href="/en" hrefLang="en">
                  {notFoundCopy.en.back}
                </Link>
              </p>
            </Cell>
            <Cell span={{ base: 4, md: 4, lg: 6 }} className={styles.copy}>
              <div lang="he" dir={localeMeta.he.dir}>
                <p className="t-label muted">404</p>
                <h2 className="t-heading-2">{notFoundCopy.he.title}</h2>
                <p>
                  <Link href="/he" hrefLang="he">
                    {notFoundCopy.he.back}
                  </Link>
                </p>
              </div>
            </Cell>
          </Grid>
        </main>
        <EnableWidget />
      </body>
    </html>
  )
}
