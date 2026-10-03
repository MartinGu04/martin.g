import { existsSync, readFileSync } from 'node:fs'

/** Inquiries the test server delivered to its outbox file (playwright.config.ts). */
export function deliveredTo(email: string): { values: Record<string, string>; locale: string }[] {
  const file = process.env.E2E_OUTBOX
  if (!file || !existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((entry) => entry.values?.email === email)
}

/** Leads the test server stored in its lead file (playwright.config.ts), as table rows. */
export function storedLeads(email: string): Record<string, string | null>[] {
  const file = process.env.E2E_LEADS
  if (!file || !existsSync(file)) return []
  const rows = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string | null>[]
  return rows.filter((row) => row.email === email)
}

/** A unique address per test, so parallel tests never read each other's deliveries. */
export function uniqueEmail(tag: string): string {
  return `${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.com`
}
