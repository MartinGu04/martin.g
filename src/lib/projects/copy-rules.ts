import { cleanValue } from '@/lib/contact/validate'
import type { Locale, ReviewStatus } from '@/i18n/config'

/*
 * The project editor's rules for localized copy (Phase 8C). Dependency-free, so the editor
 * shows the same completeness and limits in the browser that the Server Action enforces
 * and the table's checks (supabase/migrations/..._project_translations.sql) guarantee.
 */

/** The localized fields the editor owns. Everything else about a project is shared. */
export interface ProjectCopy {
  title: string
  summary: string
}

/** Copy saved in the editor for one locale. */
export interface SavedCopy extends ProjectCopy {
  updatedAt?: string
}

export const COPY_FIELDS = ['title', 'summary'] as const satisfies readonly (keyof ProjectCopy)[]
export type CopyField = (typeof COPY_FIELDS)[number]

export const COPY_LIMITS: Record<CopyField, number> = { title: 120, summary: 500 }

export const COPY_LABELS: Record<CopyField, string> = {
  title: 'Title',
  summary: 'Short description',
}

/** The editor's order: Hebrew first, the site's primary language. */
export const EDITOR_LOCALES: readonly Locale[] = ['he', 'en']

export const LOCALE_NAMES: Record<Locale, string> = { he: 'Hebrew', en: 'English' }
export const LOCALE_CODES: Record<Locale, string> = { he: 'HE', en: 'EN' }

/** One value as it is stored: NFC, no control characters, one line, trimmed. */
export const cleanCopyValue = (value: unknown) => cleanValue(value)

export function cleanCopy(copy: ProjectCopy): ProjectCopy {
  return { title: cleanCopyValue(copy.title), summary: cleanCopyValue(copy.summary) }
}

export type CopyErrors = Partial<Record<CopyField, string>>

/** What is wrong with one locale's copy, by field. Empty when it can be saved. */
export function copyErrors(copy: ProjectCopy): CopyErrors {
  const errors: CopyErrors = {}
  for (const field of COPY_FIELDS) {
    const value = cleanCopyValue(copy[field])
    if (!value) errors[field] = `${COPY_LABELS[field]} is required.`
    else if (value.length > COPY_LIMITS[field])
      errors[field] =
        `${COPY_LABELS[field]} can be up to ${COPY_LIMITS[field].toLocaleString('en')} characters.`
  }
  return errors
}

export const isCopyComplete = (copy: ProjectCopy) => Object.keys(copyErrors(copy)).length === 0

export function sameCopy(a: ProjectCopy, b: ProjectCopy): boolean {
  return COPY_FIELDS.every((field) => cleanCopyValue(a[field]) === cleanCopyValue(b[field]))
}

/*
 * The editor's view of one project (built on the server by src/lib/projects/editor.ts):
 * its shared properties, shown read-only (they live in the code), and per locale the
 * code's copy and the copy saved in the editor, if any. Plain data.
 */

export interface SharedFacts {
  visibility: 'Public' | 'Confidential'
  status: 'Published' | 'Draft'
  order: number
  years?: string
  liveUrl?: string
  media: string
  disciplines: string
}

export interface EditorProject {
  id: string
  shared: SharedFacts
  review: Record<Locale, ReviewStatus>
  /** The code's copy: what the site shows in a locale without saved copy. */
  defaults: Record<Locale, ProjectCopy>
  saved: Partial<Record<Locale, SavedCopy>>
}
