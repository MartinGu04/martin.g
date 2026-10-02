import type { ReactNode } from 'react'
import { IndexNumber } from '@/components/type/IndexNumber'
import styles from './Chapter.module.css'

interface ChapterHeadingProps {
  id: string
  number: string
  /** The chapter's short name, as listed in the chapter index. */
  name: string
  children: ReactNode
  /** 'display' sets the statement one role up, for a case study's culminating chapter. */
  size?: 'heading' | 'display'
  className?: string
}

/**
 * A case-study chapter's heading: its marker (number and name, in the world's accent over
 * a short rule) and the chapter's statement. Both are part of the h2, so a visitor moving
 * by headings hears where they are ("03 Direction, Quiet luxury...") and the chapter index
 * and the heading always agree.
 */
export function ChapterHeading({
  id,
  number,
  name,
  children,
  size = 'heading',
  className,
}: ChapterHeadingProps) {
  return (
    <h2 id={id} className={[styles.heading, className].filter(Boolean).join(' ')}>
      <span className={`t-label ${styles.marker}`}>
        <IndexNumber value={number} />
        <span className={styles.rule} aria-hidden="true" />
        <span>{name}</span>
        <span className="visually-hidden">: </span>
      </span>
      <span className={`${size === 'display' ? 't-display' : 't-heading-1'} ${styles.statement}`}>
        {children}
      </span>
    </h2>
  )
}
