import type { Metadata, Route } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { contactCopy } from '@/i18n/dictionaries/contact'
import { pageMetadata } from '@/lib/site'
import { trustHref } from '@/lib/trust'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Scene } from '@/components/scene/Scene'
import { ContactExperience } from '@/components/contact/ContactExperience'
import styles from './page.module.css'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { seo } = contactCopy[locale]
  return pageMetadata({
    locale,
    path: '/contact',
    title: seo.title,
    description: seo.description,
    siteName: getDictionary(locale).site.name,
  })
}

/**
 * The project inquiry (Phase 6): the homepage's closing scene extended into a focused
 * conversation, in the same lighter graphite and amber. Calm, not theatrical: the work
 * pages already did the convincing, so the form is the hero. Statically generated; the
 * form posts to a server action (src/lib/contact/action.ts).
 */
export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const copy = contactCopy[locale]
  return (
    <Scene
      theme={worlds.graphite}
      as="div"
      atmosphere={{ light: 'pool', grid: 'hidden', texture: 'grain', vignette: false }}
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <ContactExperience
          locale={locale}
          page={copy.page}
          form={copy.form}
          success={copy.success}
          privacyHref={trustHref(locale, 'privacy')}
          workHref={`/${locale}#work` as Route}
        />
      </Grid>
    </Scene>
  )
}
