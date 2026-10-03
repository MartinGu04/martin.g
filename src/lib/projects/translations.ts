import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isLocale, type Locale } from '@/i18n/config'
import { leadStoreConfig, type LeadStoreConfig } from '@/lib/leads/config'
import type { Database } from '@/lib/leads/database'
import { cleanCopy, copyErrors, type ProjectCopy, type SavedCopy } from './copy-rules'

/*
 * Localized project copy edited in the admin (Phase 8C, `project_translations`): one row
 * per project and locale, overriding the code's own title and short description for that
 * locale only. Shared properties never live here. Rows are read on the server only: by
 * Production builds, which bake them into the static pages (so the leak check and release
 * gate see them), and by the admin editor. Writes go through the admin's Server Actions,
 * one locale's row at a time.
 *
 * Errors carry a code only (a Postgres or PostgREST code, or 'network'), never a value.
 */

export type TranslationRow = {
  project_id: string
  locale: string
  title: string
  summary: string
  created_at: string
  updated_at: string
}

export type TranslationInsert = Omit<TranslationRow, 'created_at' | 'updated_at'> &
  Partial<Pick<TranslationRow, 'created_at' | 'updated_at'>>

/** The table as the Supabase client sees it (kept beside the leads schema's shape). */
export type ContentDatabase = {
  public: {
    Tables: {
      project_translations: {
        Row: TranslationRow
        Insert: TranslationInsert
        Update: Partial<TranslationRow>
        Relationships: []
      }
    }
    Views: Database['public']['Views']
    Functions: Database['public']['Functions']
    Enums: Database['public']['Enums']
    CompositeTypes: Database['public']['CompositeTypes']
  }
}

/** Saved copy, by project id and locale. */
export type Translations = Map<string, Partial<Record<Locale, SavedCopy>>>

export const TRANSLATION_COLUMNS = 'project_id, locale, title, summary, updated_at' as const

export class TranslationsError extends Error {
  constructor(
    readonly operation: string,
    readonly code: string,
  ) {
    super(`Project translations ${operation} failed (${code})`)
  }
}

const codeOf = (error: { code?: string } | null | undefined) => error?.code?.trim() || 'network'

/**
 * The fetch beneath Next's: Next wraps the global fetch and keeps build-time responses in
 * its data cache (`.next/cache/fetch-cache`), which Vercel restores from one build to the
 * next, so a build could publish the copy an earlier build read. The build's read goes
 * around that wrapper: never cached, and invisible to Next, so the pages stay static.
 * Resolved at call time, so the production simulation's network guard (installed beneath
 * Next's wrapper) still sees it. scripts/production-simulation.mjs checks that no copy
 * reaches the data cache.
 */
export function uncachedFetch(): typeof fetch {
  const current = globalThis.fetch as typeof fetch & { _nextOriginalFetch?: typeof fetch }
  return current._nextOriginalFetch ?? current
}

/**
 * The server's client for project copy: elevated (secret key), server only, no auth state.
 * The build's read uses `uncachedFetch` (see there); the admin, which renders per request,
 * reads and writes with `cache: 'no-store'`.
 */
export function createContentClient(
  config: LeadStoreConfig,
  { forAdmin = false }: { forAdmin?: boolean } = {},
): SupabaseClient<ContentDatabase> {
  return createClient<ContentDatabase>(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(8000)
        const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
        return forAdmin
          ? fetch(input, { ...init, cache: 'no-store', signal })
          : uncachedFetch()(input, { ...init, signal })
      },
    },
  })
}

/** Rows to saved copy. Rows the table's checks would refuse are skipped, never shown. */
export function rowsToTranslations(rows: readonly Partial<TranslationRow>[]): Translations {
  const translations: Translations = new Map()
  for (const row of rows) {
    if (!row.project_id || !isLocale(row.locale)) continue
    const copy = { title: row.title ?? '', summary: row.summary ?? '' }
    if (Object.keys(copyErrors(copy)).length > 0) continue
    const saved: SavedCopy = cleanCopy(copy)
    if (row.updated_at) saved.updatedAt = row.updated_at
    translations.set(row.project_id, { ...translations.get(row.project_id), [row.locale]: saved })
  }
  return translations
}

export async function readTranslations(
  client: SupabaseClient<ContentDatabase>,
): Promise<Translations> {
  const { data, error } = await client.from('project_translations').select(TRANSLATION_COLUMNS)
  if (error) throw new TranslationsError('read', codeOf(error))
  return rowsToTranslations(data ?? [])
}

/**
 * Saves one locale's copy of one project: an upsert of the (project, locale) row only. The
 * other locale's row is never part of the statement, so saving English can never change
 * Hebrew, or the reverse. The copy must already be clean and valid.
 */
export async function saveTranslation(
  client: SupabaseClient<ContentDatabase>,
  projectId: string,
  locale: Locale,
  copy: ProjectCopy,
  at: Date,
): Promise<SavedCopy> {
  const { data, error } = await client
    .from('project_translations')
    .upsert(
      {
        project_id: projectId,
        locale,
        title: copy.title,
        summary: copy.summary,
        updated_at: at.toISOString(),
      },
      { onConflict: 'project_id,locale' },
    )
    .select(TRANSLATION_COLUMNS)
  if (error) throw new TranslationsError('save', codeOf(error))
  const saved = rowsToTranslations(data ?? []).get(projectId)?.[locale]
  if (!saved) throw new TranslationsError('save', 'no-row')
  return saved
}

/** The admin's client, or null when the database is not configured in this environment. */
export function configuredContentClient(
  env: Record<string, string | undefined> = process.env,
): SupabaseClient<ContentDatabase> | null {
  const config = leadStoreConfig(env)
  return config ? createContentClient(config, { forAdmin: true }) : null
}

type Env = Record<string, string | undefined>

let cached: Promise<Translations> | null = null

/**
 * The saved project copy for the public site, read once per server process. Without
 * Supabase configured (local, CI, Preview) there is none and the code's copy is used. A
 * Vercel Production build fails closed when it cannot read it, rather than silently
 * publishing older copy over Martin's edits. The error carries a code only.
 */
export function loadSiteTranslations(env: Env = process.env): Promise<Translations> {
  cached ??= (async () => {
    const config = leadStoreConfig(env)
    if (!config) return new Map()
    try {
      return await readTranslations(createContentClient(config))
    } catch (error) {
      const code = error instanceof TranslationsError ? error.code : 'unknown'
      if (env.VERCEL_ENV === 'production')
        throw new Error(
          `[content] Project translations could not be read (${code}); a production build needs them (docs/ARCHITECTURE.md, "Project editor (Phase 8C)").`,
        )
      console.warn(
        `[content] Project translations could not be read (${code}); using the code's copy.`,
      )
      return new Map()
    }
  })()
  return cached
}

/** Tests only. */
export function resetSiteTranslations() {
  cached = null
}
