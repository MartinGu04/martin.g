import 'server-only'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ConfidentialProject, ProjectYears, PublicProject } from './schema'

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
}

export interface ConfidentialProjectSummary {
  id: string
  title: string
  summary: string
  disciplines: string[]
  years?: string
  pattern: ConfidentialProject['cover']['pattern']
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
    pattern: project.cover.pattern,
    ...(years ? { years } : {}),
  }
}
