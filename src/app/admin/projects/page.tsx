import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminShell } from '@/components/admin/AdminShell'
import { LocaleStatus } from '@/components/admin/ProjectEditor'
import { requireAdmin } from '@/lib/admin/auth'
import { EDITOR_LOCALES, isCopyComplete, type EditorProject } from '@/lib/projects/copy-rules'
import { loadEditorProjects } from '@/lib/projects/editor'
import controls from '@/components/admin/controls.module.css'
import styles from '@/components/admin/ProjectPages.module.css'

export const metadata: Metadata = { title: 'Projects' }

const copyOf = (project: EditorProject, locale: 'he' | 'en') =>
  project.saved[locale] ?? project.defaults[locale]

/** Every project once, with the state of its Hebrew and English text. */
export default async function AdminProjectsPage() {
  const admin = await requireAdmin()
  const projects = await loadEditorProjects()

  return (
    <AdminShell email={admin.email} current="projects">
      <div className={styles.heading}>
        <h1 className={`t-heading-3 ${styles.title}`}>Projects</h1>
        <p className={`t-small ${styles.intro}`}>
          Each project has one entry. Its Hebrew and English text are edited separately; everything
          else is shared and lives in the code.
        </p>
      </div>
      {projects === null ? (
        <div className={styles.notice} role="alert">
          <p className="t-body">The projects’ saved text could not be loaded right now.</p>
          <p className="t-small">Nothing was changed. Try again in a moment.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project.id} className={styles.row} data-project={project.id}>
              <div className={styles.names}>
                <p lang="he" dir="rtl" className={`t-body ${styles.name}`}>
                  {copyOf(project, 'he').title}
                </p>
                <p lang="en" dir="ltr" className="t-small">
                  {copyOf(project, 'en').title}
                </p>
                <p className={`t-small ${styles.meta}`}>
                  {project.id} · {project.shared.visibility} · {project.shared.status}
                </p>
              </div>
              <div className={styles.statuses}>
                {EDITOR_LOCALES.map((locale) => (
                  <LocaleStatus
                    key={locale}
                    locale={locale}
                    complete={isCopyComplete(copyOf(project, locale))}
                  />
                ))}
              </div>
              <Link
                href={`/admin/projects/${project.id}`}
                className={`${controls.secondary} ${styles.edit}`}
              >
                Edit<span className="visually-hidden"> {copyOf(project, 'en').title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
