import type { Localized, ReviewStatus } from '../config'

/**
 * The brand intro's copy (src/components/intro): its Skip control, and the header control
 * that plays the film again on demand. Approved by Martin in both locales.
 */
export const introReview: Localized<ReviewStatus> = {
  en: 'approved',
  he: 'approved',
}

export const introCopy: Localized<{ skip: string; film: string }> = {
  en: { skip: 'Skip', film: 'Film' },
  he: { skip: 'דלג', film: 'סרט' },
}
