'use client'

import { useActionState } from 'react'
import { publishSite } from '@/lib/admin/project-actions'
import { initialPublishState } from '@/lib/admin/state'
import controls from './controls.module.css'
import styles from './ProjectPages.module.css'

/**
 * Saved copy reaches visitors through a new Production build, where the confidential leak
 * check and the release gate run on it. This starts one.
 */
export function PublishPanel({ available }: { available: boolean }) {
  const [state, action, pending] = useActionState(publishSite, initialPublishState)
  return (
    <form action={action} className={styles.publish} aria-labelledby="publish-heading">
      <h2 id="publish-heading" className={`t-label ${styles.panelTitle}`}>
        Publish
      </h2>
      <p className={`t-small ${styles.muted}`}>
        {available
          ? 'Saved text appears on the site after a new build. The build refuses text that could identify confidential work.'
          : 'Publishing is not set up in this environment. Saved text appears on the site with the next deployment.'}
      </p>
      {available ? (
        <div className={styles.publishRow}>
          <button
            type="submit"
            className={controls.secondary}
            aria-disabled={pending || undefined}
            onClick={(event) => {
              if (pending) event.preventDefault()
            }}
          >
            {pending ? 'Starting…' : 'Publish to the site'}
          </button>
          <p
            role="status"
            className={`t-small ${controls.message} ${
              state.status === 'success'
                ? controls.success
                : state.status === 'error'
                  ? controls.error
                  : ''
            }`}
          >
            {state.message ?? ''}
          </p>
        </div>
      ) : null}
    </form>
  )
}
