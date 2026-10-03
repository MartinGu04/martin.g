-- The admin's project editor (Phase 8C): localized copy for each portfolio project, one
-- row per project and locale. docs/ARCHITECTURE.md, "Project editor (Phase 8C)".
--
-- A project stays one entity: its identity and every shared property (media, order,
-- visibility, URLs, years, technical configuration) live in the code registry
-- (src/content/projects). This table holds only the localized text that overrides the
-- code's own copy for one locale: the title and the short description. Hebrew and English are separate rows, so saving one locale can
-- never touch the other. A project without a row in a locale uses the code's copy.
--
-- The public site reads this table at build time only (Vercel Production), so every
-- edit reaches visitors through a build, where the confidential leak check and the
-- release gate run on the output.
--
-- It never drops, truncates or rewrites data and is idempotent: running it again changes
-- nothing.
--
-- Access model: the same as `leads` and `lead_notes`. The website's server is the only
-- client, through the service_role (the sb_secret_... key), which holds select, insert,
-- update and delete only. Browser roles have no table privileges, and there are
-- deliberately no RLS policies: RLS is enabled and forced, so any role without
-- BYPASSRLS sees and writes nothing.

create table if not exists public.project_translations (
  project_id text not null,
  locale text not null,
  title text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_translations_pkey primary key (project_id, locale),
  constraint project_translations_project_id_check
    check (char_length(project_id) <= 64 and project_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint project_translations_locale_check check (locale = any (array['he'::text, 'en'::text])),
  constraint project_translations_title_check
    check (char_length(btrim(title)) >= 1 and char_length(title) <= 120),
  constraint project_translations_summary_check
    check (char_length(btrim(summary)) >= 1 and char_length(summary) <= 500)
);

comment on table public.project_translations is
  'MARTIN.G localized project copy, one row per project and locale. Server-only; read by Production builds.';

alter table public.project_translations enable row level security;
alter table public.project_translations force row level security;

-- Supabase's default privileges grant every privilege on new public tables to anon,
-- authenticated and service_role: revoke them all explicitly, together with anything
-- granted to every role through public.
revoke all on table public.project_translations from public;
revoke all on table public.project_translations from anon;
revoke all on table public.project_translations from authenticated;
revoke all on table public.project_translations from service_role;

-- The server's role: exactly what the editor and the build need, and no more.
grant select, insert, update, delete on table public.project_translations to service_role;
