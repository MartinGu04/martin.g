import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Wordmark } from '@/components/brand/BrandMark'
import { LoginForm } from '@/components/admin/LoginForm'
import { adminAuthConfig } from '@/lib/admin/config'
import { isSignedInAdmin } from '@/lib/admin/auth'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Sign in' }

/**
 * The admin's only public page. No sign-up, no social login, no reset link: the one
 * account is created in Supabase by Martin. Already signed in as the admin: straight to
 * the leads.
 */
export default async function AdminLoginPage() {
  if (await isSignedInAdmin()) redirect('/admin')
  const configured = adminAuthConfig() !== null

  return (
    <main id="main" className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.identity}>
          <Wordmark height="1.125rem" label="MARTIN.G" />
          <span className={`t-micro ${styles.badge}`}>Admin</span>
        </div>
        <h1 className={`t-heading-3 ${styles.title}`}>Sign in</h1>
        <p className={`t-small ${styles.lead}`}>Private. For the MARTIN.G studio only.</p>
        {configured ? (
          <LoginForm />
        ) : (
          <p className={`t-small ${styles.notice}`} role="status">
            The admin is not configured in this environment.
          </p>
        )}
      </div>
    </main>
  )
}
