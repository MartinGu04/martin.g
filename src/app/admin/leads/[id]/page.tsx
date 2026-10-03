import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/AdminShell'
import { NotificationBadge, StatusBadge } from '@/components/admin/Badges'
import { NoteForm, StatusForm } from '@/components/admin/LeadForms'
import { requireAdmin } from '@/lib/admin/auth'
import { isUuid } from '@/lib/admin/config'
import { configuredCrmRepository, CrmError, type NoteView } from '@/lib/admin/crm'
import {
  formatDateTime,
  kindLabel,
  localeLabels,
  safeExternalUrl,
  telHref,
  timelineLabel,
} from '@/lib/admin/leads-view'
import type { LeadRow } from '@/lib/leads/database'
import styles from './page.module.css'

// The lead's name is not put in the title: titles end up in browser history and tabs.
export const metadata: Metadata = { title: 'Lead' }

async function loadLead(
  id: string,
): Promise<{ lead: LeadRow; notes: NoteView[] } | 'missing' | 'error'> {
  const crm = configuredCrmRepository()
  if (!crm) return 'error'
  try {
    const lead = await crm.getLead(id)
    if (!lead) return 'missing'
    return { lead, notes: await crm.listNotes(id) }
  } catch (error) {
    console.error(
      `[admin] Loading a lead failed (${error instanceof CrmError ? error.code : 'unknown'}).`,
    )
    return 'error'
  }
}

/** One inquiry, complete, as plain text; never rendered as HTML. */
export default async function AdminLeadPage({ params }: PageProps<'/admin/leads/[id]'>) {
  const admin = await requireAdmin()
  const { id } = await params
  if (!isUuid(id)) notFound()
  const result = await loadLead(id.toLowerCase())
  if (result === 'missing') notFound()

  return (
    <AdminShell email={admin.email} current="leads">
      <p className={styles.back}>
        <Link href="/admin" className="t-small">
          <span aria-hidden="true">←</span>All leads
        </Link>
      </p>
      {result === 'error' ? (
        <div className={styles.notice} role="alert">
          <p className="t-body">This lead could not be loaded right now.</p>
          <p className="t-small">Nothing was changed. Try again in a moment.</p>
        </div>
      ) : (
        <LeadDetail lead={result.lead} notes={result.notes} />
      )}
    </AdminShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <dt className={`t-small ${styles.term}`}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  )
}

const notGiven = <span className={styles.none}>Not given</span>

function LeadDetail({ lead, notes }: { lead: LeadRow; notes: NoteView[] }) {
  const website = safeExternalUrl(lead.link)
  const tel = telHref(lead.phone)
  const received = formatDateTime(lead.created_at)

  return (
    <article aria-labelledby="lead-name" className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h1 id="lead-name" className={`t-heading-2 ${styles.name}`} dir="auto">
            {lead.name}
          </h1>
          <p className={`t-small ${styles.meta}`}>
            {lead.business ? (
              <>
                <span dir="auto">{lead.business}</span>
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            Received <time dateTime={lead.created_at}>{received}</time>
          </p>
        </div>
        <div className={styles.badges}>
          <StatusBadge status={lead.status} />
          <NotificationBadge status={lead.notification_status} />
        </div>
        <ul className={styles.actions} aria-label="Reply">
          <li>
            <a href={`mailto:${encodeURI(lead.email)}`} className={styles.action}>
              Email <span dir="ltr">{lead.email}</span>
            </a>
          </li>
          {tel ? (
            <li>
              <a href={tel} className={styles.action}>
                Call <span dir="ltr">{lead.phone}</span>
              </a>
            </li>
          ) : null}
          {website ? (
            <li>
              <a
                href={website.href}
                className={styles.action}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Open website <span dir="ltr">{website.host}</span>
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
          ) : null}
        </ul>
      </header>

      <div className={styles.main}>
        <section aria-labelledby="contact-title" className={styles.section}>
          <h2 id="contact-title" className={`t-label ${styles.sectionTitle}`}>
            Contact
          </h2>
          <dl className={styles.fields}>
            <Field label="Name">
              <span dir="auto">{lead.name}</span>
            </Field>
            <Field label="Email">
              <span dir="ltr">{lead.email}</span>
            </Field>
            <Field label="Phone">
              {lead.phone ? <span dir="ltr">{lead.phone}</span> : notGiven}
            </Field>
            <Field label="Language">{localeLabels[lead.locale] ?? lead.locale}</Field>
            <Field label="Submitted">
              <time dateTime={lead.created_at} className="t-numeric">
                {received}
              </time>
            </Field>
          </dl>
        </section>

        <section aria-labelledby="project-title" className={styles.section}>
          <h2 id="project-title" className={`t-label ${styles.sectionTitle}`}>
            Project
          </h2>
          <dl className={styles.fields}>
            <Field label="Kind">{kindLabel(lead.kind) ?? notGiven}</Field>
            <Field label="Business or project">
              {lead.business ? <span dir="auto">{lead.business}</span> : notGiven}
            </Field>
            <Field label="Website or link">
              {website ? (
                <a
                  href={website.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={styles.link}
                  dir="ltr"
                >
                  {website.href}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              ) : (
                notGiven
              )}
            </Field>
            <Field label="Timeline">{timelineLabel(lead.timeline) ?? notGiven}</Field>
          </dl>
        </section>

        <section aria-labelledby="message-title" className={styles.section}>
          <h2 id="message-title" className={`t-label ${styles.sectionTitle}`}>
            Message
          </h2>
          <p className={`t-body ${styles.message}`} dir="auto">
            {lead.description}
          </p>
        </section>
      </div>

      <aside className={styles.side} aria-label="CRM">
        <section aria-labelledby="crm-title" className={styles.panel}>
          <h2 id="crm-title" className={`t-label ${styles.sectionTitle}`}>
            CRM
          </h2>
          <StatusForm leadId={lead.id} status={lead.status} />
          <dl className={styles.fields}>
            <Field label="Notification">
              <NotificationBadge status={lead.notification_status} />
            </Field>
            <Field label="Notified">
              {lead.notification_sent_at ? (
                <time dateTime={lead.notification_sent_at} className="t-numeric">
                  {formatDateTime(lead.notification_sent_at)}
                </time>
              ) : (
                <span className={styles.none}>No email confirmed</span>
              )}
            </Field>
            <Field label="Updated">
              <time dateTime={lead.updated_at} className="t-numeric">
                {formatDateTime(lead.updated_at)}
              </time>
            </Field>
          </dl>
        </section>

        <section aria-labelledby="notes-title" className={styles.panel}>
          <h2 id="notes-title" className={`t-label ${styles.sectionTitle}`}>
            Notes <span className="t-numeric">({notes.length})</span>
          </h2>
          <NoteForm leadId={lead.id} />
          {notes.length > 0 ? (
            <ol className={styles.notes} aria-label="Notes, newest first">
              {notes.map((note) => (
                <li key={note.id} className={styles.noteItem}>
                  <time
                    dateTime={note.created_at}
                    className={`t-small t-numeric ${styles.noteTime}`}
                  >
                    {formatDateTime(note.created_at)}
                  </time>
                  <p className={`t-small ${styles.noteBody}`} dir="auto">
                    {note.body}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className={`t-small ${styles.none}`}>No notes yet.</p>
          )}
        </section>
      </aside>
    </article>
  )
}
