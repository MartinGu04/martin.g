import type { HexColor } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import styles from './ReadingProgress.module.css'

/**
 * A hairline along the header's lower edge that fills as the visitor reads, in the
 * project's own color. CSS only (a scroll-driven animation on the document); it exists
 * only where that is supported, scripting is on and motion is welcome, and it is
 * decorative: the chapter headings carry the same information.
 */
export function ReadingProgress({ color }: { color: HexColor }) {
  const style: StyleWithVars = { '--progress-color': color }
  return <div className={styles.progress} style={style} aria-hidden="true" />
}
