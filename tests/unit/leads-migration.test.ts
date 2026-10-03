import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Each migration must reproduce the hardened access model on a fresh database: RLS enabled
 * and forced, no policies, nothing for public, anon or authenticated, and service_role with
 * select, insert, update and delete only. Supabase's default privileges give service_role
 * every privilege on a new public table, so each migration revokes all first and then
 * grants exactly those four. (Executed against Postgres for review; see
 * docs/ARCHITECTURE.md, "Admin CRM (Phase 8B)".)
 */

const dir = path.resolve(__dirname, '../../supabase/migrations')

const MIGRATIONS = [
  { file: '20261003105852_leads.sql', table: 'leads' },
  { file: '20261003122041_lead_notes.sql', table: 'lead_notes' },
  { file: '20261003152740_project_translations.sql', table: 'project_translations' },
] as const

/** The statements, without comments, normalized to single-spaced lowercase. */
function statements(file: string): string[] {
  return readFileSync(path.join(dir, file), 'utf8')
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean)
}

describe('migrations', () => {
  it('are exactly these, in order: the live leads table, the Phase 8B notes, then the Phase 8C project copy', () => {
    expect(readdirSync(dir).sort()).toEqual(MIGRATIONS.map((m) => m.file))
  })
})

for (const { file, table } of MIGRATIONS) {
  describe(`${table} migration`, () => {
    const sql = statements(file)

    it('enables and forces row level security, with no policy by design', () => {
      expect(sql).toContain(`alter table public.${table} enable row level security`)
      expect(sql).toContain(`alter table public.${table} force row level security`)
      expect(sql.some((s) => /\bpolicy\b/.test(s))).toBe(false)
    })

    it('leaves public, anon and authenticated without any privilege', () => {
      for (const role of ['public', 'anon', 'authenticated'])
        expect(sql).toContain(`revoke all on table public.${table} from ${role}`)
      expect(
        sql.some((s) => s.startsWith('grant') && /\b(public|anon|authenticated)\b$/.test(s)),
      ).toBe(false)
    })

    it('grants service_role select, insert, update and delete only, after revoking all', () => {
      const revoke = sql.indexOf(`revoke all on table public.${table} from service_role`)
      const grants = sql.filter((s) => s.startsWith('grant'))
      expect(revoke).toBeGreaterThanOrEqual(0)
      expect(grants).toEqual([
        `grant select, insert, update, delete on table public.${table} to service_role`,
      ])
      expect(sql.indexOf(grants[0]!)).toBeGreaterThan(revoke)
      for (const privilege of ['all', 'truncate', 'references', 'trigger', 'maintain'])
        expect(grants[0]).not.toMatch(new RegExp(`\\b${privilege}\\b`))
    })

    it('never drops, truncates, deletes or alters another table, and can run again', () => {
      for (const s of sql) {
        expect(s).not.toMatch(/^(drop|truncate|delete|update)\b/)
        if (s.startsWith('alter table'))
          expect(s).toMatch(new RegExp(`^alter table public\\.${table} `))
        if (s.startsWith('create table')) expect(s).toMatch(/^create table if not exists /)
        if (s.startsWith('create index')) expect(s).toMatch(/^create index if not exists /)
      }
    })
  })
}

describe('lead_notes migration', () => {
  const sql = statements('20261003122041_lead_notes.sql').join(';\n')

  it('belongs to a lead and goes with it', () => {
    expect(sql).toContain('foreign key (lead_id) references public.leads (id) on delete cascade')
    expect(sql).toContain('lead_id uuid not null')
  })

  it('keeps notes non-blank and at most 4000 characters', () => {
    expect(sql).toContain('check (char_length(btrim(body)) >= 1 and char_length(body) <= 4000)')
  })

  it('indexes a lead’s notes by time, which also covers the foreign key', () => {
    expect(sql).toContain(
      'create index if not exists lead_notes_lead_id_created_at_idx on public.lead_notes using btree (lead_id, created_at desc)',
    )
  })

  it('adds lead_notes only: the leads migration is untouched', () => {
    expect(sql).not.toMatch(/public\.leads\s+(enable|force|add|drop|alter)/)
    expect(sql.match(/create table/g)).toHaveLength(1)
  })
})

describe('project_translations migration', () => {
  const sql = statements('20261003152740_project_translations.sql').join(';\n')

  it('keeps one row per project and locale, Hebrew or English', () => {
    expect(sql).toContain('primary key (project_id, locale)')
    expect(sql).toContain("check (locale = any (array['he'::text, 'en'::text]))")
  })

  it('holds localized text only, never a shared property', () => {
    expect(sql).toContain(
      'create table if not exists public.project_translations ( project_id text not null, locale text not null, title text not null, summary text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint',
    )
  })

  it('adds project_translations only: the leads migrations are untouched', () => {
    expect(sql).not.toMatch(/public\.(leads|lead_notes)\b/)
  })
})
