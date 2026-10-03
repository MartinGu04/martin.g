# Architecture

Approved decisions and the structure that implements them. Update this file when a
decision changes.

## Principles

- Statically generated. Server Components by default; client components only for
  interaction or motion (today: `LocaleSwitch`; the locale not-found boundary;
  `ContactExperience`, the inquiry form's in-place validation, sending and outcome over its
  server action; `PreviewVideo`, the preview player's own play and pause control;
  `MotionController` and `HeaderWorld`, observers that render nothing; and, in the private
  admin, `LoginForm`, `StatusForm` and `NoteForm`, forms over Server Actions). Two inline
  scripts run before the first paint, outside React: the motion head script and the brand
  intro (see Brand intro).
- Content is typed TypeScript, loaded on the server, flattened to one locale before it
  reaches components. A page never carries the other locale's copy.
- English (LTR) and Hebrew (RTL) are equal from day one.
- Accessibility and `prefers-reduced-motion` are requirements, not enhancements.
- Dependencies are added only when they earn their place.

## Structure

```
src/
  proxy.ts                 locale negotiation for unprefixed URLs (Next 16 "proxy")
  app/
    [locale]/              root layout: <html lang dir>; home; work/[slug]; contact; privacy;
                           accessibility; not-found
    admin/                 the private admin (Phase 8B), its own root layout, unlocalized:
                           login; the leads; leads/[id]; not-found
    global-not-found.tsx   every 404, server-rendered: in the URL's locale, else bilingual
    sitemap.ts robots.ts manifest.ts icon.svg icon.png apple-icon.png favicon.ico
  i18n/                    config, negotiation, dictionaries, release gate
  content/                 schema, registry (server-only), resolve (view models), projects/
  components/              brand, layout (grid, rule, header, footer), nav, type, theme, media,
                           motion, project, home, scene, case-study (shared primitives and
                           one composition per case study, e.g. case-study/on), contact,
                           trust (Privacy and Accessibility), a11y (the Enable menu), admin,
                           intro (the brand film as the site's opening)
  fonts/                   self-hosted OFL fonts and licenses
  lib/                     site URL, indexing and metadata helpers, social cards, structured
                           data, CSS var typing, navigation, contact (validation, spam,
                           dedupe key, notifiers, server action), leads (server-only Supabase
                           client, configuration, lead repository), admin (configuration,
                           auth, requireAdmin, proxy branch, CRM data layer, view logic,
                           Server Actions)
  styles/                  layers, tokens, fonts, reset, base, typography, layout, motion
scripts/                   leak-check, lint-policy, setup-hooks, brand-icons (`pnpm brand:icons`),
                           og-cards (`pnpm brand:og`, the social cards),
                           production-simulation and its delivery-guard (see Production
                           simulation)
supabase/                  Supabase CLI config and migrations (leads; lead_notes, Phase 8B)
tests/unit                 Vitest (content, i18n, tokens, grid, policy, leak check, metadata,
                           headers, production simulation, contact and leads, admin, migrations
                           on Postgres)
tests/support              fakes and fixtures: a fake Supabase (Auth and the Data API) for the
                           admin's unit and e2e tests, synthetic users and leads
tests/e2e                  Playwright (routing, direction, axe, confidential, brand, headers,
                           search and social metadata);
                           a setup project warms the optimized images before the tests run
.githooks/                 pre-commit, commit-msg, pre-push
film/                      the brand film, a separate Remotion package (see Brand film)
```

## Locales

- Both locales are prefixed: `/en/...`, `/he/...`. Slugs are shared ASCII.
- Hebrew is the default locale. `/` and unprefixed paths redirect (307, `Vary: Cookie`) in
  `src/proxy.ts`, before anything renders: to the `NEXT_LOCALE` cookie's locale if the
  visitor chose one with the language switch, otherwise to `/he`. The browser language is
  not consulted. Prefixed paths pass through, so there is no redirect loop.
- `x-default` hreflang (page metadata and sitemap) points to the Hebrew URL.
- `dynamicParams = false` everywhere: unknown locales and slugs are 404s.
- 404s are rendered by `global-not-found.tsx` on the server, so they are complete without
  JavaScript. The proxy passes a prefixed URL's locale in the `x-mg-locale` request header;
  a missing `/en` or `/he` address gets that language's 404 inside the site's header and
  footer, and a URL outside any locale gets the bilingual page.
- Dictionaries: `en.ts` is the shape; `he.ts` is typed against it.
- Bidi: numerals, brand and project names, and Latin terms inside Hebrew are isolated with
  `<Ltr>` (`<bdi dir="ltr">`). Brand marks are always `dir="ltr"`.
- Hebrew has no case: label styles switch from tracked uppercase to weight and size through
  `:lang(he)` tokens.

## Design system

