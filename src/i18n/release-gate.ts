import 'server-only'
import { locales } from './config'
import { dictionaries } from './dictionaries'
import { notFoundReview } from './dictionaries/not-found'
import { homeReview } from './dictionaries/home'
import { getAllProjectsForChecks } from '@/content/registry'

/** Lists every piece of copy still marked 'draft'. */
export function findDraftCopy(): string[] {
  const drafts: string[] = []
  for (const locale of locales) {
    if (dictionaries[locale].review === 'draft') drafts.push(`dictionary:${locale}`)
    if (notFoundReview[locale] === 'draft') drafts.push(`not-found:${locale}`)
    if (homeReview[locale] === 'draft') drafts.push(`home:${locale}`)
  }
  for (const project of getAllProjectsForChecks()) {
    if (project.status !== 'published') continue
    for (const locale of locales) {
      if (project.review[locale] === 'draft') drafts.push(`project:${project.id}:${locale}`)
    }
  }
  return drafts
}

/**
 * Production copy is never auto-translated or unreviewed: a Vercel production build
 * fails while any published copy is marked 'draft'. Preview and local builds only warn.
 * ALLOW_DRAFT_COPY_IN_PRODUCTION=1 is an explicit, logged escape hatch.
 */
export function assertReleasableCopy(drafts = findDraftCopy()): void {
  if (drafts.length === 0) return
  const summary = `Draft copy awaiting review: ${drafts.join(', ')}`
  const isProduction = process.env.VERCEL_ENV === 'production'
  if (isProduction && process.env.ALLOW_DRAFT_COPY_IN_PRODUCTION !== '1') {
    throw new Error(`[release-gate] ${summary}. Approve the copy before a production build.`)
  }
  if (isProduction) console.warn(`[release-gate] OVERRIDDEN. ${summary}`)
}
