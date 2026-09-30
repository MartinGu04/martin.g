'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { defaultLocale, isLocale } from '@/i18n/config'
import { notFoundCopy } from '@/i18n/dictionaries/not-found'
import { Cell, Grid } from '@/components/layout/Grid'
import styles from './not-found.module.css'

/** Not-found boundaries receive no params, so the locale is read on the client. */
export default function LocaleNotFound() {
  const params = useParams<{ locale?: string }>()
  const locale = isLocale(params.locale) ? params.locale : defaultLocale
  const copy = notFoundCopy[locale]
  return (
    <Grid className={styles.wrap}>
      <Cell span={{ base: 4, md: 6, lg: 6 }}>
        <p className="label muted">404</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className="muted">{copy.body}</p>
        <p className={styles.back}>
          <Link href={`/${locale}`}>{copy.back}</Link>
        </p>
      </Cell>
    </Grid>
  )
}