Phase 2 established the production visual system, revised to the Cinematic Hybrid+
language; see [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for tokens, typography (Archivo + Noto
Sans Hebrew, self-hosted, script-limited with `unicode-range`), the 4/8/12 grid and named
placements, scenes, atmosphere and project worlds, primitives, brand-mark sizing and clear
space, header/footer rules, motion and the accessibility baseline. The QA specimen lives at
`/[locale]/system` (and the scene demonstration at `/[locale]/system/scenes`) in local and
preview builds only.

- Grid lines follow the inline direction, so layouts mirror in RTL without extra code.
  Physical `left`/`right` CSS is rejected by `lint-policy`.
- `ThemeScope` (server) lets a section control background, foreground, muted text, lines,
  up to two accents, and the color of light and shade; `<Scene>` adds the world's
  atmosphere (light, grid visibility, texture). Derived tokens are re-declared inside the
  scope; `themeIssues()` validates contrast. Spacing, grid, type and motion are never
  themeable.
- Brand marks are the approved MARTIN.G wordmark and MG symbol (Phase 6), faithful SVG
  vectorizations of the supplied artwork used as masks tinted with `currentColor`, with
  CSS-enforced minimum sizes per pixel density. The icon set (favicon, app icons, manifest
  icons) is generated from the symbol SVG by `pnpm brand:icons`.

## Content

`src/content/schema.ts` defines `PublicProject` and `ConfidentialProject` (closed shape, no
route). Media is a union (`image`, `video`, `pending`); video sources are a provider union
with only `static` implemented, so a dedicated video host can be added later without
changing case-study components. Images can be art directed per tier (`art`) and shown whole
(`fit: 'contain'`, for a device cut-out). A public project may carry `links.live`, an https
URL approved for visitors (ON has one; המחלבה deliberately has none).

Project media lives in `src/assets/` (sanitized, metadata-free sources) and is referenced
from each project module.

**Confidential covers (Phase 8C).** Confidential work shows generated abstract geometry
(`AbstractCover`). One explicit exception: `confidential-01` may carry an
`ApprovedInterfaceCover`, its single approved portfolio image
(`src/assets/confidential/confidential-01-interface.webp`), supplied by Martin already fully
anonymized: all text unreadable, no names, numbers, dates, identifiers or product mark, no
recoverable operational information, no metadata. No original or intermediate screenshot
ever enters the repository. The exception is held four ways: the `ConfidentialProject`
type admits that cover for the id `confidential-01` only (`INTERFACE_COVER_EXCEPTION`),
`resolveConfidentialSummary` throws for any other id, a unit test requires the asset
directory to hold that one file with its pinned SHA-256 and no metadata, and its alt text
is generic in both locales. Shown with `object-fit: cover`, a focal point and its aspect
ratio kept, and at most a 1.03 hover zoom (only where hover exists and motion is not
reduced); no parallax. Each confidential card is one real project: `confidential-02`
stays a separate project with its abstract cover. Alt text, captions and player labels written in Phase 4 live in
`src/i18n/dictionaries/showcase.ts` (approved).

**Case studies (Phase 5).** A case study is a composition, not a block template: each world
tells its story its own way, from shared primitives in `src/components/case-study/`
(`ChapterHeading`, `ChapterIndex`, `Crop`, `ReadingProgress`, `NextProject`) and the scene
grammar. `src/app/[locale]/work/[slug]/page.tsx` renders the composed case study when a
project has one (ON since 5A, המחלבה since 5B) and the Phase 4 media page otherwise (for a
future public project, through `ProjectMedia`, which still accepts only `media` and
`sequence` blocks). A project with a
composed case study carries no generic `story` blocks. Details of real images are
`ImageCrop`s: a region of an existing approved asset (optionally another region for phones),
never a new file. Case-study copy lives in its own dictionary (`case-on.ts`, `case-mi-ma-mo.ts`) with its own
review state; it is written as `draft` and stays draft until Martin approves it, so the
release gate refuses a Vercel production build meanwhile. See docs/CASE-STUDIES.md.

## Brand film

`film/` is a separate package (Remotion, its own `package.json`, lockfile and typecheck;
excluded from the site's TypeScript, ESLint and build). It renders the MARTIN.G brand film in
two native cuts, Desktop 16:9 and Mobile 9:16, from one cue table shared by picture and
sound (`film/src/config/timeline.ts`); the soundtrack is synthesized by `film/audio/build.py`.
It keeps its own PNG copies of the approved brand marks (symbol, wordmark and lockup, their
black ink turned white on transparent for the dark film) in `film/brand`; the site's
approved project media (`src/assets/work`) and fonts (`src/fonts`) are copied at build time
(`pnpm assets` in `film/`), so they never exist twice in Git. It follows the same
confidentiality, brand-mark and copy rules. Renders are never committed, with one
exception: the two approved final cuts the site plays as its intro (below). See
film/README.md.

## Brand intro

The approved final cuts of the brand film open the site, once per browser session
(`src/components/intro`). It is part of the site, not a page: there is no route, and the
homepage renders normally beneath it.

- **Assets.** `public/media/brand-film/martin-g-film-desktop.mp4` (1920 by 1080, 44.5s,
  about 20.6 MB) and `martin-g-film-mobile.mp4` (1080 by 1920, its own vertical edit, 35s,
  about 18.7 MB): the approved renders' H.264 video streams copied bit for bit (never
  re-encoded), with the soundtrack the intro never plays and the container's metadata
  removed, the movie header first so playback starts from the first bytes
  (`tests/unit/intro.test.ts`). No original, master or intermediate render is in the
  repository.
- **Hosting, evaluated.** Served by the site itself from `public/`, which Vercel delivers
  from its CDN with range requests. A separate store (Vercel Blob or another CDN) would
  keep about 39 MB out of Git, but would add a media origin to the CSP and contradict the
  privacy page ("served by this website itself"); the files are final and change rarely,
  so the repository carries them once. If they are ever replaced often, move them to a
  store, list its origin in `media-src`, and update the privacy copy first.
- **When.** Only when the first page load of a session is the homepage (`/he` or `/en`, no
  section anchor). That first load, whatever the page, records the session in
  `sessionStorage` (`mg:intro`), so a refresh, an internal navigation or a later load of
  the homepage never plays it again; a new tab or browser session may. Never with reduced
  motion, without scripting, with Save-Data or on a 2G connection, in a background tab, or
  in a browser that cannot play H.264 (`canPlayType`): those visitors get no layer, no
  `<video>` and no request.
- **How.** One inline script, first in `<body>` (`BrandIntro`, `intro-script.ts`), so the
  layer is in place before anything beneath it paints and the film starts without waiting
  for hydration. It chooses the edit by orientation (`(orientation: portrait)`) and
  requests only that file; builds a modal `<dialog>` outside React's tree (React 19 skips
  foreign elements in `<body>` while hydrating), so the page beneath is inert while the
  film plays; and plays the film muted, inline, without native controls, picture in
  picture or remote playback. The film covers the screen while that crops at most about
  6% a side (10% for the vertical edit, whose captions keep clear of its edges), and is
  shown whole on its own black beyond that.
- **Way out.** Skip (a small, quiet button at the closing corner, `t-label`, 44px target,
  the standard focus ring; reached with Tab, the layer itself holds focus on arrival) and
  Escape lift it at once (600ms). An error, a refused autoplay, no first frame within
  2.5s, a picture frozen for 4s, or reduced motion switched on lift it too. Wheel, touch
  and scroll keys never scroll the page beneath.
- **Handover.** Both edits cut to black after MAKE IT REAL. (desktop at 43s, mobile at
  34s); there the layer dissolves (1100ms) into the homepage's own dark surface, and the
  hero's three arrival beats play once more as it lifts, so the film hands over to the
  hero's first beat (`HeroScene.module.css`, keyed to `html[data-intro]`, which reads
  `on`, `out`, then `done`). The layer is then removed from the document and its video
  released. Nothing beneath moves: no layout shift, and a classic scrollbar beside the
  film is painted black rather than hidden.
- **Performance.** The video is never the LCP element (the hero's text paints first and
  stays the LCP, measured in Chromium), nothing waits for it, and the server HTML carries
  only the script (under 4 KB, under 2 KB compressed, on every page). Muted autoplaying video is requested at the browser's low
  media priority; skipping or lifting aborts the rest of the download.
- **On demand.** The header's Film control (`Film` / `סרט`, a button in the primary
  navigation) plays the same film again through the same player, on any page and as often
  as asked, even after the automatic intro. A replay never reads or clears the session's
  record, so the automatic intro stays spent; closing it returns focus to Film. The
  control exists only where the film can play: the script marks `html[data-brand-film]`
  before the header paints (scripting, no reduced motion, a browser that decodes it), so
  it never appears late or shifts the row, and it is never a dead control.
- **Copy** (`src/i18n/dictionaries/intro.ts`, approved): Skip `Skip` / `דלג`, Film `Film` /
  `סרט`. The accessibility statement describes the intro (muted, at most once per session
  on entering the homepage, Skip or Escape, never with reduced motion) beside the ON
  preview.
- **Tests.** `tests/e2e/intro.spec.ts` (fresh session, refresh, navigation, new session,
  the edit per screen at six viewports, Skip by pointer and keyboard, Escape, Hebrew, axe,
  reduced motion, no scripting, every failure, no layout shift; the header's Film control:
  replays after the intro, the session untouched, Skip, Escape, keyboard, both languages,
  one header row at six widths). The suite's Chromium has
  no H.264 decoder, so these tests answer the film URLs with tiny synthetic VP9 films
  (`tests/support/intro-films`); every other test starts with the intro already seen
  (`tests/support/test.ts`).

## Contact (Phase 6)

`/[locale]/contact` is the project inquiry: the homepage's closing scene ("Start a project")
extended into one calm form, statically generated like every page.

- **Fields** (revised in Phase 6 to speak a client's language, not product terminology;
  nobody has to frame their need as "a problem"). Required: name, email, and one
  description of the project. Optional: phone (`type="tel"`, any reasonable format: an
  optional `+`, digits with spaces, dashes, dots or brackets, 7 to 15 digits), the kind of
  project (website, landing page, system or app, an existing website or system, something
  else or not sure yet), business or project name, an existing website or relevant link,
  and when they would like to start (as soon as possible, within the next month, within 1
  to 3 months, more than 3 months from now, no date yet). No budget (premature for a first
  message), nothing else personal.
