import 'server-only'
import { leadStoreConfig } from '@/lib/leads/config'
import type { LeadNoteRow, LeadRow, LeadStatus } from '@/lib/leads/database'
import { createLeadsAdminClient } from '@/lib/leads/supabase'

/*
 * The admin's CRM data layer: a few narrow operations, separate from the Contact action's
 * lead repository (src/lib/leads/repository.ts), which only ever stores new inquiries.
 * Every operation runs on the server with the elevated client (SUPABASE_SECRET_KEY) and is
 * called only after requireAdmin(): Supabase Auth proves who Martin is, ADMIN_USER_ID
 * authorizes him, and this client performs the operation. Neither the key nor the client
 * ever reaches a browser.
 *
 * Errors carry a code only (a Postgres or PostgREST code, or 'network'), never a value.
 */

/** The columns the dashboard needs, description included for search (never shown there). */
export const LEAD_LIST_COLUMNS =
  'id, created_at, locale, name, email, phone, kind, business, description, status, notification_status' as const

export type LeadListRow = Pick<
  LeadRow,
  | 'id'
  | 'created_at'
  | 'locale'
  | 'name'
  | 'email'
  | 'phone'
  | 'kind'
  | 'business'
  | 'description'
  | 'status'
  | 'notification_status'
>

export type NoteView = Pick<LeadNoteRow, 'id' | 'body' | 'created_at'>

export interface CrmRepository {
  /** The newest leads, at most `limit` (the dashboard's bound). */
  listRecentLeads(limit: number): Promise<LeadListRow[]>
  /** One lead by id, or null. */
  getLead(id: string): Promise<LeadRow | null>
  /** Sets the pipeline status and updated_at. 'missing' when no lead has this id. */
  updateStatus(id: string, status: LeadStatus, at: Date): Promise<'updated' | 'missing'>
  /** A lead's notes, newest first. */
  listNotes(leadId: string): Promise<NoteView[]>
  /** Adds a note. 'missing' when no lead has this id (the foreign key refuses it). */
  addNote(leadId: string, body: string): Promise<'added' | 'missing'>
}

export class CrmError extends Error {
  constructor(
    readonly operation: string,
    readonly code: string,
  ) {
    super(`CRM ${operation} failed (${code})`)
  }
}

const FOREIGN_KEY_VIOLATION = '23503'

function codeOf(error: { code?: string } | null | undefined): string {
  return error?.code?.trim() || 'network'
}

export function supabaseCrmRepository(
  client: ReturnType<typeof createLeadsAdminClient>,
): CrmRepository {
  return {
    async listRecentLeads(limit) {
      const { data, error } = await client
        .from('leads')
        .select(LEAD_LIST_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw new CrmError('list', codeOf(error))
      return (data ?? []) as LeadListRow[]
    },
    async getLead(id) {
      const { data, error } = await client.from('leads').select('*').eq('id', id).limit(1)
      if (error) throw new CrmError('get', codeOf(error))
      return (data?.[0] as LeadRow | undefined) ?? null
    },
    async updateStatus(id, status, at) {
      const { data, error } = await client
        .from('leads')
        .update({ status, updated_at: at.toISOString() })
        .eq('id', id)
        .select('id')
      if (error) throw new CrmError('update', codeOf(error))
      return data && data.length > 0 ? 'updated' : 'missing'
    },
    async listNotes(leadId) {
      const { data, error } = await client
        .from('lead_notes')
        .select('id, body, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
      if (error) throw new CrmError('notes', codeOf(error))
      return (data ?? []) as NoteView[]
    },
    async addNote(leadId, body) {
      const { error } = await client.from('lead_notes').insert({ lead_id: leadId, body })
      if (error?.code === FOREIGN_KEY_VIOLATION) return 'missing'
      if (error) throw new CrmError('note', codeOf(error))
      return 'added'
    },
  }
}

/** The CRM over the elevated client, or null while lead storage is not configured here. */
export function configuredCrmRepository(
  env: Record<string, string | undefined> = process.env,
): CrmRepository | null {
  const config = leadStoreConfig(env)
  return config ? supabaseCrmRepository(createLeadsAdminClient(config)) : null
}
