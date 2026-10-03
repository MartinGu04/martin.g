import Link from 'next/link'
import type { ReactNode } from 'react'
import { Wordmark } from '@/components/brand/BrandMark'
import { signOut } from '@/lib/admin/actions'
import styles from './AdminShell.module.css'

/**
 * The signed-in admin's frame: identity, the sections (Leads, Projects), who is signed in,
 * and sign out. Quiet on purpose; the content is the content.
 */
export function AdminShell({
  email,
  current,
  children,
}: {
  email: string | undefined
  current: 'leads' | 'projects'
  children: ReactNode
}) {
  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link href="/admin" className={styles.identity}>
            <Wordmark height="0.95rem" label="MARTIN.G" />
            <span className={`t-micro ${styles.badge}`}>Admin</span>
          </Link>
          <nav aria-label="Admin" className={styles.nav}>
            <Link
              href="/admin"
              className={`t-small ${styles.navLink}`}
              aria-current={current === 'leads' ? 'page' : undefined}
            >
              Leads
            </Link>
            <Link
              href="/admin/projects"
              className={`t-small ${styles.navLink}`}
              aria-current={current === 'projects' ? 'page' : undefined}
            >
              Projects
            </Link>
          </nav>
          <div className={styles.session}>
            {email ? (
              <span className={`t-small ${styles.who}`}>
                <span className="visually-hidden">Signed in as </span>
                {email}
              </span>
            ) : null}
            <form action={signOut}>
              <button type="submit" className={`t-small ${styles.signOut}`}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </>
  )
}
