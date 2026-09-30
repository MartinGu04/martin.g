import type { ElementType, ReactNode } from 'react'

interface TextBlockProps {
  size?: 'lead' | 'body' | 'small'
  as?: ElementType
  muted?: boolean
  className?: string
  children: ReactNode
}

const measure = { lead: 'measure-lead', body: 'measure-text', small: 'measure-narrow' } as const

/** Editorial running text: role size, reading measure, paragraph rhythm, underlined links. */
export function TextBlock({
  size = 'body',
  as: Tag = 'div',
  muted,
  className,
  children,
}: TextBlockProps) {
  const cls = [
    `t-${size}`,
    measure[size],
    'prose',
    'stack',
    'stack-sm',
    muted ? 'muted' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <Tag className={cls}>{children}</Tag>
}
