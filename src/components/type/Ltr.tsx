import type { ReactNode } from 'react'

/**
 * Isolates a left-to-right run (numerals, brand and project names, emails, technical
 * terms) so it never reorders surrounding Hebrew text, and vice versa.
 */
export function Ltr({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>
}
