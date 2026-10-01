import Link from 'next/link'
import type { PublicProjectSummary } from '@/content/resolve'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Name } from '@/components/type/Name'
import { Reveal } from '@/components/motion/Reveal'
import { Arrow } from '@/components/type/Arrow'
import styles from './ProjectIndex.module.css'

interface ProjectIndexProps {
  projects: (PublicProjectSummary & { number: string })[]
  /** Heading level of each project title inside the section outline. */
  titleLevel?: 3 | 4
}

/**
 * Project index typography: numeral, display title, summary and disciplines on the page
 * grid. The link carries only the title (a concise accessible name); a stretched hit area
 * makes the whole row clickable. Hover styling only on devices that can hover; keyboard
 * focus gets the same state plus the focus ring.
 */
export function ProjectIndex({ projects, titleLevel = 3 }: ProjectIndexProps) {
  const Title = titleLevel === 3 ? 'h3' : 'h4'
  return (
    <ol role="list" className={styles.list}>
      {projects.map((project, i) => (
        <Reveal as="li" key={project.id} order={i} className={styles.row}>
          <IndexNumber value={project.number} className={`t-label muted ${styles.number}`} />
          <Title className={`t-display-xl ${styles.title}`}>
            <Link href={project.href} className={styles.link}>
              <Name>{project.title}</Name>
            </Link>
          </Title>
          <div className={styles.meta}>
            <p className="t-lead">{project.summary}</p>
            <p className="t-small muted">{project.disciplines.join(' · ')}</p>
          </div>
          <Arrow className={styles.arrow} />
        </Reveal>
      ))}
    </ol>
  )
}
