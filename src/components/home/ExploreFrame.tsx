import Link from 'next/link'
import type { ReactNode } from 'react'
import type { PublicProjectSummary } from '@/content/resolve'
import { Arrow } from '@/components/type/Arrow'
import styles from './ExploreFrame.module.css'

/**
 * A project's main proof, signalling that there is more inside: on a fine pointer the
 * frame leads to the project page and, while pointed at (or while the scene's own project
 * link has keyboard focus), a quiet "Explore project" label rises in its corner. The media
 * keep their own alternative text; the link is a layer over them, a duplicate of the
 * scene's explicit project link, so it is hidden from assistive technology and skipped by
 * the keyboard. Only the main proof does this; supporting images never link.
 */
export function ExploreFrame({
  href,
  label,
  children,
  corner = 'end',
  className,
}: {
  href: PublicProjectSummary['href']
  label: string
  children: ReactNode
  /** Where the label rises: the inline end, or always the physical right. */
  corner?: 'end' | 'right'
  className?: string
}) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')} data-corner={corner}>
      {children}
      <Link href={href} tabIndex={-1} aria-hidden="true" className={styles.cover}>
        <span className={`t-action ${styles.label}`}>
          {label}
          <Arrow />
        </span>
      </Link>
    </div>
  )
}
