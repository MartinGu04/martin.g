import type { Localized, ReviewStatus } from '../config'

/**
 * The brand intro's one control (src/components/intro/BrandIntro.tsx). English is Martin's
 * own wording from the intro brief. The Hebrew was written for him to review: it stays
 * 'draft' until he approves it, and the release gate refuses a production build meanwhile.
 */
export const introReview: Localized<ReviewStatus> = {
  en: 'approved',
  he: 'draft',
}

export const introCopy: Localized<{ skip: string }> = {
  en: { skip: 'Skip' },
  he: { skip: 'דילוג' },
}
