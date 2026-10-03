import 'server-only'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import type { Locale } from '@/i18n/config'
import { normalizeLink, type ContactValues } from '@/lib/contact/validate'
import { leadStoreConfig } from './config'
import type { LeadInsert, LeadRow } from './database'
import { createLeadsAdminClient } from './supabase'

/*
 * The narrow boundary between the Contact action and where leads live. Two
 * implementations: Supabase (every deployment) and a local JSON file for development and
 * the end-to-end tests (refused on Vercel). Unit tests use their own in-memory one.
 *
 * A lead holds exactly the inquiry's fields, its locale and its dedupe key. Nothing about
 * the request is ever stored: no IP address, user agent, cookie or fingerprint.
 */

export type NewLead = Pick<
  LeadRow,
  | 'locale'
  | 'name'
  | 'email'
  | 'phone'
  | 'kind'
  | 'description'
  | 'business'
  | 'link'
  | 'timeline'
  | 'dedupe_key'
>

/** `created` is a new lead; `duplicate` means the dedupe key was stored before. */
export type CreateResult = { outcome: 'created'; id: string } | { outcome: 'duplicate' }

export interface LeadRepository {
  readonly name: string
  /** Stores a lead once per dedupe key, atomically (the unique constraint decides). */
  create(lead: NewLead): Promise<CreateResult>
  /** Records whether the notification reached Martin. */
  markNotification(id: string, status: 'sent' | 'failed', at: Date): Promise<void>
}

/** Thrown with a code only (a Postgres or PostgREST code, or 'network'); never the values. */
export class LeadStoreError extends Error {
  constructor(
    readonly store: string,
    readonly operation: 'create' | 'update',
    readonly code: string,
  ) {
    super(`${store} ${operation} failed (${code})`)
  }
}

const orNull = (value: string) => (value === '' ? null : value)

/**
 * The lead for a cleaned, validated inquiry. Optional fields left blank are stored as
 * null, never as empty strings; the link is stored as delivered, made absolute.
 */
export function toNewLead(values: ContactValues, locale: Locale, dedupeKey: string): NewLead {
  return {
    locale,
    name: values.name,
    email: values.email,
    phone: orNull(values.phone),
    kind: orNull(values.kind),
    description: values.description,
    business: orNull(values.business),
    link: values.link ? (normalizeLink(values.link) ?? null) : null,
    timeline: orNull(values.timeline),
    dedupe_key: dedupeKey,
  }
}

function errorCode(error: { code?: string } | null | undefined): string {
  return error?.code?.trim() || 'network'
}

export function supabaseLeadRepository(
  client: ReturnType<typeof createLeadsAdminClient>,
): LeadRepository {
  return {
    name: 'supabase',
    async create(lead) {
      const row: LeadInsert = lead
      // INSERT ... ON CONFLICT (dedupe_key) DO NOTHING RETURNING id: one statement, so two
      // instances storing the same inquiry at once still end with one row.
      const { data, error } = await client
        .from('leads')
        .upsert(row, { onConflict: 'dedupe_key', ignoreDuplicates: true })
        .select('id')
      if (error) throw new LeadStoreError('supabase', 'create', errorCode(error))
      const id = data?.[0]?.id
      return id ? { outcome: 'created', id } : { outcome: 'duplicate' }
    },
    async markNotification(id, status, at) {
      const now = new Date().toISOString()
      const { error } = await client
        .from('leads')
        .update({
          notification_status: status,
          notification_sent_at: status === 'sent' ? at.toISOString() : null,
          // The table has no trigger for it.
          updated_at: now,
        })
        .eq('id', id)
      if (error) throw new LeadStoreError('supabase', 'update', errorCode(error))
    },
  }
}

/**
 * A JSON file of rows, shaped like the table, for local development and the end-to-end
 * tests (CONTACT_LEADS_FILE). One writer per process; writes are serialized.
 */
export function fileLeadRepository(file: string): LeadRepository {
  let queue: Promise<unknown> = Promise.resolve()
  const serialized = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task)
    queue = run.catch(() => {})
    return run
  }
  const read = async (operation: 'create' | 'update'): Promise<LeadRow[]> => {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as LeadRow[]
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw new LeadStoreError('file', operation, 'unreadable')
    }
  }
  const write = async (rows: LeadRow[]) => {
    const temporary = `${file}.${process.pid}.tmp`
    await writeFile(temporary, `${JSON.stringify(rows, null, 2)}\n`)
    await rename(temporary, file)
  }
  return {
    name: 'file',
    create: (lead) =>
      serialized(async () => {
        const rows = await read('create')
        if (rows.some((row) => row.dedupe_key === lead.dedupe_key)) return { outcome: 'duplicate' }
        const now = new Date().toISOString()
        const row: LeadRow = {
          id: randomUUID(),
          created_at: now,
          updated_at: now,
          status: 'new',
          notification_status: 'pending',
          notification_sent_at: null,
          ...lead,
        }
        await write([...rows, row])
        return { outcome: 'created', id: row.id }
      }),
    markNotification: (id, status, at) =>
      serialized(async () => {
        const rows = await read('update')
        const row = rows.find((r) => r.id === id)
        if (!row) throw new LeadStoreError('file', 'update', 'not-found')
        row.notification_status = status
        row.notification_sent_at = status === 'sent' ? at.toISOString() : null
        row.updated_at = new Date().toISOString()
        await write(rows)
      }),
  }
}

type Env = Record<string, string | undefined>

/**
 * The configured lead store, or null when there is none (the form then answers
 * "unavailable"). Supabase when configured; otherwise, off Vercel only, the local file.
 */
export function configuredLeadRepository(env: Env = process.env): LeadRepository | null {
  const config = leadStoreConfig(env)
  if (config) return supabaseLeadRepository(createLeadsAdminClient(config))
  // The local file never runs on Vercel, so it can never stand in for real storage.
  if (env.CONTACT_LEADS_FILE && !env.VERCEL) return fileLeadRepository(env.CONTACT_LEADS_FILE)
  return null
}
