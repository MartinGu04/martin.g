import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { isSpecimenEnabled } from '@/lib/specimen'
import { Grid } from '@/components/layout/Grid'
import { conceptCopy, conceptKeys } from './_shared/concept-copy'

export const metadata: Metadata = {
  title: 'Concepts',
  robots: { index: false, follow: false },
}

/** Index of the TEMPORARY art-direction concepts. Preview builds only. */
export default async function ConceptsIndex({ params }: PageProps<'/[locale]/system/concepts'>) {
  const { locale } = await params
  if (!isLocale(locale) || !isSpecimenEnabled()) notFound()
  return (
    <Grid className="section">
      <div className="col-main stack stack-md">
        <p className="t-label muted">{conceptCopy.index.note[locale]}</p>
        <h1 className="t-heading-1">{conceptCopy.index.title[locale]}</h1>
        <ul role="list" className="stack stack-sm t-heading-3 prose">
          {conceptKeys.map((key) => (
            <li key={key}>
              <Link href={`/${locale}/system/concepts/${key}`}>
                {conceptCopy.names[key][locale]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Grid>
  )
}
