import 'server-only'
import { locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getAllProjectsForChecks } from '@/content/registry'
import { formatYears } from '@/content/resolve'
import type { Project } from '@/content/schema'
import type { EditorProject, ProjectCopy, SharedFacts } from './copy-rules'
import {
  configuredContentClient,
  readTranslations,
  TranslationsError,
  type Translations,
} from './translations'

/*
 * The admin's view of the projects (Phase 8C): one EditorProject per registered project
 * (src/lib/projects/copy-rules.ts). Nothing here is ever rendered on the public site.
 */

function mediaOf(project: Project): string {
  if (project.visibility === 'public') return 'Project images and previews (in the code)'
  return project.cover.kind === 'approved-interface'
    ? 'The approved, fully blurred interface image'
    : 'Generated abstract geometry'
}

function sharedFacts(project: Project): SharedFacts {
  const en = getDictionary('en')
  const years = formatYears(project.years, en)
  const liveUrl = project.visibility === 'public' ? project.links?.live : undefined
  return {
    visibility: project.visibility === 'public' ? 'Public' : 'Confidential',
    status: project.status === 'published' ? 'Published' : 'Draft',
    order: project.order,
    ...(years ? { years } : {}),
    ...(liveUrl ? { liveUrl } : {}),
    media: mediaOf(project),
    disciplines: project.disciplines.map((d) => en.disciplines[d]).join(' · '),
  }
}

export function editorProjects(translations: Translations): EditorProject[] {
  return [...getAllProjectsForChecks()]
    .sort((a, b) => a.order - b.order)
    .map((project) => ({
      id: project.id,
      shared: sharedFacts(project),
      review: { ...project.review },
      defaults: Object.fromEntries(
        locales.map((locale) => [
          locale,
          { title: project.title[locale], summary: project.summary[locale] },
        ]),
      ) as Record<Locale, ProjectCopy>,
      saved: { ...translations.get(project.id) },
    }))
}

export function isEditableProject(id: string): boolean {
  return getAllProjectsForChecks().some((project) => project.id === id)
}

/**
 * The projects with their saved copy, read fresh for the admin. Null when the saved copy
 * cannot be read: the editor then refuses to edit, so a save can never be based on copy
 * that silently fell back to the code's.
 */
export async function loadEditorProjects(): Promise<EditorProject[] | null> {
  const client = configuredContentClient()
  if (!client) return null
  try {
    return editorProjects(await readTranslations(client))
  } catch (error) {
    console.error(
      `[admin] Loading project copy failed (${error instanceof TranslationsError ? error.code : 'unknown'}).`,
    )
    return null
  }
}
