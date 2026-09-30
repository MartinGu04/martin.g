import type { ReactNode } from 'react'
import { Ltr } from './Ltr'

interface SectionHeadingProps {
  id: string
  /** Optional numeral, e.g. "01". Rendered as an isolated LTR run. */
  index?: string
  children: ReactNode
  className?: string
}

/** "01 / SELECTED WORK". The label style changes per script through tokens. */
export function SectionHeading({ id, index, children, className }: SectionHeadingProps) {
  return (
    <h2 id={id} className={['label', className].filter(Boolean).join(' ')}>
      {index ? (
        <>
          <Ltr>{index}</Ltr>
          <span aria-hidden="true"> / </span>
        </>
      ) : null}
      {children}
    </h2>
  )
}
