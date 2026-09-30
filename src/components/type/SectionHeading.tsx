import type { ReactNode } from 'react'
import { Rule } from '@/components/layout/Rule'
import { Eyebrow } from './Eyebrow'
import styles from './SectionHeading.module.css'

interface SectionHeadingProps {
  /** Id of the section's heading element, for aria-labelledby. */
  id: string
  /** Section numeral, e.g. "01". */
  index?: string
  /** The label line. Becomes the heading itself when there is no title. */
  label: ReactNode
  /** Optional display title. When present it is the heading and the label is an eyebrow. */
  title?: ReactNode
  /** Optional short intro under the title. */
  intro?: ReactNode
  level?: 2 | 3
}

/**
 * Section opener on the page grid: a structural rule, the eyebrow in the aside column and
 * the optional title in the main column. Recomposes per tier through the named placements.
 */
export function SectionHeading({ id, index, label, title, intro, level = 2 }: SectionHeadingProps) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <div className={styles.heading}>
      <Rule className="col-full" decorative />
      {title ? (
        <>
          <Eyebrow index={index} className={`col-aside ${styles.eyebrow}`}>
            {label}
          </Eyebrow>
          <div className={`col-main ${styles.main}`}>
            <Heading id={id} className={`t-heading-1 ${styles.title}`}>
              {title}
            </Heading>
            {intro ? (
              <div className={`t-lead muted measure-lead ${styles.intro}`}>{intro}</div>
            ) : null}
          </div>
        </>
      ) : (
        <Eyebrow
          as={Heading}
          id={id}
          index={index}
          muted={false}
          className={`col-full ${styles.eyebrow}`}
        >
          {label}
        </Eyebrow>
      )}
    </div>
  )
}
