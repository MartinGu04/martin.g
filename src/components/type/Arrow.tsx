import styles from './Arrow.module.css'

/** Hairline directional arrow. Points to the inline end: mirrors in RTL. Decorative. */
export function Arrow({ className }: { className?: string }) {
  return (
    <span className={[styles.wrap, className].filter(Boolean).join(' ')} aria-hidden="true">
      <svg className={styles.arrow} viewBox="0 0 24 24" width="24" height="24" focusable="false">
        <path d="M3 12h17M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  )
}
