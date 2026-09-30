import type { ReactNode } from 'react'
import styles from './MediaShell.module.css'

interface MediaShellProps {
  /** Width / height, e.g. 16 / 9. Reserves space so media never shifts layout. */
  aspectRatio: number
  caption?: ReactNode
  className?: string
  children?: ReactNode
}

/**
 * Frame for any media: fixed aspect ratio, raised surface while loading, hairline edge,
 * square corners, clipped overflow (ready for mask reveals and parallax inside).
 * Width comes from its grid placement (.col-*) or from being placed outside the grid
 * for full-bleed.
 */
export function MediaShell({ aspectRatio, caption, className, children }: MediaShellProps) {
  const frame = (
    <div className={styles.frame} style={{ aspectRatio: String(aspectRatio) }}>
      {children}
    </div>
  )
  if (!caption) return <div className={className}>{frame}</div>
  return (
    <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
      {frame}
      <figcaption className={`t-small muted ${styles.caption}`}>{caption}</figcaption>
    </figure>
  )
}
