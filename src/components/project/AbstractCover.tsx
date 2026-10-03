import type { AbstractCover as AbstractCoverSpec } from '@/content/schema'
import styles from './AbstractCover.module.css'

/** Generated, non-representational visual for confidential work. Never imagery. */
export function AbstractCover({ pattern }: { pattern: AbstractCoverSpec['pattern'] }) {
  return <div className={`${styles.cover} ${styles[pattern]}`} aria-hidden="true" />
}
