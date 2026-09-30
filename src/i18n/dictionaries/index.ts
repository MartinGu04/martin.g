import type { Locale, ReviewStatus } from '../config'
import { en, enReview, type Dictionary } from './en'
import { he, heReview } from './he'

export type { Dictionary, DisciplineKey } from './en'

export const dictionaries: Record<Locale, { messages: Dictionary; review: ReviewStatus }> = {
  en: { messages: en, review: enReview },
  he: { messages: he, review: heReview },
}
