import type { LeadStatus, NotificationStatus } from '@/lib/leads/database'
import { notificationLabels, statusGroup, statusLabels } from '@/lib/admin/leads-view'
import styles from './Badges.module.css'

/*
 * Status, never by color alone: every badge carries its label and a shape of its own
 * (new: a filled dot; in progress: a half-filled ring; won: a check; lost: a bar; a
 * notification problem: an outlined mark). Color only reinforces them.
 */

export function StatusBadge({ status }: { status: LeadStatus }) {
  const group = statusGroup(status)
  return (
    <span className={`t-small ${styles.badge} ${styles[group]}`} data-status={status}>
      <span className={`${styles.glyph} ${styles[`glyph-${group}`]}`} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}

export function NotificationBadge({
  status,
  quiet = false,
}: {
  status: NotificationStatus
  /** In lists, a sent email is the normal case and stays quiet. */
  quiet?: boolean
}) {
  return (
    <span
      className={`t-small ${styles.badge} ${styles[`notify-${status}`]} ${quiet && status === 'sent' ? styles.quiet : ''}`}
      data-notification={status}
    >
      <span className={`${styles.glyph} ${styles[`glyph-notify-${status}`]}`} aria-hidden="true" />
      {notificationLabels[status]}
    </span>
  )
}