- **Server action** (`src/lib/contact/action.ts`). Without JavaScript the form posts to it
  and the server renders the answer in place (errors with values kept, or the success
  state). With JavaScript the form validates first (`src/lib/contact/validate.ts`, shared
  with the server), then calls the same action directly, so a lost connection becomes a
  "not sent" state with every value kept. The server is the authority: it cleans (NFC,
  control and bidi override characters removed) and validates everything again. Nothing
  is ever sent in a URL; answers carry no internal detail.
- **Spam** (`spam.ts`): a trap field nobody sees or reaches, and the time the form was open
  (under 3s is software; set in the browser, so without JavaScript only the trap applies).
  Spam is answered like a delivery and never delivered. No CAPTCHA.
- **Duplicates.** The form allows one submission at a time (`aria-disabled` while sending).
  The server keys an inquiry by its submission id (`id:<id>`) or, without JavaScript, by a
  hash of the sender and description (`hash:<sha256>`) (`dedupe.ts`). Since Phase 8 the key
  is the lead's `dedupe_key`, unique in the database, so one inquiry is stored and notified
  once across retries, server instances and restarts, and a repeat is answered as received.
- **Flow (Phase 8).** Contact form → server cleaning, validation and spam checks → the lead
  stored in Supabase (the durable record, see Leads below) → the notification through
  Resend → the lead marked `notification_status = 'sent'` (with `notification_sent_at`) or
  `'failed'`. Spam and invalid submissions are never stored or sent.
- **Delivery** (`notifiers.ts`): a `ContactNotifier` interface. Resend (email) is the
  primary channel; Telegram (a phone ping) is optional; an outbox file serves the e2e tests
  and is refused on Vercel. Plain text only, the visitor's email as reply-to, credentials
  in server-side environment variables (`.env.example`), never logged. Logs name only the
  notifier and status of a failure, never the inquiry. A notification is a message about a
  stored lead, not the record: its failure never loses the inquiry.
- **What the visitor is told.**

  | Outcome                                        | Answer        | Stored / notified           |
  | ---------------------------------------------- | ------------- | --------------------------- |
  | Spam (trap or instant post)                    | `sent`        | no / no                     |
  | Invalid                                        | `invalid`     | no / no                     |
  | Storage or notification not configured         | `unavailable` | no / no                     |
  | Storage fails (error or no connection)         | `failed`      | no / no; values kept, retry |
  | Stored, notified                               | `sent`        | yes, `sent` / yes           |
  | Stored, notification fails                     | `sent`        | yes, `failed` / no          |
  | Stored, recording the notification state fails | `sent`        | yes, `pending` / as it went |
  | Same dedupe key already stored                 | `sent`        | unchanged / no              |

  Once the lead is stored the inquiry has reached MARTIN.G, so the visitor sees the
  success state even if the email fails: asking them to resend would only produce a
  duplicate. Martin finds every stored lead in Supabase, including those whose
  `notification_status` is `'failed'` or still `'pending'`. When storage fails nothing is
  emailed, so a retry never yields a second email for one lead. Tested in
  `tests/unit/contact-leads.test.ts` (the real Supabase client and Resend notifier against
  a fake at the fetch boundary) and `tests/e2e/contact.spec.ts` (a local lead file).

- **Release.** A Vercel production build fails unless Resend is configured, all three of
  `RESEND_API_KEY`, `CONTACT_EMAIL_TO` and `CONTACT_EMAIL_FROM` (`assertContactDelivery`),
  and unless lead storage is, `SUPABASE_URL` and `SUPABASE_SECRET_KEY` with a secret API key
  (`assertLeadStorage`). The errors name only the variables, never a value, so the only
  conversion path can never ship as a dead end or without its record. These configuration
  gates run before the copy and artwork release gates. Telegram alone does not satisfy
  delivery: the privacy page names Resend. Preview and local builds are unaffected and
  their form answers "unavailable" until both storage and a notifier are configured.
- **Configured outside the repository** (Phase 7, by Martin): the variables and the
  rate-limit rule in Production configuration (Vercel), below; verified after the merge.
  Turning Telegram on means updating the privacy copy first.

## Leads (Supabase, Phase 8)

Supabase is the source of truth for Contact inquiries; Resend only notifies.

- **Project.** A dedicated Supabase project, `martin-g`, in `eu-central-1` (Frankfurt). One
  table, `public.leads`: the inquiry's fields (blank optional fields are `null`), `locale`,
  `created_at`, `updated_at`, the pipeline `status` (`new`, `contacted`, `talking`,
  `proposal_sent`, `won`, `lost`; `new` on insert), the unique `dedupe_key`, and
  `notification_status` (`pending`, `sent`, `failed`) with `notification_sent_at`. Indexes
  on `created_at`, `(status, created_at)` and `lower(email)`. Nothing about the request is
  stored: no IP address, user agent, cookie or fingerprint.
