import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getProjectSequence } from '@/content/registry'
import { resolvePublicSummary } from '@/content/resolve'
import { isSpecimenEnabled } from '@/lib/specimen'
import { qaThemes } from '../../qa-themes'
import { ConceptScaffold } from '../_shared/ConceptScaffold'
import { conceptKeys, type ConceptKey } from '../_shared/concept-copy'
import a from '../_shared/direction-a.module.css'
import b from '../_shared/direction-b.module.css'
import c from '../_shared/direction-c.module.css'

export const dynamicParams = false

export function generateStaticParams() {
  return conceptKeys.map((direction) => ({ direction }))
}

export const metadata: Metadata = {
  title: 'Concept',
  robots: { index: false, follow: false },
}

const styles: Record<ConceptKey, Readonly<Record<string, string>>> = { a, b, c }

/** TEMPORARY art-direction concepts for review. Preview builds only (404 in production). */
export default async function ConceptPage({
  params,
}: PageProps<'/[locale]/system/concepts/[direction]'>) {
  const { locale, direction } = await params
  if (!isLocale(locale) || !isSpecimenEnabled() || !conceptKeys.includes(direction as ConceptKey)) {
    notFound()
  }
  const key = direction as ConceptKey
  const dict = getDictionary(locale)
  const projects = getProjectSequence().flatMap(({ project, number }) =>
    project.visibility === 'public'
      ? [{ number, ...resolvePublicSummary(project, locale, dict) }]
      : [],
  )
  return (
    <ConceptScaffold
      s={styles[key]}
      direction={key}
      locale={locale}
      dict={dict}
      projects={projects}
      surfaceTheme={key === 'c' ? qaThemes.inverse : undefined}
    />
  )
}
