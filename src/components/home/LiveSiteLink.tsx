import type { ExternalUrl } from '@/content/schema'
import { Name } from '@/components/type/Name'
import styles from './LiveSiteLink.module.css'

interface LiveSiteLinkProps {
  href: ExternalUrl
  label: string
  /** The project's name, appended for assistive technology ("Visit live site ON"). */
  title: string
  /** "(opens in a new tab)", appended for assistive technology. */
  newTab: string
  className?: string
}

/**
 * The secondary action of a public project: its live site, outside MARTIN.G. Quieter than
 * the primary "View project" (muted, underlined), and marked as external by a diagonal
 * arrow that mirrors in RTL. Opens in a new tab without an opener or referrer.
 */
export function LiveSiteLink({ href, label, title, newTab, className }: LiveSiteLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[`t-label ${styles.link}`, className].filter(Boolean).join(' ')}
    >
      <span className={styles.text}>{label}</span>
      <span className="visually-hidden">
        {' '}
        <Name>{title}</Name> {newTab}
      </span>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
          <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </span>
    </a>
  )
}
