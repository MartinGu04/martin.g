import styles from './Level.module.css'

/**
 * Which level of the operation a chapter reads at (one person's shift, the team, the
 * operation), as three steps on one line with the current one lit. Decorative: the
 * chapter's heading and text say the same in words.
 */
export function Level({
  levels,
  current,
  className,
}: {
  levels: readonly [string, string, string]
  current: 0 | 1 | 2
  className?: string
}) {
  return (
    <ol
      role="list"
      className={[styles.level, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {levels.map((name, i) => (
        <li
          key={name}
          className={`t-micro ${styles.step}`}
          data-current={i === current ? '' : undefined}
        >
          <span className={styles.node} />
          {name}
        </li>
      ))}
    </ol>
  )
}
