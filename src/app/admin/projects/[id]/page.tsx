import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { AdminShell } from '@/components/admin/AdminShell'
import { ProjectEditor } from '@/components/admin/ProjectEditor'
import { PublishPanel } from '@/components/admin/PublishPanel'
import { requireAdmin } from '@/lib/admin/auth'
import { editorProjects, isEditableProject, loadEditorProjects } from '@/lib/projects/editor'
import { deployHookUrl } from '@/lib/projects/publish'
import styles from '@/components/admin/ProjectPages.module.css'

export const metadata: Metadata = { title: 'Edit project' }

/**
 * One project: its Hebrew and English text in one editor, and its shared properties,
 * which are read-only here (they live in the code). If the saved text cannot be read, the
 * editor shows the code's text read-only, so nothing saved can be overwritten blindly.
 */
export default async function AdminProjectPage({
  params,
  searchParams,
}: PageProps<'/admin/projects/[id]'>) {
  const admin = await requireAdmin()
  const { id } = await params
  if (!isEditableProject(id)) notFound()
  const requested = (await searchParams).locale
  const initialLocale = isLocale(requested) ? requested : 'he'

  const loaded = await loadEditorProjects()
  const project = (loaded ?? editorProjects(new Map())).find((p) => p.id === id)
  if (!project) notFound()
  const facts = project.shared

  return (
    <AdminShell email={admin.email} current="projects">
      <p className={styles.back}>
        <Link href="/admin/projects" className="t-small">
          <span aria-hidden="true">←</span>All projects
        </Link>
      </p>
      <div className={styles.heading}>
        <h1 className={`t-heading-3 ${styles.title}`}>
          {project.defaults.en.title}
          <span className="visually-hidden"> (edit)</span>
        </h1>
        <p className={`t-small ${styles.intro}`}>
          Switch between HE and EN to edit each language. Saving one language never changes the
          other.
        </p>
      </div>
      {loaded === null ? (
        <div className={styles.notice} role="alert">
          <p className="t-body">The saved text could not be loaded, so editing is paused.</p>
          <p className="t-small">Nothing was changed. Try again in a moment.</p>
        </div>
      ) : null}
      <div className={styles.layout}>
        <ProjectEditor project={project} initialLocale={initialLocale} editable={loaded !== null} />
        <div className={styles.aside}>
          <section className={styles.facts} aria-labelledby="shared-heading">
            <h2 id="shared-heading" className={`t-label ${styles.panelTitle}`}>
              Shared by both languages
            </h2>
            <p className={`t-small ${styles.muted}`}>Set in the code. Not editable here.</p>
            <dl className={`t-small ${styles.factList}`}>
              <div>
                <dt>ID</dt>
                <dd>{project.id}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>{facts.visibility}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{facts.status}</dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd className="t-numeric">{facts.order}</dd>
              </div>
              <div>
                <dt>Years</dt>
                <dd className="t-numeric">{facts.years ?? 'Not shown'}</dd>
              </div>
              <div>
                <dt>Live site</dt>
                <dd>{facts.liveUrl ?? 'None'}</dd>
              </div>
              <div>
                <dt>Media</dt>
                <dd>{facts.media}</dd>
              </div>
              <div>
                <dt>Disciplines</dt>
                <dd>{facts.disciplines}</dd>
              </div>
              <div>
                <dt>Copy review</dt>
                <dd>
                  HE {project.review.he === 'approved' ? 'approved' : 'draft'} · EN{' '}
                  {project.review.en === 'approved' ? 'approved' : 'draft'}
                </dd>
              </div>
            </dl>
          </section>
          <PublishPanel available={deployHookUrl() !== null} />
        </div>
      </div>
    </AdminShell>
  )
}
