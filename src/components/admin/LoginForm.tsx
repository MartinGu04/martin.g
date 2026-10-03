'use client'

import { useActionState, useEffect, useRef } from 'react'
import { signIn } from '@/lib/admin/actions'
import {
  adminFields,
  initialSignInState,
  SIGN_IN_ERROR,
  SIGN_IN_UNAVAILABLE,
} from '@/lib/admin/state'
import controls from './controls.module.css'
import styles from './LoginForm.module.css'

/**
 * Email and password, sent to a Server Action: the browser never talks to Supabase and
 * holds no key. Works without JavaScript (a plain POST); with it, the error is announced
 * and focused, and the button reports that it is signing in.
 */
export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialSignInState)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const failed = state.status === 'error' || state.status === 'unavailable'

  useEffect(() => {
    if (failed) errorRef.current?.focus()
  }, [state, failed])

  return (
    <form action={action} className={styles.form}>
      <p
        ref={errorRef}
        id="login-error"
        tabIndex={-1}
        role="alert"
        className={`t-small ${controls.message} ${failed ? controls.error : ''}`}
      >
        {state.status === 'unavailable' ? SIGN_IN_UNAVAILABLE : failed ? SIGN_IN_ERROR : ''}
      </p>
      <div className={controls.field}>
        <label htmlFor="admin-email" className={`t-small ${controls.label}`}>
          Email
        </label>
        <input
          id="admin-email"
          name={adminFields.email}
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email ?? ''}
          className={controls.control}
          aria-invalid={failed || undefined}
          aria-describedby={failed ? 'login-error' : undefined}
          dir="ltr"
        />
      </div>
      <div className={controls.field}>
        <label htmlFor="admin-password" className={`t-small ${controls.label}`}>
          Password
        </label>
        <input
          id="admin-password"
          name={adminFields.password}
          type="password"
          autoComplete="current-password"
          required
          className={controls.control}
          aria-invalid={failed || undefined}
          aria-describedby={failed ? 'login-error' : undefined}
          dir="ltr"
        />
      </div>
      <button
        type="submit"
        className={`${controls.primary} ${styles.submit}`}
        aria-disabled={pending || undefined}
        onClick={(event) => {
          if (pending) event.preventDefault()
        }}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
