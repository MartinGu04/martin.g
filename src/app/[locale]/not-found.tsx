'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { defaultLocale, isLocale } from '@/i18n/config'
import { notFoundCopy } from '@/i18n/dictionaries/not-found'
import { Grid } from '@/components/layout/Grid'
import styles from './not-found.module.css'

/** Not-found boundaries receive no params, so the locale is read on the client. */
export default function LocaleNotFound() {
  const params = useParams<{ locale?: string }>()
  const locale = isLocale(params.locale) ? params.locale : defaultLocale
  const copy = notFoundCopy[locale]
  return (
    <Grid className={styles.wrap}>
      <div className="col-main stack stack-md">
        <p className="t-label muted t-numeric">404</p>
        <h1 className="t-heading-1">{copy.title}</h1>
        <p className="t-lead muted measure-lead">{copy.body}</p>
        <p className="t-body prose">
          <Link href={`/${locale}`}>{copy.back}</Link>
        </p>
      </div>
    </Grid>
  )
}
