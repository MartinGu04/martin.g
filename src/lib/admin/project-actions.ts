'use server'

import { revalidatePath } from 'next/cache'
import { isLocale } from '@/i18n/config'
import { cleanCopy, copyErrors, LOCALE_NAMES } from '@/lib/projects/copy-rules'
import { isEditableProject } from '@/lib/projects/editor'
import { triggerDeploy } from '@/lib/projects/publish'
import {
  configuredContentClient,
  saveTranslation,
  TranslationsError,
} from '@/lib/projects/translations'
import { requireAdmin } from './auth'
import { projectFields, type CopyActionState, type PublishState } from './state'

/*
 * The project editor's Server Actions (Phase 8C). Each calls requireAdmin() itself. A save
 * writes exactly one (project, locale) row, the locale named by the form, so saving one
 * language never changes the other. Logs carry the step and a code only.
 */

const field = (data: FormData, name: string) => {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

const UNAVAILABLE = 'Project copy cannot be saved right now. Nothing was changed.'

export async function saveProjectCopy(
  previous: CopyActionState,
  data: FormData,
): Promise<CopyActionState> {
  await requireAdmin()
  const projectId = field(data, projectFields.project)
  const locale = field(data, projectFields.locale)
  const keep = { done: previous.done }
  if (!isEditableProject(projectId))
    return { status: 'error', message: 'This project could not be found.', ...keep }
  if (!isLocale(locale)) return { status: 'error', message: 'Choose HE or EN.', ...keep }

  const submitted = {
    title: field(data, projectFields.title),
    summary: field(data, projectFields.summary),
  }
  const errors = copyErrors(submitted)
  if (Object.keys(errors).length > 0)
    return {
      status: 'error',
      locale,
      errors,
      message: `${LOCALE_NAMES[locale]} was not saved. Check the highlighted fields.`,
      ...keep,
    }

  const client = configuredContentClient()
  if (!client) return { status: 'error', locale, message: UNAVAILABLE, ...keep }
  try {
    await saveTranslation(client, projectId, locale, cleanCopy(submitted), new Date())
  } catch (error) {
    console.error(
      `[admin] Saving project copy failed (${error instanceof TranslationsError ? error.code : 'unknown'}).`,
    )
    return { status: 'error', locale, message: UNAVAILABLE, ...keep }
  }
  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${projectId}`)
  return {
    status: 'success',
    locale,
    message: `${LOCALE_NAMES[locale]} saved. Publish to show it on the site.`,
    done: Date.now(),
  }
}

/** Starts a Production build, which carries every saved copy to the public site. */
export async function publishSite(): Promise<PublishState> {
  await requireAdmin()
  const result = await triggerDeploy()
  if (result === 'started')
    return {
      status: 'success',
      message:
        'A new build has started. The site updates when it finishes, usually within a few minutes.',
    }
  if (result === 'unavailable')
    return {
      status: 'error',
      message:
        'Publishing is not set up in this environment. Saved copy reaches the site with the next deployment.',
    }
  console.error('[admin] Starting a build failed.')
  return { status: 'error', message: 'The build could not be started. Try again in a moment.' }
}
