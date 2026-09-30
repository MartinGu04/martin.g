import type { ElementType, ReactNode } from 'react'
import { IndexNumber } from './IndexNumber'

interface EyebrowProps {
  /** Optional index, e.g. "01". Rendered as isolated tabular numerals. */
  index?: string
  as?: ElementType
  id?: string
  className?: string
  /** Muted by default; set false for primary labels. */
  muted?: boolean
  children: ReactNode
}

/**
 * Label line such as "01 / SELECTED WORK". Uppercase and tracked in Latin; in Hebrew the
 * same role switches to weight and size (Hebrew has no case), through tokens.
 */
export function Eyebrow({
  index,
  as: Tag = 'p',
  id,
  className,
  muted = true,
  children,
}: EyebrowProps) {
  const cls = ['t-label', muted ? 'muted' : '', className].filter(Boolean).join(' ')
  return (
    <Tag id={id} className={cls}>
      {index ? (
        <>
          <IndexNumber value={index} />
          <span aria-hidden="true"> / </span>
        </>
      ) : null}
      {children}
    </Tag>
  )
}
