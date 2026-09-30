import styles from './GridLines.module.css'

/** The visible grid is drawn from the same tokens as the real layout grid. Decorative. */
export function GridLines({ className }: { className?: string }) {
  return (
    <div className={[styles.lines, className].filter(Boolean).join(' ')} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={styles.col} />
      ))}
    </div>
  )
}
