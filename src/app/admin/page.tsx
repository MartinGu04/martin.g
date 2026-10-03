import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminShell } from '@/components/admin/AdminShell'
import { LeadFilters, LeadTable, Pagination, SummaryCards } from '@/components/admin/Dashboard'
import { requireAdmin } from '@/lib/admin/auth'
import { configuredCrmRepository, CrmError, type LeadListRow } from '@/lib/admin/crm'
import {
  filterLeads,
  isFiltered,
  LEAD_FETCH_LIMIT,
  paginate,
  parseLeadQuery,
  summarize,
} from '@/lib/admin/leads-view'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Leads' }

async function loadLeads(): Promise<LeadListRow[] | null> {
  const crm = configuredCrmRepository()
  if (!crm) return null
  try {
    return await crm.listRecentLeads(LEAD_FETCH_LIMIT)
  } catch (error) {
    console.error(
      `[admin] Loading leads failed (${error instanceof CrmError ? error.code : 'unknown'}).`,
    )
    return null
  }
}

/** The CRM: real counts, the leads newest first, filters and search, one page at a time. */
export default async function AdminLeadsPage({ searchParams }: PageProps<'/admin'>) {
  const admin = await requireAdmin()
  const query = parseLeadQuery(await searchParams)
  const leads = await loadLeads()

  return (
    <AdminShell email={admin.email} current="leads">
      <div className={styles.heading}>
        <h1 className={`t-heading-3 ${styles.title}`}>Leads</h1>
        {leads ? (
          <p className={`t-small t-numeric ${styles.count}`}>
            {leads.length} {leads.length === 1 ? 'inquiry' : 'inquiries'}
          </p>
        ) : null}
      </div>

      {leads === null ? (
        <div className={styles.notice} role="alert">
          <p className="t-body">The leads could not be loaded right now.</p>
          <p className="t-small">Nothing was changed. Try again in a moment.</p>
        </div>
      ) : (
        <LeadsView leads={leads} query={query} />
      )}
    </AdminShell>
  )
}

function LeadsView({
  leads,
  query,
}: {
  leads: LeadListRow[]
  query: ReturnType<typeof parseLeadQuery>
}) {
  const summary = summarize(leads)
  const matching = filterLeads(leads, query)
  const page = paginate(matching, query.page)
  const truncated = leads.length >= LEAD_FETCH_LIMIT

  return (
    <>
      <SummaryCards summary={summary} query={query} />
      {truncated ? (
        <p className={`t-small ${styles.bound}`} role="note">
          Showing the newest {LEAD_FETCH_LIMIT.toLocaleString('en')} leads. Older leads are not
          included in these counts, filters or search.
        </p>
      ) : null}
      <LeadFilters query={query} />
      <p className={`t-small ${styles.results}`} aria-live="polite">
        {isFiltered(query)
          ? `${matching.length} of ${leads.length} ${leads.length === 1 ? 'lead matches' : 'leads match'}`
          : `${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}, newest first`}
      </p>
      {page.items.length > 0 ? (
        <>
          <LeadTable page={page} />
          <Pagination page={page} query={query} />
        </>
      ) : (
        <div className={styles.empty}>
          <p className="t-body">
            {leads.length === 0 ? 'No inquiries yet.' : 'No leads match these filters.'}
          </p>
          {isFiltered(query) ? (
            <Link href="/admin" className={`t-small ${styles.clear}`}>
              Show all leads
            </Link>
          ) : (
            <p className="t-small">New inquiries from the Contact page appear here.</p>
          )}
        </div>
      )}
    </>
  )
}
