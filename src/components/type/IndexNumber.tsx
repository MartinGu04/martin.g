import { Ltr } from './Ltr'

interface IndexNumberProps {
  value: string
  /** 'inherit' follows the surrounding role; 'display' is the large project-index size. */
  size?: 'inherit' | 'display'
  className?: string
}

/** Project and section numerals: tabular Latin figures, bidi-isolated in both locales. */
export function IndexNumber({ value, size = 'inherit', className }: IndexNumberProps) {
  const cls = ['t-numeric', size === 'display' ? 't-heading-2' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={cls}>
      <Ltr>{value}</Ltr>
    </span>
  )
}
