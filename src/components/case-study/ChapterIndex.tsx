import { IndexNumber } from '@/components/type/IndexNumber'
import styles from './ChapterIndex.module.css'

export interface ChapterLink {
  id: string
  number: string
  name: string
}

/**
 * The case study's table of contents: every chapter, numbered, as an in-page link. Plain
 * anchors, so it works without JavaScript and native scrolling (smooth only when motion is
 * welcome) carries the visitor; the heading the link lands on says where they are.
 */
export function ChapterIndex({
  label,
  chapters,
  className,
}: {
  label: string
  chapters: readonly ChapterLink[]
  className?: string
}) {
  return (
    <nav aria-label={label} className={[styles.index, className].filter(Boolean).join(' ')}>
      <ol role="list" className={styles.list}>
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <a href={`#${chapter.id}`} className={`t-small ${styles.link}`}>
              <IndexNumber value={chapter.number} className={styles.number} />
              <span>{chapter.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
