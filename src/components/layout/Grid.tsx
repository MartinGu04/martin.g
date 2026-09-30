import type { CSSProperties, ElementType, ReactNode } from 'react'
import type { StyleWithVars } from '@/lib/css'
import styles from './Grid.module.css'

type Tier = 'base' | 'md' | 'lg'
type Responsive = Partial<Record<Tier, number>>

const suffix: Record<Tier, string> = { base: '', md: '-md', lg: '-lg' }

/** Converts responsive span/start props into CSS custom properties (no runtime JS). */
export function cellVars(span?: Responsive, start?: Responsive): StyleWithVars {
  const vars: StyleWithVars = {}
  for (const tier of ['base', 'md', 'lg'] as const) {
    const s = span?.[tier]
    const st = start?.[tier]
    if (s !== undefined) vars[`--span${suffix[tier]}`] = s
    if (st !== undefined) vars[`--start${suffix[tier]}`] = st
  }
  return vars
}

interface GridProps {
  as?: ElementType
  className?: string
  children: ReactNode
  id?: string
  role?: string
}

export function Grid({ as: Tag = 'div', className, children, ...rest }: GridProps) {
  const cls = [styles.grid, className].filter(Boolean).join(' ')
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}

interface CellProps {
  as?: ElementType
  className?: string
  children?: ReactNode
  /** Columns to span per tier: base (4 cols), md (8 cols), lg (12 cols). */
  span?: Responsive
  /** Starting column line per tier (logical: counts from the inline start). */
  start?: Responsive
  style?: CSSProperties
  id?: string
}

export function Cell({ as: Tag = 'div', className, children, span, start, style, id }: CellProps) {
  const cls = [styles.cell, className].filter(Boolean).join(' ')
  return (
    <Tag className={cls} style={{ ...cellVars(span, start), ...style }} id={id}>
      {children}
    </Tag>
  )
}