- **Server only.** The browser never talks to Supabase: there is no browser client, no
  publishable key in the site and no `NEXT_PUBLIC_` variable. The Contact server action
  stores leads through `src/lib/leads` (every module `server-only`), with
  `@supabase/supabase-js` itself (not an SSR client, so no visitor session or cookie can
  reach it) and no auth state (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`
  all off). It authenticates with a **secret API key** (`sb_secret_...`), which acts as
  `service_role` and bypasses row level security; it is a server-side environment variable
  only, never logged, never in the repository, never in browser output. Publishable keys
  and the legacy `service_role` JWT are refused by the configuration check.
- **Access model** (`supabase/migrations/20261003105852_leads.sql`). RLS enabled and
  forced; every privilege revoked from `public`, `anon`, `authenticated` and `service_role`
  (Supabase's default privileges would otherwise give each of them everything on a new
  table), then `select`, `insert`, `update` and `delete` granted to `service_role` and
  nothing more: no `truncate`, `references`, `trigger` or `maintain`. The live table was
  hardened to exactly this (Phase 8A); its ACL reads
  `postgres=arwdDxtm/postgres, service_role=arwd/postgres`, which the migration reproduces
  on a fresh database (`tests/unit/leads-migration.test.ts`). Deliberately **no RLS
  policies**: a policy can only add access, and no browser role is meant to have any. With
  RLS forced and no policy, any role without `BYPASSRLS`, including one given a grant by
  mistake, sees and changes nothing; `service_role` bypasses RLS by design.
- **Idempotency.** The insert is `INSERT ... ON CONFLICT (dedupe_key) DO NOTHING RETURNING
id` in one request, so concurrent submissions of one inquiry on several instances still
  produce one row; an empty result means "already received". The table has no trigger:
  the server sets `updated_at` when it records the notification.
- **Migrations.** The table was provisioned in the Supabase dashboard before the
  repository integration. The migration records that schema exactly (verified against the
  live catalog: columns, defaults, constraints, indexes, comment, RLS, privileges as
  hardened) and is idempotent: it never drops or rewrites data, so running it against the
  existing table changes nothing. It is never pushed to the existing project: its version
  is marked applied there instead (`supabase link --project-ref <ref>`, then
  `supabase migration repair --status applied 20261003105852 --linked`), so the migration
  history matches without running the table creation. New schema
  changes are new migrations (`supabase migration new`), reviewed, then `supabase db push`.
- **Local and tests.** `CONTACT_LEADS_FILE` stores leads in a local JSON file shaped like
  the table, for local development; it is refused on Vercel. Unit tests run the real client
  against a fake Data API; the e2e suite runs the site against a local fake Supabase (see
  Admin CRM below). CI never uses the real database.

## Admin CRM (Phase 8B)

A private `/admin` where Martin manages the real leads without opening Supabase: an internal
application, not part of the public bilingual portfolio. English, left to right, its own
root layout (`src/app/admin/layout.tsx`) with none of the site's navigation, motion or
third-party scripts.

```
browser ── form POST ──> Server Action ── requireAdmin() ──> Supabase Auth (publishable key)
                                 │                              proves who it is
                                 │   user.id === ADMIN_USER_ID  authorizes Martin only
                                 └──> CRM data layer ──────────> Supabase Data API (secret key)
                                                                 reads and writes the tables
```

- **The browser has no direct database or Supabase access.** There is no browser Supabase
  client, no key in any page or bundle, and no `NEXT_PUBLIC_` variable. Sign-in is a Server
  Action calling Supabase Auth on the server; every page is rendered on the server.
- **Authentication** (`src/lib/admin/session.ts`): Supabase Auth, email and password, with
  `@supabase/ssr` (pinned exactly) keeping the session in cookies. The cookies are scoped to
  `/admin` (never sent with a public page's request), `httpOnly` (no script reads them; there
  is no browser client), `SameSite=Lax`, and `Secure` on Vercel. That client holds the
  publishable key (`SUPABASE_PUBLISHABLE_KEY`, deliberately server-side), which can sign in,
  read and refresh a session and sign out, and nothing else: browser roles have no
  privileges on the tables. No sign-up, no social login, no password reset in this phase.
- **Authorization: exactly one user.** `requireAdmin()` (`src/lib/admin/auth.ts`) is the
  single boundary. Every protected page and every mutating Server Action calls it first:
  (1) a valid Supabase Auth user, confirmed by the auth server (`getUser()`, never a cookie
  alone), and (2) `user.id === ADMIN_USER_ID`. Never an email address, never
  `user_metadata`. Anyone else is redirected to `/admin/login` before anything is read; a
  signed-in user who is not the admin is signed out. Sign-in refusals all read the same
  ("That email and password combination did not work."), so the page never tells whether
  an account exists; a real account that is not the admin is signed out at once and gets
  the same answer.
- **Elevated data access, separately** (`src/lib/admin/crm.ts`). After `requireAdmin()`, the
  CRM operations (list leads, get a lead, update a status, list notes, add a note) use the
  same server-only secret client as lead storage (`SUPABASE_SECRET_KEY`). Supabase Auth
  proves who Martin is, `ADMIN_USER_ID` authorizes him, and the secret client performs the
  operation; neither the key nor the client ever reaches a browser. The CRM layer is
  separate from the Contact action's lead repository, which only stores new inquiries.
- **The proxy** (`src/proxy.ts`, `src/lib/admin/proxy.ts`). `/admin` and `/admin/...` are
  the one deliberate exception to locale routing: never redirected into `/he` or `/en`. Only
  there the session is read and refreshed (a Server Component cannot write cookies), page
  loads without the admin are redirected to `/admin/login`, a session that is not the
  admin's is signed out and its cookies cleared, and the private headers are set. It is
  defense in depth, not the boundary: pages and actions call `requireAdmin()` themselves.
  Server Action POSTs are not redirected by the proxy; the action's own `requireAdmin()`
  redirects. Public routes never reach this code and stay statically generated.
- **Private by default.** Every admin page renders per request (`dynamic = 'force-dynamic'`;
  it reads the session), so no lead data is ever generated at build time, cached or in the
  build output (`lint-policy --built` fails if an admin page is prerendered). Every admin
  response carries `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store,
max-age=0` and `Referrer-Policy: no-referrer` (next.config.ts and the proxy), every page
  a `noindex, nofollow` robots meta, and the sitemap never lists it. A lead's name is not
  put in the page title (browser history). Logs carry a step and a code only, never an
  email address, a lead's content or a secret.
- **Dashboard** (`/admin`): real counts only (New; In progress = contacted + talking +
  proposal sent; Won; Notification issues = email failed or pending), each a shortcut to
  its filter; no trends or percentages (there is no history yet). The leads newest first:
  name and business, email, project kind, language, received time (Israel time), status
  and notification, each status with its label and its own shape, never color alone. Rows
  open the lead. Filters (status, in progress, language, notification) and search (name,
  email, phone, business, description) are a plain GET form, so every view has an address
  and works without JavaScript. **The bound:** the dashboard reads the newest 1,000 leads
  (`LEAD_FETCH_LIMIT`) in one query and filters, searches and pages them on the server
  (`src/lib/admin/leads-view.ts`, 25 per page); search text is compared as text and never
  becomes a PostgREST filter. Past 1,000 leads the page says so, and server-side queries
  replace the bounded fetch.
- **Lead** (`/admin/leads/[id]`): the complete inquiry (contact, project, message), the CRM
  state (status, notification and its time, last update), and actions: an email link, a
  phone link when given, the website when given (only an http(s) URL Contact already
  normalized, opened in a new tab with `noopener noreferrer nofollow`). Inquiry fields and
  notes are always rendered as text, never as HTML.
- **Status** (`updateLeadStatus`): validated against the typed list (`new`, `contacted`,
  `talking`, `proposal_sent`, `won`, `lost`), sets `updated_at`. No optimistic state: the
  page shows what the database holds. Errors never carry a database detail.
- **Notes** (`lead_notes`, `supabase/migrations/20261003122041_lead_notes.sql`): `id`,
  `lead_id` (foreign key to `leads`, `on delete cascade`), `body` (plain text, not blank, at
  most 4,000 characters, enforced by a check constraint and by the action, which cleans it
  like an inquiry's message), `created_at`, `updated_at`; an index on
  `(lead_id, created_at desc)`, which also covers the foreign key. Shown newest first. Add
  only in this phase (no editing or deleting). The same access model as `leads`: RLS
  enabled and forced, no policies by design, all privileges revoked from `public`, `anon`,
  `authenticated` and `service_role`, then `select`, `insert`, `update` and `delete` granted
  to `service_role`. The migration is additive, idempotent and adds `lead_notes` only; it
  is verified on Postgres in CI (`tests/unit/migrations-postgres.test.ts`: privileges, RLS,
  the foreign key and its cascade, the constraints, a re-run). **Applied to the live
  project** after review with the normal workflow (`supabase db push`); both migrations
  are in the remote history, and the live table was verified to match: RLS enabled and
  forced, no policies, no access for `anon` or `authenticated`, `service_role` with select,
  insert, update and delete only, the cascading foreign key and the index.
- **Design.** The MARTIN.G system set for daily use: the brand's black and a raised
  graphite, bone text, the Contact thread's amber for new leads and the primary action, a
  quiet sage for won leads, the type roles at working sizes (no display headlines), the
  Contact form's controls, hairline structure. Desktop first; under 64rem the table becomes
  compact cards. No animation.
- **Accessibility.** Labels on every control, a skip link, visible focus, errors announced
  and focused, status never by color alone, 44px targets, no horizontal scroll at 320px,
  axe clean (tested in `tests/e2e/admin.spec.ts`).
- **Tests and local runs.** No test or CI job touches the real project. Unit tests
  (`tests/unit/admin.test.ts`) and the e2e suite run the real `@supabase/ssr` and supabase-js
  code against `tests/support/fake-supabase-server.mjs`, a local fake of Supabase Auth and
  the Data API subset the site uses, with synthetic keys, users and leads
  (`tests/support/admin-fixtures.mjs`); the e2e suite starts it next to the site, and Contact
  submissions are stored there too. It enforces the security model that matters: only the
  secret key reaches the tables, a session ends at sign-out, notes need a lead.
- **Preview.** Preview never receives the Production `SUPABASE_SECRET_KEY` (nor its
  publishable key or `ADMIN_USER_ID`), so its admin says "not configured" and shows nothing.
  To try the admin with data: locally against the fake (`node
tests/support/fake-supabase-server.mjs` and the values in `admin-fixtures.mjs`), or on a
  Preview connected to a separate, non-production Supabase project with its own keys and
  synthetic leads. Never connect Preview to the Production database.

**Manual Supabase Auth setup (by Martin, once; done for Phase 8B):**

1. Authentication, Sign In / Providers: keep **Email** enabled; **turn off "Allow new users
   to sign up"**; no social providers. Confirm email can stay on.
2. Authentication, Users, **Add user**, "Create new user": Martin's email and a strong,
   unique password (a password manager), "Auto Confirm User" on. No other users.
3. Copy that user's **UID**: it is `ADMIN_USER_ID`.
4. Project Settings, API Keys: copy the **publishable key** (`sb_publishable_...`) for
   `SUPABASE_PUBLISHABLE_KEY`. The secret key is already `SUPABASE_SECRET_KEY`.
5. Keep the default sign-in rate limits. Leaked-password protection is not available on
   the project's current Supabase plan (the advisor's warning about it is expected); the
   one account's password is long, unique and from a password manager instead.

## Project editor (Phase 8C)

`/admin/projects` lists every registered project once; `/admin/projects/<id>` edits its
localized text. A project stays one entity: its id and every shared property (media, order,
visibility and publication state, live URL, years, disciplines, technical configuration)
live in the code registry (`src/content/projects`) and are shown read-only. The editor owns
only the fields the schema localizes and the site shows per project: the **title** and the
**short description** (the category line comes from the shared disciplines, and projects
have no per-project long description or call to action, so there is nothing else to edit).

```
editor (HE | EN) ── Save <language> ──> saveProjectCopy ── requireAdmin() ──> upsert one row
                                                                            (project, locale)
Publish to the site ──> publishSite ── requireAdmin() ──> Vercel Deploy Hook ──> Production
                                                                                  build reads
                                                                                  every row
```

- **Storage.** `public.project_translations`
  (`supabase/migrations/20261003152740_project_translations.sql`): one row per
  `(project_id, locale)`, `locale` is `he` or `en`, `title` 1 to 120 and `summary` 1 to 500
  characters, non-blank. The access model of `leads`: RLS enabled and forced, no policies,
  nothing for browser roles, `service_role` with select, insert, update and delete only.
  A locale without a row shows the code's copy.
- **Hebrew and English never overwrite each other.** The HE | EN switch (a compact
  segmented control; plain links without JavaScript) changes only which language's fields
  are shown: both languages' unsaved text stays in the page while switching. Save sends the
  shown language alone, and the action upserts exactly that `(project, locale)` row, so
  saving English cannot change Hebrew, or the reverse. The Hebrew fields are `lang="he"`,
  `dir="rtl"`; the English ones `lang="en"`, `dir="ltr"`. Each language shows its state,
  `HE ✓` or `EN • Missing`, and `Unsaved` while its text differs from what is stored. A
  language never edited before starts from the site's current text, so nothing is lost.
  If the saved text cannot be read, the editor shows the code's text read-only rather
  than let a save be based on it.
- **Validation** (`src/lib/projects/copy-rules.ts`, shared by the browser and the action):
  values are cleaned as Contact cleans them (NFC, no control or bidi override characters,
  one line, trimmed), then required and bounded as the table's checks are.
- **Reaching the public site.** Public pages stay statically generated: a build reads every
  row once (`loadSiteTranslations`) through the fetch beneath Next's wrapper
  (`uncachedFetch`), so the read never enters Next's data cache, which Vercel restores
  between builds and would otherwise hand a later build stale copy, and Next never sees a
  request that could make the pages dynamic. `src/content/saved-copy.ts` lays each row over its project's copy in its own locale only.
  Saved text therefore reaches visitors only through a Production build, where the leak
  check and the built-HTML policy run on it: text that could identify confidential work
  fails the deployment and never goes live. **A Vercel Production build fails closed when
  the table cannot be read** (an unreachable database, or the migration not yet applied),
  rather than silently publish the code's copy over Martin's edits; Preview and local
  builds fall back to the code's copy with a warning. The release gate still reads the
  review state in the code: copy saved here does not approve a project marked `draft`.
- **Publishing.** "Publish to the site" calls the Vercel Deploy Hook in
  `VERCEL_DEPLOY_HOOK_URL` (a secret; https on `api.vercel.com` only). Without it, saved
  text goes live with the next deployment.

**Manual setup (by Martin, once):**

1. Apply the migration to the Production project through the normal migration workflow
   (`supabase db push`, or the SQL editor with the file's contents), **before merging**:
   a Production build fails until the table exists.
2. Vercel, Project Settings, Git, Deploy Hooks: create a hook for the production branch;
   set its URL as `VERCEL_DEPLOY_HOOK_URL` (Production, Sensitive).

## Privacy (Phase 6 audit, revised in Phase 8)

What the site actually does, which `/[locale]/privacy` states (and must keep stating):
the contact form's fields (required: name, email, project description; optional: phone,
project type, business or project name, link, timeline), stored in a private Supabase
database without the IP address or other device data, with a copy emailed through Resend
(no retention period is stated and nothing is deleted automatically; a person can ask for
deletion through the contact page); hosting on Vercel with its
ordinary request logs; one first-party cookie, `NEXT_LOCALE`, set only by the language
switch (one year); the Enable menu's script from `cdn.enable.co.il` (and whatever it
stores in the browser); no analytics (adding Vercel Web Analytics later means updating the page
first); fonts, images and video self-hosted; no embeds; external links open without a
referrer.

## Accessibility (Phase 6)

`/[locale]/accessibility` describes the tested work (docs/DESIGN-SYSTEM.md, "Accessibility
baseline", and the e2e suite), the known limitations and how to report a problem, with
WCAG 2.2 AA stated as the target only: no conformance or certification claim.

**The Enable menu** (`src/components/a11y/EnableWidget.tsx`): Martin's licensed script,
unchanged, loaded once per document from the root layout through `next/script`
`lazyOnload` (after the page has loaded, so it never blocks rendering or hydration; the
server HTML is identical with or without it). The CSP allows `https://cdn.enable.co.il` for
scripts and the vendor's hosts for styles, images, fonts and requests. It is an addition,
never the reason the site is accessible: the e2e suite runs with the vendor's host
unreachable and passes on the site's own accessibility. Its own behavior (launcher
position, keyboard use, zoom, reduced motion, what it stores) is the vendor's and must be
checked in a real browser on a preview deployment; see the Phase 6 review notes.

