import Link from 'next/link'
import styles from './not-found.module.css'

/** A missing lead or admin address. Says nothing about what exists. */
export default function AdminNotFound() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.panel}>
        <p className={`t-label ${styles.code}`}>404</p>
        <h1 className="t-heading-3">Not found</h1>
        <p className="t-small">This address does not lead anywhere in the admin.</p>
        <Link href="/admin" className={`t-small ${styles.link}`}>
          Back to leads
        </Link>
      </div>
    </main>
  )
}
