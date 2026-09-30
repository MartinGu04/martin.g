import type { Localized, ReviewStatus } from '../config'

/**
 * Kept separate from the main dictionaries because the not-found boundary is a client
 * component (it has no route params) and must not pull whole dictionaries into the bundle.
 * Both locales are reviewed production copy.
 */
export const notFoundReview: Localized<ReviewStatus> = {
  en: 'approved',
  he: 'approved',
}

export const notFoundCopy: Localized<{ title: string; body: string; back: string }> = {
  en: {
    title: 'Page not found',
    body: 'This address does not exist or has moved.',
    back: 'Back to the homepage',
  },
  he: {
    title: 'העמוד לא נמצא',
    body: 'הכתובת אינה קיימת או שהועברה.',
    back: 'חזרה לדף הבית',
  },
}
