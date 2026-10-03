import { contactCopy } from '@/i18n/dictionaries/contact'
import { cleanValue } from '@/lib/contact/validate'
import {
  NOTE_MAX_LENGTH,
  leadStatuses,
  notificationStatuses,
  type LeadStatus,
  type NotificationStatus,
} from '@/lib/leads/database'
import type { LeadListRow } from './crm'
import { notificationLabels, statusLabels } from './labels'

export { notificationLabels, statusLabels }

/*
 * The dashboard's view logic, pure and tested on its own: the query in the URL, the
 * summary, filters, search and pagination. Filtering happens on the server after one
 * bounded fetch of the newest leads (LEAD_FETCH_LIMIT), never by building a PostgREST
 * filter from what someone typed, and never in the browser.
 */

/**
 * The bound: the dashboard reads at most this many leads, newest first, per request. At
 * the CRM's expected size that is every lead; beyond it the page says so (`truncated`),
 * and server-side queries replace the bounded fetch.
 */
export const LEAD_FETCH_LIMIT = 1000
export const PAGE_SIZE = 25

export const localeLabels: Record<string, string> = { he: 'Hebrew', en: 'English' }

/** The pipeline's stages, for styling and the summary: never shown by color alone. */
export type StatusGroup = 'new' | 'active' | 'won' | 'lost'

export const ACTIVE_STATUSES: readonly LeadStatus[] = ['contacted', 'talking', 'proposal_sent']

export function statusGroup(status: LeadStatus): StatusGroup {
  if (status === 'new' || status === 'won' || status === 'lost') return status
  return 'active'
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (leadStatuses as readonly string[]).includes(value)
}

export function isNotificationStatus(value: unknown): value is NotificationStatus {
  return typeof value === 'string' && (notificationStatuses as readonly string[]).includes(value)
}

export function kindLabel(kind: string | null): string | null {
  if (!kind) return null
  const options = contactCopy.en.form.kind.options as Record<string, string>
  return options[kind] ?? kind
}

export function timelineLabel(timeline: string | null): string | null {
  if (!timeline) return null
  const options = contactCopy.en.form.timeline.options as Record<string, string>
  return options[timeline] ?? timeline
}

/** Times are shown in Israel time, where Martin works, whatever the server's zone. */
export const ADMIN_TIME_ZONE = 'Asia/Jerusalem'

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: ADMIN_TIME_ZONE,
})

export function formatDateTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateTime.format(date)
}

export interface LeadQuery {
  status: LeadStatus | 'active' | null
  locale: 'he' | 'en' | null
  notification: NotificationStatus | 'issues' | null
  q: string
  page: number
}

type Params = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? ''

/** The query from the URL; anything unknown is ignored, never trusted. */
export function parseLeadQuery(params: Params): LeadQuery {
  const status = first(params.status)
  const locale = first(params.locale)
  const notification = first(params.notification)
  const page = Number.parseInt(first(params.page), 10)
  return {
    status: isLeadStatus(status) || status === 'active' ? status : null,
    locale: locale === 'he' || locale === 'en' ? locale : null,
    notification:
      isNotificationStatus(notification) || notification === 'issues' ? notification : null,
    q: first(params.q).slice(0, 100),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

/** The query as a URL search string ('' when empty), with `overrides` applied. */
export function queryString(query: LeadQuery, overrides: Partial<LeadQuery> = {}): string {
  const merged = { ...query, ...overrides }
  const params = new URLSearchParams()
  if (merged.q) params.set('q', merged.q)
  if (merged.status) params.set('status', merged.status)
  if (merged.locale) params.set('locale', merged.locale)
  if (merged.notification) params.set('notification', merged.notification)
  if (merged.page > 1) params.set('page', String(merged.page))
  const text = params.toString()
  return text ? `?${text}` : ''
}

export function isFiltered(query: LeadQuery): boolean {
  return Boolean(query.q || query.status || query.locale || query.notification)
}

export interface LeadSummary {
  total: number
  new: number
  inProgress: number
  won: number
  lost: number
  notificationIssues: number
}

/** Real counts of the fetched leads. In progress: contacted, talking or proposal sent. */
export function summarize(rows: readonly Pick<LeadListRow, 'status' | 'notification_status'>[]) {
  const summary: LeadSummary = {
    total: rows.length,
    new: 0,
    inProgress: 0,
    won: 0,
    lost: 0,
    notificationIssues: 0,
  }
  for (const row of rows) {
    const group = statusGroup(row.status)
    if (group === 'new') summary.new++
    else if (group === 'active') summary.inProgress++
    else if (group === 'won') summary.won++
    else summary.lost++
    if (row.notification_status !== 'sent') summary.notificationIssues++
  }
  return summary
}

/** Case, accent and width insensitive; Hebrew points ignored. */
export function foldText(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
}

const digitsOf = (value: string) => value.replace(/\D/g, '')

/** Whether a lead matches the search: name, email, phone, business or description. */
export function matchesSearch(row: LeadListRow, search: string): boolean {
  const needle = foldText(search.trim())
  if (!needle) return true
  const fields = [row.name, row.email, row.phone, row.business, row.description]
  if (fields.some((field) => field && foldText(field).includes(needle))) return true
  // Phone numbers match however they are spaced or dashed: "050 123" finds "050-1234567".
  const digits = digitsOf(needle)
  return digits.length >= 3 && digits.length === needle.replace(/[\s()+.-]/g, '').length
    ? Boolean(row.phone && digitsOf(row.phone).includes(digits))
    : false
}

export function filterLeads(rows: readonly LeadListRow[], query: LeadQuery): LeadListRow[] {
  return rows.filter((row) => {
    if (query.status === 'active' && statusGroup(row.status) !== 'active') return false
    if (query.status && query.status !== 'active' && row.status !== query.status) return false
    if (query.locale && row.locale !== query.locale) return false
    if (query.notification === 'issues' && row.notification_status === 'sent') return false
    if (
      query.notification &&
      query.notification !== 'issues' &&
      row.notification_status !== query.notification
    )
      return false
    return matchesSearch(row, query.q)
  })
}

export interface Page<T> {
  items: T[]
  page: number
  pages: number
  total: number
  /** 1-based position of the first and last item shown; 0 when empty. */
  from: number
  to: number
}

/** One page of `rows`; a page past the end shows the last page. */
export function paginate<T>(rows: readonly T[], page: number, size = PAGE_SIZE): Page<T> {
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(Math.max(1, Math.floor(page)), pages)
  const start = (current - 1) * size
  const items = rows.slice(start, start + size)
  return {
    items,
    page: current,
    pages,
    total: rows.length,
    from: items.length ? start + 1 : 0,
    to: start + items.length,
  }
}

/** Notes are plain text: cleaned like an inquiry's message, never blank, never too long. */
export function cleanNote(value: string): { body: string } | { error: string } {
  const body = cleanValue(value, true)
  if (!body) return { error: 'Write a note before adding it.' }
  if (body.length > NOTE_MAX_LENGTH)
    return { error: `Notes can be up to ${NOTE_MAX_LENGTH.toLocaleString('en')} characters.` }
  return { body }
}

/**
 * A submitted link, only if it is an http(s) URL: Contact already normalized it, and it is
 * still treated as untrusted (opened in a new tab without opener or referrer).
 */
export function safeExternalUrl(value: string | null): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

/** A dialable tel: target: digits and a leading +, nothing else. */
export function telHref(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return digits.replace(/\D/g, '').length >= 7 ? `tel:${digits}` : null
}
