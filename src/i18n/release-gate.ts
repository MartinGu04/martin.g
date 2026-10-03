import 'server-only'
import { locales } from './config'
import { dictionaries } from './dictionaries'
import { notFoundReview } from './dictionaries/not-found'
import { homeReview } from './dictionaries/home'
import { showcaseReview } from './dictionaries/showcase'
import { caseOnReview } from './dictionaries/case-on'
import { caseMiMaMoReview } from './dictionaries/case-mi-ma-mo'
import { contactReview } from './dictionaries/contact'
import { privacyReview } from './dictionaries/privacy'
import { accessibilityReview } from './dictionaries/accessibility'
import { getAllProjectsForChecks } from '@/content/registry'
import { siteCards } from '@/lib/social'

/** Lists every piece of copy still marked 'draft'. */
export function findDraftCopy(): string[] {
  const drafts: string[] = []
  for (const locale of locales) {
    if (dictionaries[locale].review === 'draft') drafts.push(`dictionary:${locale}`)
    if (notFoundReview[locale] === 'draft') drafts.push(`not-found:${locale}`)
    if (homeReview[locale] === 'draft') drafts.push(`home:${locale}`)
    if (showcaseReview[locale] === 'draft') drafts.push(`showcase:${locale}`)
    if (caseOnReview[locale] === 'draft') drafts.push(`case-study:on:${locale}`)
    if (caseMiMaMoReview[locale] === 'draft') drafts.push(`case-study:mi-ma-mo:${locale}`)
    if (contactReview[locale] === 'draft') drafts.push(`contact:${locale}`)
    if (privacyReview[locale] === 'draft') drafts.push(`privacy:${locale}`)
    if (accessibilityReview[locale] === 'draft') drafts.push(`accessibility:${locale}`)
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

/**
 * Test-only, for the production simulation (scripts/production-simulation.mjs): a comma
 * separated list of locales whose site card is treated as pending. It can only make a
 * build refuse, never let one through.
 */
export const SIMULATE_PENDING_SITE_CARDS = 'RELEASE_GATE_SIMULATE_PENDING_SITE_CARDS'

/** Lists every required social card still awaiting Martin's visual approval. */
export function findPendingArtwork(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const simulated = (env[SIMULATE_PENDING_SITE_CARDS] ?? '').split(',').map((l) => l.trim())
  return locales
    .filter((locale) => siteCards.review[locale] !== 'approved' || simulated.includes(locale))
    .map((locale) => `site-card:${locale}`)
}

/**
 * Social artwork reaches production only once approved: a Vercel production build fails
 * while a required site card is 'pending'. Preview and local builds render pending artwork
 * for review. There is no override.
 */
export function assertReleasableArtwork(
  pending = findPendingArtwork(),
  env: Record<string, string | undefined> = process.env,
): void {
  if (pending.length === 0 || env.VERCEL_ENV !== 'production') return
  throw new Error(
    `[release-gate] Social artwork awaiting approval: ${pending.join(', ')}. Approve it before a production build.`,
  )
}
