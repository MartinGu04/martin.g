import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'

/*
 * The migrations, executed by Postgres itself (PGlite, Postgres compiled to WebAssembly,
 * in memory): never against a real Supabase project. The roles are set up the way Supabase
 * sets them up, including the default privileges that would give anon, authenticated and
 * service_role everything on a new public table, so the test proves the migrations take
 * those away again.
 */

const dir = path.resolve(__dirname, '../../supabase/migrations')
const read = (file: string) => readFileSync(path.join(dir, file), 'utf8')
const LEADS = read('20261003105852_leads.sql')
const NOTES = read('20261003122041_lead_notes.sql')

const SUPABASE_ROLES = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`

let db: PGlite

async function as<T>(role: string, statement: string): Promise<T[] | string> {
  await db.exec(`set role ${role}`)
  try {
    return (await db.query<T>(statement)).rows
  } catch (error) {
    return (error as Error).message
  } finally {
    await db.exec('reset role')
  }
}

const lead = (key: string) =>
  `insert into public.leads (locale, name, email, description, dedupe_key)
   values ('en', 'Synthetic', 'synthetic@leads.example', 'A message.', '${key}') returning id`

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_ROLES)
  await db.exec(LEADS)
  await db.exec(NOTES)
  // Running them again changes nothing and fails nothing.
  await db.exec(LEADS)
  await db.exec(NOTES)
}, 60_000)

describe('migrations on Postgres', () => {
  it('leave exactly select, insert, update and delete to service_role, on both tables', async () => {
    const { rows } = await db.query<{ relname: string; acl: string; rls: boolean; force: boolean }>(
      `select relname, relacl::text as acl, relrowsecurity as rls, relforcerowsecurity as force
       from pg_class where relname in ('leads', 'lead_notes') order by relname`,
    )
    expect(rows).toEqual([
      {
        relname: 'lead_notes',
        acl: '{postgres=arwdDxtm/postgres,service_role=arwd/postgres}',
        rls: true,
        force: true,
      },
      {
        relname: 'leads',
        acl: '{postgres=arwdDxtm/postgres,service_role=arwd/postgres}',
        rls: true,
        force: true,
      },
    ])
    const policies = await db.query<{ n: number }>('select count(*)::int as n from pg_policies')
    expect(policies.rows[0]!.n).toBe(0)
  })

  it('give browser roles nothing at all', async () => {
    for (const role of ['anon', 'authenticated']) {
      for (const statement of [
        'select * from public.leads',
        'select * from public.lead_notes',
        "insert into public.lead_notes (lead_id, body) values (gen_random_uuid(), 'x')",
      ])
        expect(await as(role, statement), `${role}: ${statement}`).toMatch(/permission denied/)
    }
    expect(await as('service_role', 'truncate public.lead_notes')).toMatch(/permission denied/)
  })

  it('keep notes on an existing lead, non-blank and at most 4000 characters', async () => {
    const [a] = (await as<{ id: string }>('service_role', lead('id:pg-a'))) as { id: string }[]
    const insert = (body: string, leadId = a!.id) =>
      as(
        'service_role',
        `insert into public.lead_notes (lead_id, body) values ('${leadId}', '${body}') returning id`,
      )
    expect(await insert('A note.')).toHaveLength(1)
    expect(
      await as(
        'service_role',
        `insert into public.lead_notes (lead_id, body) values ('${a!.id}', repeat('x', 4000)) returning id`,
      ),
    ).toHaveLength(1)
    expect(await insert('')).toMatch(/lead_notes_body_check/)
    expect(await insert('   ')).toMatch(/lead_notes_body_check/)
    expect(
      await as(
        'service_role',
        `insert into public.lead_notes (lead_id, body) values ('${a!.id}', repeat('x', 4001))`,
      ),
    ).toMatch(/lead_notes_body_check/)
    expect(await insert('Orphan.', '0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f')).toMatch(
      /lead_notes_lead_id_fkey/,
    )
  })

  it('delete a lead’s notes with it, and only its notes', async () => {
    const [a] = (await as<{ id: string }>('service_role', lead('id:pg-cascade-a'))) as {
      id: string
    }[]
    const [b] = (await as<{ id: string }>('service_role', lead('id:pg-cascade-b'))) as {
      id: string
    }[]
    await as(
      'service_role',
      `insert into public.lead_notes (lead_id, body) values ('${a!.id}', 'first'), ('${a!.id}', 'second'), ('${b!.id}', 'kept')`,
    )
    await as('service_role', `delete from public.leads where id = '${a!.id}'`)
    const remaining = await as<{ body: string }>(
      'service_role',
      `select body from public.lead_notes where lead_id in ('${a!.id}', '${b!.id}')`,
    )
    expect(remaining).toEqual([{ body: 'kept' }])
  })

  it('keep the unique dedupe key the Contact action relies on', async () => {
    await as('service_role', lead('id:pg-dedupe'))
    const repeat = await as(
      'service_role',
      `insert into public.leads (locale, name, email, description, dedupe_key)
       values ('en', 'Synthetic', 'synthetic@leads.example', 'A message.', 'id:pg-dedupe')
       on conflict (dedupe_key) do nothing returning id`,
    )
    expect(repeat).toEqual([])
  })
})
