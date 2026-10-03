-- Contact inquiries (Phase 8A): the durable record of every valid inquiry sent from
-- /[locale]/contact. docs/ARCHITECTURE.md, "Contact" and "Leads (Supabase)".
--
-- The remote table was provisioned before the repository integration. This migration
-- records that schema exactly (columns, defaults, constraints, indexes, comment, row level
-- security and privileges, as hardened) so it can be reproduced. It never drops, truncates
-- or rewrites data and is idempotent: run against the existing table it changes nothing.
-- Never push it to that project; mark it as applied there instead:
--   supabase migration repair --status applied 20261003105852
--
-- Access model: server only. The website's server is the only client, through the
-- service_role (the sb_secret_... key, never in the browser), which holds select, insert,
-- update and delete only. Browser roles (anon, authenticated) have no table privileges.
--
-- Deliberately no RLS policies. RLS is enabled and forced so that any role without
-- BYPASSRLS, including a future grant made by mistake, sees and writes no rows: with no
-- policy, the default is deny. service_role bypasses RLS by design, so it needs no policy.
-- A policy would only ever add access, and no browser role is meant to have any.

create table if not exists public.leads (
  id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locale text not null,
  name text not null,
  email text not null,
  phone text,
  kind text,
  description text not null,
  business text,
  link text,
  timeline text,
  status text not null default 'new',
  dedupe_key text not null,
  notification_status text not null default 'pending',
  notification_sent_at timestamptz,
  constraint leads_pkey primary key (id),
  constraint leads_dedupe_key_key unique (dedupe_key),
  constraint leads_locale_check check (locale = any (array['he'::text, 'en'::text])),
  constraint leads_name_check check (char_length(name) >= 1 and char_length(name) <= 100),
  constraint leads_email_check check (char_length(email) >= 3 and char_length(email) <= 254),
  constraint leads_phone_check check (phone is null or char_length(phone) <= 32),
  constraint leads_kind_check check (kind is null or char_length(kind) <= 64),
  constraint leads_description_check
    check (char_length(description) >= 1 and char_length(description) <= 4000),
  constraint leads_business_check check (business is null or char_length(business) <= 150),
  constraint leads_link_check check (link is null or char_length(link) <= 500),
  constraint leads_timeline_check check (timeline is null or char_length(timeline) <= 64),
  constraint leads_status_check check (
    status = any (
      array['new'::text, 'contacted'::text, 'talking'::text, 'proposal_sent'::text,
        'won'::text, 'lost'::text]
    )
  ),
  constraint leads_dedupe_key_check
    check (char_length(dedupe_key) >= 1 and char_length(dedupe_key) <= 96),
  constraint leads_notification_status_check
    check (notification_status = any (array['pending'::text, 'sent'::text, 'failed'::text]))
);

comment on table public.leads is
  'MARTIN.G contact inquiries. Server-only source of truth; no browser role has table privileges.';

-- Newest first; by status, newest first; and an inquirer's history by email in any case.
create index if not exists leads_created_at_idx on public.leads using btree (created_at desc);
create index if not exists leads_status_created_at_idx
  on public.leads using btree (status, created_at desc);
create index if not exists leads_email_idx on public.leads using btree (lower(email));

alter table public.leads enable row level security;
alter table public.leads force row level security;

-- Supabase's default privileges grant every privilege on new public tables to anon,
-- authenticated and service_role: revoke them all explicitly, together with anything
-- granted to every role through public.
revoke all on table public.leads from public;
revoke all on table public.leads from anon;
revoke all on table public.leads from authenticated;
revoke all on table public.leads from service_role;

-- The server's role: exactly what the Contact action and handling the leads need, and no
-- more (no truncate, references, trigger or maintain), as hardened on the live table.
grant select, insert, update, delete on table public.leads to service_role;
