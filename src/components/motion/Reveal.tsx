import type { ElementType, ReactNode } from 'react'
import type { StyleWithVars } from '@/lib/css'

export type RevealVariant = 'fade' | 'rise' | 'scale' | 'mask'

interface RevealProps {
  as?: ElementType
  variant?: RevealVariant
  /** Position in a group; multiplied by --stagger for the transition delay. */
  order?: number
  className?: string
  id?: string
  children: ReactNode
}

/**
 * Server component: only adds data attributes. Visibility rules live in motion.css and
 * guarantee the content is visible without JavaScript and with reduced motion.
 * Never wrap the page's primary heading or LCP element in a reveal.
 */
export function Reveal({
  as: Tag = 'div',
  variant = 'rise',
  order,
  className,
  id,
  children,
}: RevealProps) {
  const style: StyleWithVars | undefined = order ? { '--reveal-order': order } : undefined
  return (
    <Tag data-reveal={variant} className={className} style={style} id={id}>
      {children}
    </Tag>
  )
}
