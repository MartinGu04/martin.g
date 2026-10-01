import Link from 'next/link'
import type { PublicProjectSummary } from '@/content/resolve'
import { Arrow } from '@/components/type/Arrow'
import { Name } from '@/components/type/Name'
import styles from './ProjectLink.module.css'

interface ProjectLinkProps {
  href: PublicProjectSummary['href']
  label: string
  /** The project's name, appended for assistive technology ("View project ON"). */
  title: string
  className?: string
}

/** The explicit way into a project from its scene: label and a direction-aware arrow. */
export function ProjectLink({ href, label, title, className }: ProjectLinkProps) {
  return (
    <Link href={href} className={[`t-label ${styles.link}`, className].filter(Boolean).join(' ')}>
      {label}
      <span className="visually-hidden">
        {' '}
        <Name>{title}</Name>
      </span>
      <Arrow className={styles.arrow} />
    </Link>
  )
}
