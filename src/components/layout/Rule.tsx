import styles from './Rule.module.css'

interface RuleProps {
  /** 'line' is the structural default; 'strong' marks a major division. */
  weight?: 'line' | 'strong'
  /** Decorative rules are hidden from assistive technology; otherwise an <hr> is used. */
  decorative?: boolean
  className?: string
}

/** Editorial rule. Hairline, full width of its grid placement, theme-aware. */
export function Rule({ weight = 'line', decorative, className }: RuleProps) {
  const cls = [styles.rule, weight === 'strong' ? styles.strong : '', className]
    .filter(Boolean)
    .join(' ')
  return decorative ? <div className={cls} aria-hidden="true" /> : <hr className={cls} />
}
