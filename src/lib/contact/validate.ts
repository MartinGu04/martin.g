import {
  projectKinds,
  timelines,
  type ContactErrorCode,
  type ProjectKind,
  type Timeline,
} from '@/i18n/dictionaries/contact'

/*
 * The project inquiry's fields and their rules, shared by the form (helpful validation
 * before sending) and the server action (the authority). Pure: no server or browser API.
 */

export const contactFields = [
  'name',
  'email',
  'kind',
  'goal',
  'details',
  'business',
  'link',
  'timeline',
] as const

export type ContactField = (typeof contactFields)[number]

export type ContactValues = Record<ContactField, string>

export interface FieldError {
  code: ContactErrorCode
  /** For codes that name a limit ('tooLong', 'detailsShort'). */
  limit?: number
}

export type ContactErrors = Partial<Record<ContactField, FieldError>>

/** Upper bounds keep a message readable and the request small; the minimum asks for context. */
export const limits = {
  name: 100,
  email: 254,
  goal: 200,
  details: 4000,
  detailsMin: 20,
  business: 150,
  link: 500,
} as const

export const emptyValues: ContactValues = {
  name: '',
  email: '',
  kind: '',
  goal: '',
  details: '',
  business: '',
  link: '',
  timeline: '',
}

// C0 and C1 control characters (keeping tab and newline for multiline fields), and the
// bidirectional overrides and isolates, which could reorder text in the delivered message.
const CONTROL_SINGLE = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g
const CONTROL_MULTI = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g

/** Normalizes one submitted value: NFC, no control characters, trimmed. */
export function cleanValue(value: unknown, multiline = false): string {
  if (typeof value !== 'string') return ''
  let text = value.normalize('NFC').replace(/\r\n?/g, '\n')
  text = multiline
    ? text.replace(CONTROL_MULTI, '').replace(/\n{4,}/g, '\n\n\n')
    : text.replace(CONTROL_SINGLE, ' ').replace(/\s+/g, ' ')
  return text.trim()
}

/** Reads and cleans the inquiry from submitted form data. Unknown fields are ignored. */
export function readValues(data: FormData): ContactValues {
  const values = { ...emptyValues }
  for (const field of contactFields) {
    values[field] = cleanValue(data.get(field), field === 'details')
  }
  return values
}

// Deliberately simple: one @, no spaces, no characters that would need quoting in a mail
// header, and a dot in the domain. The reply is the real verification.
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

export function isEmail(value: string): boolean {
  return value.length <= limits.email && EMAIL.test(value)
}

/**
 * A link as typed, made absolute: "example.com" becomes "https://example.com". Returns
 * null for anything that is not an http(s) URL with a dotted host.
 */
export function normalizeLink(value: string): string | null {
  if (!value) return ''
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!url.hostname.includes('.') || url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

function tooLong(value: string, max: number): FieldError | undefined {
  return value.length > max ? { code: 'tooLong', limit: max } : undefined
}

/** Validates one field. Returns undefined when it is acceptable. */
export function validateField(field: ContactField, values: ContactValues): FieldError | undefined {
  const value = values[field]
  switch (field) {
    case 'name':
      return value ? tooLong(value, limits.name) : { code: 'nameRequired' }
    case 'email':
      if (!value) return { code: 'emailRequired' }
      return isEmail(value) ? undefined : { code: 'emailInvalid' }
    case 'goal':
      return value ? tooLong(value, limits.goal) : { code: 'goalRequired' }
    case 'details':
      if (!value) return { code: 'detailsRequired' }
      if (value.length < limits.detailsMin)
        return { code: 'detailsShort', limit: limits.detailsMin }
      return tooLong(value, limits.details)
    case 'business':
      return tooLong(value, limits.business)
    case 'link':
      if (value.length > limits.link) return { code: 'tooLong', limit: limits.link }
      return normalizeLink(value) === null ? { code: 'linkInvalid' } : undefined
    case 'kind':
      return !value || (projectKinds as readonly string[]).includes(value)
        ? undefined
        : { code: 'optionInvalid' }
    case 'timeline':
      return !value || (timelines as readonly string[]).includes(value)
        ? undefined
        : { code: 'optionInvalid' }
  }
}

/** Validates the whole inquiry; the result lists fields in form order. */
export function validate(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {}
  for (const field of contactFields) {
    const error = validateField(field, values)
    if (error) errors[field] = error
  }
  return errors
}

export function hasErrors(errors: ContactErrors | undefined): boolean {
  return Boolean(errors) && Object.keys(errors!).length > 0
}

export function isProjectKind(value: string): value is ProjectKind {
  return (projectKinds as readonly string[]).includes(value)
}

export function isTimeline(value: string): value is Timeline {
  return (timelines as readonly string[]).includes(value)
}

/** Fills a message template's limit: "{min}" or "{max}". */
export function errorMessage(template: string, error: FieldError): string {
  return template.replace(/\{(min|max)\}/g, String(error.limit ?? ''))
}
