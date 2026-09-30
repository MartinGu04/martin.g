import type { ReactNode } from 'react'
import styles from './DepthType.module.css'

interface DepthTypeProps {
  /**
   * 'line'  an oversized, cropped line of type along the scene's lower edge (pans on scroll)
   * 'index' a huge numeral bleeding off the inline-end edge (moves in depth on scroll)
   */
  variant: 'line' | 'index'
  children: ReactNode
  className?: string
}

/**
 * Foreground/background depth: oversized typography behind a scene's content, deliberately
 * larger than the frame and cropped by it. Always a decorative duplicate of text that is
 * readable elsewhere, so it is hidden from assistive technology. Place it inside a <Scene>.
 */
export function DepthType({ variant, children, className }: DepthTypeProps) {
  return (
    <p
      className={[styles.depth, styles[variant], className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {children}
    </p>
  )
}
