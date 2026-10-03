-- Private CRM notes on a lead (Phase 8B): written and read only by the admin's server code
-- (src/lib/admin), never by a browser. docs/ARCHITECTURE.md, "Admin CRM (Phase 8B)".
--
-- Adds `lead_notes` only. It never drops, truncates or rewrites data and is idempotent:
-- running it again changes nothing.
--
-- Access model: the same as `leads`. The website's server is the only client, through the
-- service_role (the sb_secret_... key), which holds select, insert, update and delete only.
-- Browser roles (anon, authenticated) have no table privileges. Being signed in to
-- Supabase Auth grants nothing here: the admin is authorized by the server
-- (ADMIN_USER_ID), which then uses the secret key.
--
-- Deliberately no RLS policies. RLS is enabled and forced so that any role without
-- BYPASSRLS, including a future grant made by mistake, sees and writes no rows: with no
-- policy, the default is deny. service_role bypasses RLS by design, so it needs no policy.
--
-- Notes are plain text, at most 4000 characters, never blank. They are never rendered as
-- HTML. Deleting a lead deletes its notes (on delete cascade).

create table if not exists public.lead_notes (
  id uuid not null default gen_random_uuid(),
  lead_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_notes_pkey primary key (id),
  constraint lead_notes_lead_id_fkey
    foreign key (lead_id) references public.leads (id) on delete cascade,
  constraint lead_notes_body_check
    check (char_length(btrim(body)) >= 1 and char_length(body) <= 4000)
);

comment on table public.lead_notes is
  'MARTIN.G private CRM notes on leads. Server-only; no browser role has table privileges.';

-- A lead's notes, newest first. Its leading column also covers the foreign key, so
-- deleting a lead finds its notes by index.
create index if not exists lead_notes_lead_id_created_at_idx
  on public.lead_notes using btree (lead_id, created_at desc);

alter table public.lead_notes enable row level security;
alter table public.lead_notes force row level security;

-- Supabase's default privileges grant every privilege on new public tables to anon,
-- authenticated and service_role: revoke them all explicitly, together with anything
-- granted to every role through public.
revoke all on table public.lead_notes from public;
revoke all on table public.lead_notes from anon;
revoke all on table public.lead_notes from authenticated;
revoke all on table public.lead_notes from service_role;

-- The server's role: exactly what the admin needs, and no more (no truncate, references,
-- trigger or maintain), matching `leads`.
grant select, insert, update, delete on table public.lead_notes to service_role;
