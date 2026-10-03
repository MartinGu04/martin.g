import Link from 'next/link'
import type { Route } from 'next'
import type { LeadListRow } from '@/lib/admin/crm'
import {
  formatDateTime,
  isFiltered,
  kindLabel,
  localeLabels,
  queryString,
  statusLabels,
  type LeadQuery,
  type LeadSummary,
  type Page,
} from '@/lib/admin/leads-view'
import { leadStatuses } from '@/lib/leads/database'
import { NotificationBadge, StatusBadge } from './Badges'
import controls from './controls.module.css'
import styles from './Dashboard.module.css'

const href = (query: LeadQuery, overrides: Partial<LeadQuery> = {}) =>
  `/admin${queryString(query, { page: 1, ...overrides })}` as Route

/** Real counts only, each a shortcut to its filter. No trends: there is no history yet. */
export function SummaryCards({ summary, query }: { summary: LeadSummary; query: LeadQuery }) {
  const cards: {
    key: string
    label: string
    value: number
    detail: string
    filter: Partial<LeadQuery>
    current: boolean
    tone?: 'accent' | 'alert'
  }[] = [
    {
      key: 'new',
      label: 'New',
      value: summary.new,
      detail: 'Not answered yet',
      filter: { status: 'new', notification: null },
      current: query.status === 'new',
      tone: 'accent',
    },
    {
      key: 'progress',
      label: 'In progress',
      value: summary.inProgress,
      detail: 'Contacted, talking or proposal sent',
      filter: { status: 'active', notification: null },
      current: query.status === 'active',
    },
    {
      key: 'won',
      label: 'Won',
      value: summary.won,
      detail: 'Became a project',
      filter: { status: 'won', notification: null },
      current: query.status === 'won',
    },
    {
      key: 'issues',
      label: 'Notification issues',
      value: summary.notificationIssues,
      detail: 'Email failed or still pending',
      filter: { notification: 'issues', status: null },
      current: query.notification === 'issues',
      tone: summary.notificationIssues > 0 ? 'alert' : undefined,
    },
  ]
  return (
    <section aria-labelledby="summary-title" className={styles.summarySection}>
      <h2 id="summary-title" className="visually-hidden">
        Summary
      </h2>
      <ul className={styles.summary}>
        {cards.map((card) => (
          <li key={card.key}>
            <Link
              href={href({ ...query, q: '', locale: null }, card.filter)}
              className={`${styles.card} ${card.tone ? styles[card.tone] : ''}`}
              aria-current={card.current ? 'true' : undefined}
            >
              <span className={`t-label ${styles.cardLabel}`}>{card.label}</span>
              <span className={`t-numeric ${styles.cardValue}`}>{card.value}</span>
              <span className={`t-small ${styles.cardDetail}`}>{card.detail}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A plain GET form: works without JavaScript, and every view has its own address. */
export function LeadFilters({ query }: { query: LeadQuery }) {
  return (
    <form method="get" action="/admin" className={styles.filters} role="search" aria-label="Leads">
      <div className={`${controls.field} ${styles.search}`}>
        <label htmlFor="filter-q" className={`t-small ${controls.label}`}>
          Search
        </label>
        <input
          id="filter-q"
          name="q"
          type="search"
          defaultValue={query.q}
          maxLength={100}
          placeholder="Name, email, phone, business or message"
          className={controls.control}
          dir="auto"
        />
      </div>
      <div className={controls.field}>
        <label htmlFor="filter-status" className={`t-small ${controls.label}`}>
          Status
        </label>
        <select
          id="filter-status"
          name="status"
          defaultValue={query.status ?? ''}
          className={controls.control}
        >
          <option value="">All statuses</option>
          <option value="active">In progress (any)</option>
          {leadStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div className={controls.field}>
        <label htmlFor="filter-locale" className={`t-small ${controls.label}`}>
          Language
        </label>
        <select
          id="filter-locale"
          name="locale"
          defaultValue={query.locale ?? ''}
          className={controls.control}
        >
          <option value="">All languages</option>
          <option value="he">Hebrew</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className={controls.field}>
        <label htmlFor="filter-notification" className={`t-small ${controls.label}`}>
          Notification
        </label>
        <select
          id="filter-notification"
          name="notification"
          defaultValue={query.notification ?? ''}
          className={controls.control}
        >
          <option value="">All</option>
          <option value="issues">Issues (failed or pending)</option>
          <option value="sent">Email sent</option>
          <option value="pending">Email pending</option>
          <option value="failed">Email failed</option>
        </select>
      </div>
      <div className={styles.filterActions}>
        <button type="submit" className={controls.secondary}>
          Apply
        </button>
        {isFiltered(query) ? (
          <Link href="/admin" className={`t-small ${styles.clear}`}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  )
}

export function LeadTable({ page }: { page: Page<LeadListRow> }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">Leads, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Lead</th>
            <th scope="col">Email</th>
            <th scope="col">Project</th>
            <th scope="col">Language</th>
            <th scope="col">Received</th>
            <th scope="col">Status</th>
            <th scope="col">Notification</th>
          </tr>
        </thead>
        <tbody>
          {page.items.map((lead) => (
            <tr
              key={lead.id}
              className={`${styles.row} ${lead.status === 'new' ? styles.rowNew : ''} ${lead.status === 'lost' ? styles.rowLost : ''}`}
              data-status={lead.status}
            >
              <td className={styles.lead}>
                <div className={styles.names}>
                  <Link
                    href={`/admin/leads/${lead.id}` as Route}
                    className={styles.rowLink}
                    dir="auto"
                  >
                    {lead.name}
                  </Link>
                  {lead.business ? (
                    <span className={`t-small ${styles.secondary}`} dir="auto">
                      {lead.business}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className={`t-small ${styles.email}`} data-label="Email">
                <span dir="ltr">{lead.email}</span>
              </td>
              <td className="t-small" data-label="Project">
                {kindLabel(lead.kind) ?? <span className={styles.none}>Not given</span>}
              </td>
              <td className="t-small" data-label="Language">
                {localeLabels[lead.locale] ?? lead.locale}
              </td>
              <td className={`t-small t-numeric ${styles.date}`} data-label="Received">
                <time dateTime={lead.created_at}>{formatDateTime(lead.created_at)}</time>
              </td>
              <td className={styles.badgeCell}>
                <StatusBadge status={lead.status} />
              </td>
              <td className={styles.badgeCell}>
                <NotificationBadge status={lead.notification_status} quiet />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ page, query }: { page: Page<LeadListRow>; query: LeadQuery }) {
  if (page.pages <= 1) return null
  return (
    <nav aria-label="Pages" className={styles.pagination}>
      <p className={`t-small t-numeric ${styles.range}`}>
        {page.from}–{page.to} of {page.total}
      </p>
      <div className={styles.pageLinks}>
        {page.page > 1 ? (
          <Link
            href={href(query, { page: page.page - 1 })}
            className={controls.secondary}
            rel="prev"
          >
            Previous<span className="visually-hidden"> page</span>
          </Link>
        ) : null}
        <span className={`t-small t-numeric ${styles.pageOf}`} aria-current="page">
          Page {page.page} of {page.pages}
        </span>
        {page.page < page.pages ? (
          <Link
            href={href(query, { page: page.page + 1 })}
            className={controls.secondary}
            rel="next"
          >
            Next<span className="visually-hidden"> page</span>
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
