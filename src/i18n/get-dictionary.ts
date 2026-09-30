import 'server-only'
import type { Locale } from './config'
import { dictionaries, type Dictionary } from './dictionaries'

/** Server-only: client components receive individual strings as props, never a dictionary. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale].messages
}

/** Minimal `{name}` interpolation. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}
