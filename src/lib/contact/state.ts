import type { ContactErrors, ContactValues } from './validate'

/**
 * What the server action answers. Values come back only when the visitor still has to act
 * on them (to correct, or to try again), so a form rendered without JavaScript keeps what
 * was typed. Never contains internal error details.
 */
export type ContactStatus = 'idle' | 'invalid' | 'sent' | 'failed' | 'unavailable'

export interface ContactState {
  status: ContactStatus
  errors?: ContactErrors
  values?: ContactValues
}

export const initialContactState: ContactState = { status: 'idle' }

/** Hidden fields the form adds next to the visible ones. */
export const hiddenFields = {
  /** The spam trap: a field people never see or reach, which software fills in. */
  trap: 'homepage',
  /** When the form became usable, in epoch milliseconds (set in the browser). */
  startedAt: 'started',
  /** A random id per form, so one inquiry is delivered once however often it is sent. */
  submission: 'submission',
  locale: 'locale',
} as const
