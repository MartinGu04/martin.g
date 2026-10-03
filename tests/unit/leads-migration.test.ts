import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * The leads migration must reproduce the hardened live access model on a fresh database:
 * RLS enabled and forced, no policies, nothing for public, anon or authenticated, and
 * service_role with select, insert, update and delete only. Supabase's default privileges
 * give service_role every privilege on a new public table, so the migration revokes all
 * first and then grants exactly those four.
 */

const dir = path.resolve(__dirname, '../../supabase/migrations')
const file = path.join(dir, '20261003105852_leads.sql')

/** The statements, without comments, normalized to single-spaced lowercase. */
function statements(): string[] {
  return readFileSync(file, 'utf8')
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean)
}

describe('leads migration', () => {
  it('is the only migration, named for the version marked applied on the live project', () => {
    expect(readdirSync(dir)).toEqual(['20261003105852_leads.sql'])
  })

  it('enables and forces row level security, with no policy by design', () => {
    const sql = statements()
    expect(sql).toContain('alter table public.leads enable row level security')
    expect(sql).toContain('alter table public.leads force row level security')
    expect(sql.some((s) => /\bpolicy\b/.test(s))).toBe(false)
  })

  it('leaves public, anon and authenticated without any privilege', () => {
    const sql = statements()
    for (const role of ['public', 'anon', 'authenticated'])
      expect(sql).toContain(`revoke all on table public.leads from ${role}`)
    expect(
      sql.some((s) => s.startsWith('grant') && /\b(public|anon|authenticated)\b$/.test(s)),
    ).toBe(false)
  })

  it('grants service_role select, insert, update and delete only, after revoking all', () => {
    const sql = statements()
    const revoke = sql.indexOf('revoke all on table public.leads from service_role')
    const grants = sql.filter((s) => s.startsWith('grant'))
    expect(revoke).toBeGreaterThanOrEqual(0)
    expect(grants).toEqual([
      'grant select, insert, update, delete on table public.leads to service_role',
    ])
    expect(sql.indexOf(grants[0]!)).toBeGreaterThan(revoke)
    for (const privilege of ['all', 'truncate', 'references', 'trigger', 'maintain'])
      expect(grants[0]).not.toMatch(new RegExp(`\\b${privilege}\\b`))
  })

  it('never drops, truncates or deletes', () => {
    for (const s of statements()) expect(s).not.toMatch(/^(drop|truncate|delete)\b/)
  })
})
