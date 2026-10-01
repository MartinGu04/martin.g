import type { ReactNode } from 'react'
import type { StyleWithVars } from '@/lib/css'
import styles from './MediaShell.module.css'

/** Width / height per tier. Tablet falls back to mobile, desktop to tablet. */
export type AspectRatio = number | { mobile: number; tablet?: number; desktop?: number }

interface MediaShellProps {
  /** Width / height, e.g. 16 / 9. Reserves space so media never shifts layout. */
  aspectRatio: AspectRatio
  /**
   * 'cover' frames the media on a raised surface with a hairline edge. 'contain' shows a
   * cut-out (a device with a transparent surround) whole, with no surface or edge.
   */
  fit?: 'cover' | 'contain'
  caption?: ReactNode
  className?: string
  children?: ReactNode
}

function ratioVars(ratio: AspectRatio): StyleWithVars {
  if (typeof ratio === 'number') return { '--ar': ratio, '--ar-md': ratio, '--ar-lg': ratio }
  const tablet = ratio.tablet ?? ratio.mobile
  return { '--ar': ratio.mobile, '--ar-md': tablet, '--ar-lg': ratio.desktop ?? tablet }
}

/**
 * Frame for any media: fixed aspect ratio (per tier when the media is art directed), raised
 * surface while loading, hairline edge, square corners, clipped overflow (ready for mask
 * reveals and parallax inside). Width comes from its grid placement (.col-*) or from being
 * placed outside the grid for full-bleed.
 */
export function MediaShell({
  aspectRatio,
  fit = 'cover',
  caption,
  className,
  children,
}: MediaShellProps) {
  const frame = (
    <div className={styles.frame} data-fit={fit} style={ratioVars(aspectRatio)}>
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
