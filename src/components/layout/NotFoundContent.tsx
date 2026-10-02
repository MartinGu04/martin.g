import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { notFoundCopy } from '@/i18n/dictionaries/not-found'
import { Grid } from '@/components/layout/Grid'
import styles from './NotFoundContent.module.css'

/** A locale's 404: shared by the server-rendered global page and the client boundary. */
export function NotFoundContent({ locale }: { locale: Locale }) {
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
