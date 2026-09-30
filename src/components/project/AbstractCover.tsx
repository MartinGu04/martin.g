import type { ConfidentialProject } from '@/content/schema'
import styles from './AbstractCover.module.css'

/** Generated, non-representational visual for confidential work. Never imagery. */
export function AbstractCover({ pattern }: { pattern: ConfidentialProject['cover']['pattern'] }) {
  return <div className={`${styles.cover} ${styles[pattern]}`} aria-hidden="true" />
}
