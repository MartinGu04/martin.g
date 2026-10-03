import 'server-only'
import { locales } from '@/i18n/config'
import { loadSiteTranslations, type Translations } from '@/lib/projects/translations'
import { getProjectSequence, getPublicProject } from './registry'
import type { Project } from './schema'

/*
 * The public site's projects with the copy saved in the admin's project editor (Phase 8C).
 * A saved row replaces the title and short description in its own locale only; the other
 * locale, and every shared property, stay the registry's. Read at build time, so the
 * statically generated pages carry the saved copy and the leak check sees it.
 */

export function withSavedCopy<T extends Project>(project: T, translations: Translations): T {
  const saved = translations.get(project.id)
  if (!saved) return project
  const title = { ...project.title }
  const summary = { ...project.summary }
  for (const locale of locales) {
    const copy = saved[locale]
    if (!copy) continue
    title[locale] = copy.title
    summary[locale] = copy.summary
  }
  return { ...project, title, summary }
}

export async function getSiteProjectSequence() {
  const translations = await loadSiteTranslations()
  return getProjectSequence().map(({ project, number }) => ({
    project: withSavedCopy(project, translations),
    number,
  }))
}

export async function getSitePublicProject(slug: string) {
  const project = getPublicProject(slug)
  return project ? withSavedCopy(project, await loadSiteTranslations()) : undefined
}
