import 'server-only'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { StaticImageData } from 'next/image'
import {
  INTERFACE_COVER_EXCEPTION,
  type AbstractCover,
  type ConfidentialProject,
  type ExternalUrl,
  type ProjectYears,
  type PublicProject,
} from './schema'

/*
 * Flattens localized content to a single locale on the server. Only these view models
 * reach components, so a page never carries the other locale's copy.
 */

export interface PublicProjectSummary {
  id: string
  href: `/${Locale}/work/${string}`
  title: string
  summary: string
  disciplines: string[]
  years?: string
  /** The live site, when it is approved for public visitors. */
  liveHref?: ExternalUrl
}

export type ConfidentialCoverView =
  | { kind: 'abstract'; pattern: AbstractCover['pattern'] }
  | {
      kind: 'approved-interface'
      src: StaticImageData
      alt: string
      focal: { x: number; y: number }
    }

export interface ConfidentialProjectSummary {
  id: string
  title: string
  summary: string
  disciplines: string[]
  years?: string
  cover: ConfidentialCoverView
}

function confidentialCover(project: ConfidentialProject, locale: Locale): ConfidentialCoverView {
  const cover = project.cover
  if (cover.kind === 'abstract') return { kind: 'abstract', pattern: cover.pattern }
  // The type allows it for confidential-01 only; this keeps it so at runtime as well.
  if (project.id !== INTERFACE_COVER_EXCEPTION)
    throw new Error(`[content] Only ${INTERFACE_COVER_EXCEPTION} may show an interface image.`)
  return {
    kind: 'approved-interface',
    src: cover.src,
    alt: cover.alt[locale],
    focal: cover.focal ?? { x: 0.5, y: 0.5 },
  }
}

export function formatYears(years: ProjectYears | undefined, dict: Dictionary): string | undefined {
  if (!years) return undefined
  if (years.to === undefined || years.to === years.from) return String(years.from)
  const end = years.to === 'present' ? dict.project.present : String(years.to)
  return `${years.from}–${end}`
}

export function resolvePublicSummary(
  project: PublicProject,
  locale: Locale,
  dict: Dictionary,
): PublicProjectSummary {
  const years = formatYears(project.years, dict)
  return {
    id: project.id,
    href: `/${locale}/work/${project.id}`,
    title: project.title[locale],
    summary: project.summary[locale],
    disciplines: project.disciplines.map((d) => dict.disciplines[d]),
    ...(years ? { years } : {}),
    ...(project.links?.live ? { liveHref: project.links.live } : {}),
  }
}

export function resolveConfidentialSummary(
  project: ConfidentialProject,
  locale: Locale,
  dict: Dictionary,
): ConfidentialProjectSummary {
  const years = formatYears(project.years, dict)
  return {
    id: project.id,
    title: project.title[locale],
    summary: project.summary[locale],
    disciplines: project.disciplines.map((d) => dict.disciplines[d]),
    cover: confidentialCover(project, locale),
    ...(years ? { years } : {}),
  }
}