The one override of its UI lives in `src/styles/vendor.css` (layer `vendor`, last in the
order): `#enable-toolbar-trigger > .keyboard-shorcut { display: none !important }` hides
the launcher's visible, already aria-hidden "ESC" badge, as confirmed in the live DOM. The
launcher, its focus, Enter and Escape are untouched; no other Enable styling or
configuration is changed.

## Performance notes

- **The ON preview film** (`public/media/on/film-preview.mp4`, about 2.3 MB) belongs to
  the ON case study, not to the MARTIN.G brand film (the site's intro, see Brand intro). It is an
  on-demand asset: the `<video>` exists only once the player has hydrated, has
  `preload="none"`, never autoplays, and the file is requested only when a visitor presses
  play (tested in `tests/e2e/showcase.spec.ts`). The homepage never requests it. It is not
  an initial-load cost.
- **Launch audit (Phase 7A.4).** Lighthouse 12 on a production-mode build (local
  `next start`, warm image cache), HE and EN home, HE Contact, both case studies:
  - Desktop: 100 / 100 / 100 / 100 (performance, accessibility, best practices, SEO) on
    every page; LCP 0.6 to 0.8s, CLS 0.
  - Mobile, Lighthouse's default simulated throttling: performance 91 to 99, the rest 100;
    LCP 2.1 to 3.4s. The simulation charges later script work to LCP ("render delay"). With
    the same throttling applied for real (Lighthouse `--throttling-method=devtools`, or a
    PerformanceObserver under 4x CPU and slow 4G) LCP is 1.8 to 2.3s and equals first
    contentful paint: the first-view content paints at once and nothing waits for
    hydration. The motion system never hides a page's heading or LCP element.
  - About 187 KB of gzipped JavaScript per page (the framework and React, about 156 KB,
    and the site's small client components); total blocking time 0 to 250ms. The homepage
    HTML is 40 KB gzipped (267 KB raw, more than half of it the inline RSC payload Next
    streams with every page). A page carries only its own locale's copy.
  - Fonts: both families are preloaded on every page (Archivo 61 KB, Noto Sans Hebrew
    12 KB; English pages show Hebrew too, in the המחלבה name), `font-display: swap`, CLS 0.
  - Images: WebP through the optimizer; a cold encode takes up to 0.2s per variant (once
    per variant per deployment). `sizes` follow measured rendered widths; Lighthouse's
    remaining "properly size images" notes are crops of larger assets (the lens shows a
    region of the full image) and reuse of a larger copy already in the browser's cache.
  - Not changed, deliberately: the approved scene transitions and line draws animate
    `clip-path`, `background-size` and `stroke-dashoffset` (Lighthouse lists them as
    non-composited); the ambient loops run only while their scene is visible; the
    PreviewVideo chunk (about 6 KB gzipped) also loads on the homepage because
    `MediaFrame` imports it. Best practices drops to 96 in a sandbox where the Enable
    script cannot load (a console error); its real cost must be measured on a deployment.

## Analytics

Vercel Web Analytics, planned; not part of Foundation.

## Project numbering

Projects are numbered continuously across sections from `getProjectSequence()`: routed
work first, then confidential work (01 ON, 02 המחלבה with id `mi-ma-mo`, 03 and 04
confidential). The
"Internal Systems" section has no chapter number of its own, and its items stay
non-clickable and route-less.

## Navigation

Header: Work, About, Contact, Film (a button that plays the brand film again, where it can
play; see Brand intro) and the language switch. Footer: Work, About, Contact, plus Privacy and
Accessibility, in a labelled navigation. About is the homepage's About scene (`#about`),
reached from any page; there is no About page. No placeholder or dead links (tested).

## Search and social metadata (Phase 7A.1)

- **Origin (Phase 7A.2).** The canonical production origin is `https://martin-g.dev` (the
  apex; `www` redirects to it). `siteUrl()` (`src/lib/site.ts`) is the one source of
  absolute URLs (canonical, alternates, Open Graph URLs and images, sitemap, robots.txt,
  structured data) and reads it from the environment; no domain is written in the code.
  Vercel production: `SITE_URL` is required (`SITE_URL=https://martin-g.dev`, set for the
  Production environment only) and must be an https origin that is not localhost, or the
  build fails before any page renders. Vercel preview: the deployment's own branch URL
  (else its unique URL); `SITE_URL` is ignored, so a preview never claims the production
  domain. Local and CI: `SITE_URL` if set, else `http://localhost:3000`.
- **Per page.** Every indexable page builds its metadata with `pageMetadata()`: title (the
  layout's template adds ` · MARTIN.G`; the homepage's is `site.title` in the dictionaries,
  "MARTIN.G · Product Builder" and "MARTIN.G · בניית מוצרים דיגיטליים", metadata only,
  never shown on the page),
  description, a self-referencing canonical URL, `en`, `he` and `x-default` (Hebrew)
  alternates, and a complete Open Graph block (URL equal to the canonical, `og:locale` and
  `og:locale:alternate`, site name, `website` or `article`, an image when there is one).
  Next derives the Twitter card from it: `summary_large_image` with an image, `summary`
  without. The layout carries only site-wide defaults (metadataBase, title template,
  description, Open Graph site name and locale), never a canonical URL, so a page without
  its own metadata (the noindex specimen) claims no other page's address.
- **Social images.** Case studies use an approved project asset (ON: the live site's
  opening screen; המחלבה: the dashboard) with its localized alt. The homepage uses the
  locale's site card (Phase 7A.3, below), and so do Contact, Privacy and Accessibility,
  which have no artwork of their own: `siteSocialImage()` (`src/lib/social.ts`), passed as
  `image` to `pageMetadata()`.
- **Site cards (Phase 7A.3).** `src/assets/social/martin-g-he.png` and `martin-g-en.png`,
  1200 by 630, rendered by `pnpm brand:og` (`scripts/og-cards.mjs`, Chromium through
  Playwright, as `pnpm brand:icons`) from the approved lockup, copied verbatim, the site's
  own fonts and the approved principle (`site.principle`: "מבעיה למוצר." / "From problem
  to product."), with `martin-g.dev` as a footer label. No project, confidential or
  external material. Imported, so each is served from a content-hashed URL (a new render
  gets a new URL, which platforms that cache previews by URL pick up), with its exact size
  and the alt text "MARTIN.G: " plus the principle, the hero heading's own pattern. The
  render is deterministic for a given Chromium build; a unit test keeps the card's words
  equal to the dictionaries' and the files at 1200 by 630 without metadata. See
  docs/DESIGN-SYSTEM.md, "Social cards".
- **Artwork approval.** `siteCards.review` holds Martin's visual approval per locale; both
  cards are `'approved'` (Phase 7A.3). A new or changed render is marked `'pending'` until
  Martin approves it: preview and local builds render it for review, and a Vercel production
  build refuses it (`assertReleasableArtwork`, `src/i18n/release-gate.ts`, beside the copy
  gate; no override). The production simulation proves the refusal.
- **Indexing.** Only the Vercel production deployment is indexable (`isIndexable()`).
  Every other build (preview, local, CI) sends `X-Robots-Tag: noindex, nofollow`
  (next.config.ts) and a robots.txt that disallows everything; production's robots.txt
  allows everything and names the sitemap. The sitemap lists only public routes (home, each
  public case study, Contact, Privacy, Accessibility) in both locales with their
  alternates. The specimen is a 404 in production and noindex elsewhere; 404 pages are
  noindex; confidential work has no routes.
- **Structured data.** The homepage carries one JSON-LD block (`src/lib/structured-data.ts`):
  `WebSite` (so search engines can show "MARTIN.G" as the site name) and `Person`, built
  only from approved copy already on the page. No ratings, clients, awards or claims. It is
  a data block, not a script, so the CSP is unchanged.
- **Tests.** `tests/unit/seo.test.ts` (origin validation, indexing, robots, sitemap,
  metadata shape, structured data) and `tests/e2e/seo.spec.ts` (every sitemap page as
  built: status, lang, title, description, canonical, alternates, Open Graph, card type).

## Security headers (Phase 7A.2)

Set for every path in `next.config.ts` (`securityHeaders(production)`), where `production`
is the Vercel production deployment. Tested in `tests/unit/seo.test.ts` and
`tests/e2e/seo.spec.ts`.

| Header                       | Value                                                                   | Notes                                                          |
| ---------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Content-Security-Policy`    | see below                                                               | static, no nonces                                              |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains`                                   | production only                                                |
| `X-Content-Type-Options`     | `nosniff`                                                               |                                                                |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                                       | external links also open with `noreferrer`                     |
| `X-Frame-Options`            | `DENY`                                                                  | legacy twin of `frame-ancestors 'none'`, kept for old browsers |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                           | no page relies on a cross-origin opener                        |
| `Permissions-Policy`         | camera, microphone, geolocation, payment, usb, browsing-topics all `()` | the retired `interest-cohort` token was removed                |
| `X-Robots-Tag`               | `noindex, nofollow`                                                     | every build except production                                  |

- **The private admin** (`/admin`, every deployment, `adminHeaders` and the admin proxy):
  `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store, max-age=0` and
  `Referrer-Policy: no-referrer`, over the baseline above (see Admin CRM).
- **HSTS.** Two years with `includeSubDomains`, production only (an http localhost ignores
  it, and previews live on Vercel's own domain). The `.dev` top-level domain is on the
  browsers' HSTS preload list, so every `martin-g.dev` host is https only already; there is
  nothing to gain from a `preload` directive or a submission.
- **CSP.** `default-src 'self'`; `script-src 'self' 'unsafe-inline' https://cdn.enable.co.il`;
  `style-src`, `img-src`, `font-src` and `connect-src` add the Enable hosts
  (`https://enable.co.il https://*.enable.co.il`); `media-src 'self'`;
  `frame-ancestors 'none'`; `form-action 'self'`; `base-uri 'self'`; `object-src 'none'`;
  and `upgrade-insecure-requests` in production only (it would break http://localhost).
  No `'unsafe-eval'`. The JSON-LD block is a data block, which the CSP does not govern.
- **Why `'unsafe-inline'` stays in `script-src`.** The App Router streams each page's data
  to the browser as inline `<script>` elements (and the motion head script must run before
  the first paint). Nonces are per request, so every page would have to render per request
  instead of being statically generated. Hashes would have to cover every inline script of
  every page, which change with each build and page, so they would need per-route headers
  generated after the build. Both are larger changes than this slice and are deferred
  (Launch hardening backlog).
- **Why `'unsafe-inline'` stays in `style-src`.** React style attributes (grid placements,
  aspect ratios, CSS variables) and the styles the Enable menu injects.
- **Not added.** `Cross-Origin-Embedder-Policy` (it would block the Enable menu's
  cross-origin assets), `Cross-Origin-Resource-Policy` (little gain for a public site
  whose images are shared by social previews), and `X-XSS-Protection` (retired by
  browsers).

## Production configuration (Vercel)

The repository cannot set these; they are made in the Vercel project. Martin configured
them for the launch (Phase 7); the post-merge checklist verifies each one on the live site.

- **Domains.** `martin-g.dev` is the production domain. `www.martin-g.dev` is added too and
  set to redirect to `martin-g.dev` (permanent, 308). DNS records as Vercel's Domains page
  shows them.
- **Environment variables (Production only).**
  - `SITE_URL=https://martin-g.dev` (required; not secret). Never set it for Preview.
  - `RESEND_API_KEY` (Sensitive), `CONTACT_EMAIL_TO` (the inbox inquiries go to),
    `CONTACT_EMAIL_FROM` (a sender on a domain verified in Resend, for example
    `MARTIN.G <contact@martin-g.dev>` once `martin-g.dev` is verified there with the SPF and
    DKIM records Resend lists). All three are required.
  - `SUPABASE_URL` (the `martin-g` project's API URL, `https://<project-ref>.supabase.co`)
    and `SUPABASE_SECRET_KEY` (Sensitive; a secret API key, `sb_secret_...`, created for
    this site in the project's API Keys settings). Both are required (Phase 8).
    Never a `NEXT_PUBLIC_` variable, never the publishable key. A Supabase integration that
    adds its own variables (for example `NEXT_PUBLIC_SUPABASE_*`) must not be connected:
    `lint-policy` forbids `NEXT_PUBLIC_` in the code, but Vercel would still expose such a
    variable to builds.
  - `SUPABASE_PUBLISHABLE_KEY` (the project's publishable key, `sb_publishable_...`; used
    for Supabase Auth only) and `ADMIN_USER_ID` (the UUID of Martin's Supabase Auth user).
    Both are required once the admin ships (Phase 8B). Production only: Preview gets none
    of the Supabase variables.
  - `VERCEL_DEPLOY_HOOK_URL` (Sensitive, optional; Phase 8C): the production branch's Deploy
    Hook, which the project editor's "Publish to the site" calls. Production only.
  - `LEAK_CHECK_TERMS_B64` (Sensitive, Production and Preview; see README.md).
- **Firewall rate limit** (Firewall, Configure, a custom rule). Phase 7 limited every
  `POST` (5 requests per 60 seconds, keyed by IP, answered 429), which was right while
  Contact was the site's only `POST`.
  - **Since Phase 8B (configured before the merge):** the admin's Server Actions are
    `POST`s too (sign in, status, notes, sign out), and five per minute would lock Martin
    out of his own CRM, so the rule is scoped to Contact submissions only:
    - Name: `Contact form rate limit`
    - If: `Request Method` equals `POST`, and `Request Path` is any of `/he/contact`,
      `/en/contact` (or matches the expression `^/(he|en)/contact$`)
    - Then: Rate limit, fixed window, 60 seconds, 5 requests, keyed by IP; when exceeded:
      Too Many Requests (429)
  - Known gap of a path-scoped rule: Next accepts a Server Action's `POST` on any page
    path, so the Contact action could be posted to another public page outside the rule.
    The application's own spam protection (trap field, fill time, dedupe) stays in place
    either way. To close the gap, the expression can instead cover every `POST` whose path
    does not start with `/admin` (`not (Request Path starts with /admin)`).
  - **Vercel Free allows one rate-limit rule**, and it is the Contact rule, so there is no
    firewall rule for `/admin/login`. Sign-in is protected instead by Supabase Auth's own
    sign-in rate limits, one account with a long, unique password, sign-up turned off, and
    answers that never tell whether an account exists. Note that sign-ins reach Supabase
    from Vercel's servers, so Supabase's per-IP limits count Vercel's addresses: under a
    flood they would slow every sign-in, the admin's included, rather than lock the
    account. A `/admin/login` rule (for example 10 `POST`s per 60 seconds keyed by IP) is
    the first addition if the plan ever allows a second rule.
  - Publish, then check the rule's log while sending one real inquiry from each locale and
    using the admin.
- **Deployment protection.** Keep Vercel Authentication on for Preview deployments.

## Production simulation (CI)

The Phase 6 merge passed every check and still failed on Vercel Production: its delivery
guard (`assertContactDelivery`) only refuses a build when `VERCEL_ENV=production`, which no
CI job set. The guard was right; CI now reaches it first. The `production-simulation` job
runs `scripts/production-simulation.mjs` (also `pnpm build:production-simulation`):

1. `pnpm build` as Vercel Production without the three Resend variables: must fail with
   the contact gate's message naming them.
2. `pnpm build` without `SUPABASE_URL` and `SUPABASE_SECRET_KEY`: must fail with the lead
   storage gate's message naming them.
3. `pnpm build` without `SUPABASE_PUBLISHABLE_KEY` and `ADMIN_USER_ID`: must fail with the
   admin gate's message naming them.
4. `pnpm build` without `SITE_URL`: must fail with the origin's message.
5. `pnpm build` with the Hebrew site card treated as pending
   (`RELEASE_GATE_SIMULATE_PENDING_SITE_CARDS=he`, a test-only switch that can only add
   pending cards): must fail with the artwork gate's message naming it.
6. `pnpm build` whose read of the project editor's saved copy is refused: must fail
   closed with the content layer's message (the expected refusal is recorded in its own
   guard log). The read comes after the copy gate, so this case alone sets the logged
   draft-copy override, to reach it whatever the copy's state.
7. `pnpm build` with the complete dummy configuration: must succeed (the real leak check
   and the built-HTML policy included, which refuses a prerendered admin page); the
   browser output (`.next/static` and the prerendered pages and payloads) must not contain
   the dummy Resend key, Supabase URL, host, secret or publishable key, or admin id; then
   `next start` with the same environment and
   GET-only checks: the redirect to `/he`, canonical and Open Graph URLs, structured data,
   each locale's site card and the case-study image, robots.txt and every sitemap URL on the simulated origin, HSTS,
   `upgrade-insecure-requests` and no `X-Robots-Tag`, no robots meta, and the specimen as
   a 404, and no page carrying a server-only value; the admin: `/admin` and a lead's
   address redirect to `/admin/login` (307), every admin response `noindex` and private,
   the login page configured and `noindex`, and the sitemap without it. With no session,
   the admin makes no request to Supabase at all (the guard would record one). Each
   locale's home page and ON case study show that locale's synthetic saved title, never
   the other's (`SIMULATED_TRANSLATIONS`).

Copy awaiting review: the configuration gates run before the copy gate, so cases 1 to 5 are
decided whatever the copy's state. If case 7 is refused only for draft copy, it is built
again with the explicit, logged `ALLOW_DRAFT_COPY_IN_PRODUCTION=1` so every other check
still runs, and the run then fails anyway, naming the copy: Vercel Production would refuse
the build until Martin approves it.

Its values are CI-only dummies (`SITE_URL=https://production-simulation.example`, a fake
Resend key, `.example` addresses, `SUPABASE_URL=https://leads.production-simulation.example`
a fake `sb_secret_` and `sb_publishable_` key, and a synthetic `ADMIN_USER_ID`). Inherited
`SITE_URL`, Resend, Supabase (any variable naming it, and `POSTGRES_*`), `ADMIN_USER_ID`,
Telegram, outbox, lead file, fill-time, draft-copy override and
simulated pending artwork variables are removed first, so neither real credentials nor test
shortcuts can reach it. Nothing can be delivered or stored: a build never runs the server
action (only a visitor's submission does), the server is only sent GETs, and
`scripts/delivery-guard.mjs`, preloaded into every Node process, refuses and records any
request to the Resend or Telegram APIs, to any Supabase host (`*.supabase.co`, `.com`,
`.in`) and to the host `SUPABASE_URL` names; the run fails if the guard did not load or if
a request was attempted. One read is answered instead of refused: the build's
`GET /rest/v1/project_translations` on `SUPABASE_URL`'s host, which the guard answers
itself with synthetic rows (`MG_SIMULATED_TRANSLATIONS`), without any network; any other
method, path or host is refused as before, and the run fails if that read never happened
or if the copy reached Next's data cache (`.next/cache/fetch-cache`). A unit test runs the real Supabase client under the guard to prove
it is stopped. Unit tests (`tests/unit/production-simulation.test.ts`) cover the
environment, the gates' messages for each case, and the guard.

**Environment-dependent guards**, and what exercises them:

| Guard                                                            | Production-only behavior                                          | Exercised by                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `assertReleasableCopy` (`src/i18n/release-gate.ts`)              | refuses draft copy; `ALLOW_DRAFT_COPY_IN_PRODUCTION=1` overrides  | simulation (override removed), unit                             |
| `assertReleasableArtwork` (`src/i18n/release-gate.ts`)           | refuses a site card marked `'pending'`; no override               | simulation case 5, unit                                         |
| `assertContactDelivery` (`src/lib/contact/notifiers.ts`)         | requires the three Resend variables                               | simulation cases 1, 5 and 6, unit                               |
| `assertLeadStorage` (`src/lib/leads/config.ts`)                  | requires `SUPABASE_URL` and an `sb_secret_` `SUPABASE_SECRET_KEY` | simulation cases 2, 5 and 6, unit                               |
| `assertAdminConfiguration` (`src/lib/admin/config.ts`)           | requires `SUPABASE_PUBLISHABLE_KEY` and a UUID `ADMIN_USER_ID`    | simulation cases 3, 5 and 6, unit                               |
| `loadSiteTranslations` (`src/lib/projects/translations.ts`)      | fails the build when the saved project copy cannot be read        | simulation case 6 (and 7, served), unit                         |
| `siteUrl` (`src/lib/site.ts`)                                    | requires an https `SITE_URL`; previews use their own URL          | simulation cases 4 and 5; the preview branch by unit tests only |
| `adminAuthConfig` (`VERCEL`)                                     | the admin's session cookies are `Secure`                          | unit                                                            |
| `isIndexable`, `robots.ts`, `securityHeaders` (`next.config.ts`) | crawlable, sitemap, HSTS, `upgrade-insecure-requests`, no noindex | simulation (served), unit                                       |
| `isSpecimenEnabled` (`src/lib/specimen.ts`)                      | the specimen is a 404                                             | simulation (served); e2e covers the other side                  |
| `configuredNotifiers` (`VERCEL`)                                 | the e2e outbox is refused on Vercel                               | unit (a runtime path: the simulation never submits)             |
| `configuredLeadRepository` (`VERCEL`)                            | the local lead file is refused on Vercel                          | unit (a runtime path: the simulation never submits)             |
| `minFillMs` (`CONTACT_MIN_FILL_MS`)                              | none: a runtime override the e2e suite uses                       | unit; must never be set on Vercel                               |
| leak check `isCi` (`CI`, `VERCEL`, `GITHUB_ACTIONS`)             | fails closed without the blocklist                                | every CI job and the simulation                                 |
| `lint-policy` hooks check, `setup-hooks` (`CI`, `VERCEL`)        | skipped where Git hooks do not apply                              | every CI job                                                    |

No application code reads `NODE_ENV`.

## Launch hardening backlog

- **CSP review.** Foundation uses a static CSP with `'unsafe-inline'` for scripts and
  styles so every page stays statically generated (nonces would force dynamic rendering).
  Revisit once Vercel Web Analytics is in place: tighten `script-src` (hashes, SRI, or
  nonces only if the static trade-off is acceptable), and narrow the Enable origins
  (Phase 6) to exactly what the menu requests, as observed on a deployment. Contact needs
  no browser origin: delivery and lead storage are server to server, so `connect-src`
  never lists Supabase.
- **Script hashes or nonces.** Removing `'unsafe-inline'` from `script-src` (see Security
  headers): either per-route hashes generated after the build, or nonces with per-request
  rendering, measured against the static trade-off.
- **CSP reporting.** A `report-to` endpoint once there is somewhere to send reports.
- **Case-study cards (optional).** Dedicated 1200 by 630 cards for ON and המחלבה (today's
  case-study images are 1.61:1 and 1.84:1, which platforms crop).

## Phases

- Phase 0: Decisions (done)
- Phase 1: Foundation (done)
- Phase 2: Design system (done)
- Phase 3: Content engine (done)
- Phase 4: Hero, home choreography and real projects (done)
- Phase 5: Case studies (5A ON and 5B המחלבה: merged, copy approved)
- Phase 6: Trust, accessibility and conversion (contact, privacy, accessibility, Enable;
  copy approved)
- Phase 7: Launch hardening (7A.1 search and social metadata; 7A.2 production domain,
  security headers and the CI production simulation; 7A.3 approved social cards and the
  artwork release gate; 7A.4 performance audit and launch QA; 7A.5 release candidate)
- Phase 8: Leads (8A: Supabase as the durable record of Contact inquiries, Resend as the
  notification; `service_role` hardened to select, insert, update and delete; privacy
  wording approved. 8B: the private admin CRM, Supabase Auth with one authorized user,
  lead notes; the migration applied and the firewall scoped to Contact. 8C: one card per
  confidential project, `confidential-01` with its approved anonymized image; the admin's
  HE | EN project editor)
