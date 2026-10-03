# Architecture

Approved decisions and the structure that implements them. Update this file when a
decision changes.

## Principles

- Statically generated. Server Components by default; client components only for
  interaction or motion (today: `LocaleSwitch`; the locale not-found boundary;
  `ContactExperience`, the inquiry form's in-place validation, sending and outcome over its
  server action; `PreviewVideo`, the preview player's own play and pause control; and
  `MotionController` and `HeaderWorld`, observers that render nothing).
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
    global-not-found.tsx   every 404, server-rendered: in the URL's locale, else bilingual
    sitemap.ts robots.ts manifest.ts icon.svg icon.png apple-icon.png favicon.ico
  i18n/                    config, negotiation, dictionaries, release gate
  content/                 schema, registry (server-only), resolve (view models), projects/
  components/              brand, layout (grid, rule, header, footer), nav, type, theme, media,
                           motion, project, home, scene, case-study (shared primitives and
                           one composition per case study, e.g. case-study/on), contact,
                           trust (Privacy and Accessibility), a11y (the Enable menu)
  fonts/                   self-hosted OFL fonts and licenses
  lib/                     site URL, indexing and metadata helpers, social cards, structured
                           data, CSS var typing, navigation, contact (validation, spam,
                           dedupe, notifiers, server action)
  styles/                  layers, tokens, fonts, reset, base, typography, layout, motion
scripts/                   leak-check, lint-policy, setup-hooks, brand-icons (`pnpm brand:icons`),
                           og-cards (`pnpm brand:og`, the social cards),
                           production-simulation and its delivery-guard (see Production
                           simulation)
tests/unit                 Vitest (content, i18n, tokens, grid, policy, leak check, metadata,
                           headers, production simulation)
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
from each project module. Alt text, captions and player labels written in Phase 4 live in
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
confidentiality, brand-mark and copy rules. Renders are never committed. See film/README.md.

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
- **Duplicates.** The form allows one submission at a time (`aria-disabled` while sending);
  the server delivers one submission id (or, without JavaScript, one sender and description)
  once per ten minutes, in memory per instance (`dedupe.ts`).
- **Delivery** (`notifiers.ts`): a `ContactNotifier` interface. Resend (email) is the
  primary channel; Telegram (a phone ping) is optional; an outbox file serves the e2e tests
  and is refused on Vercel. Plain text only, the visitor's email as reply-to, credentials
  in server-side environment variables (`.env.example`), never logged. Logs name only the
  notifier and status of a failure, never the inquiry. **No database**: an inquiry exists
  only in the delivered message.
- **Release.** A Vercel production build fails unless Resend is configured, all three of
  `RESEND_API_KEY`, `CONTACT_EMAIL_TO` and `CONTACT_EMAIL_FROM` (`assertContactDelivery`,
  beside the copy release gate; the error names only the missing variables), so the only
  conversion path can never ship as a dead end. Telegram alone does not satisfy it: the
  privacy page names Resend. Preview builds answer "unavailable" until configured.
- **Configured outside the repository** (Phase 7, by Martin): the variables and the
  rate-limit rule in Production configuration (Vercel), below; verified after the merge.
  Turning Telegram on means updating the privacy copy first.

## Privacy (Phase 6 audit)

What the site actually does, which `/[locale]/privacy` states (and must keep stating):
the contact form's fields (required: name, email, project description; optional: phone,
project type, business or project name, link, timeline), delivered by email through Resend; hosting on Vercel with its
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
  the ON case study, not to the MARTIN.G brand film (which is not on the site). It is an
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
"Defense Systems" section has no chapter number of its own, and its items stay
non-clickable and route-less.

## Navigation

Header: Work, About, Contact and the language switch. Footer: the same, plus Privacy and
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
  - `LEAK_CHECK_TERMS_B64` (Sensitive, Production and Preview; see README.md).
- **Firewall rate limit** (Firewall, Configure, add a custom rule):
  - Name: `Contact form rate limit`
  - If: `Request Method` equals `POST`, and `Request Path` is any of `/he/contact`,
    `/en/contact` (or matches the expression `^/(he|en)/contact$`)
  - Then: Rate limit, fixed window, 60 seconds, 5 requests, keyed by IP; when exceeded:
    Too Many Requests (429)
  - Recommended: drop the path condition and apply the same limit to every `POST`. The
    inquiry is the site's only `POST`, and Next also accepts a server action's `POST` on
    other page paths, so a path-only rule can be stepped around.
  - Publish, then check the rule's log while sending one real inquiry from each locale.
- **Deployment protection.** Keep Vercel Authentication on for Preview deployments.

## Production simulation (CI)

The Phase 6 merge passed every check and still failed on Vercel Production: its delivery
guard (`assertContactDelivery`) only refuses a build when `VERCEL_ENV=production`, which no
CI job set. The guard was right; CI now reaches it first. The `production-simulation` job
runs `scripts/production-simulation.mjs` (also `pnpm build:production-simulation`):

1. `pnpm build` as Vercel Production without the three Resend variables: must fail with
   the contact gate's message naming them.
2. `pnpm build` without `SITE_URL`: must fail with the origin's message.
3. `pnpm build` with the Hebrew site card treated as pending
   (`RELEASE_GATE_SIMULATE_PENDING_SITE_CARDS=he`, a test-only switch that can only add
   pending cards): must fail with the artwork gate's message naming it.
4. `pnpm build` with the complete dummy configuration: must succeed (the real leak check
   and the built-HTML policy included), then `next start` with the same environment and
   GET-only checks: the redirect to `/he`, canonical and Open Graph URLs, structured data,
   each locale's site card and the case-study image, robots.txt and every sitemap URL on the simulated origin, HSTS,
   `upgrade-insecure-requests` and no `X-Robots-Tag`, no robots meta, and the specimen as
   a 404.

Its values are CI-only dummies (`SITE_URL=https://production-simulation.example`, a fake
Resend key, `.example` addresses). Inherited `SITE_URL`, Resend, Telegram, outbox,
fill-time, draft-copy override and simulated pending artwork variables are removed first, so neither real
credentials nor test shortcuts can reach it. Nothing can be delivered: a build never runs
the server action (only a visitor's submission does), the server is only sent GETs, and
`scripts/delivery-guard.mjs`, preloaded into every Node process, refuses and records any
request to the Resend or Telegram APIs; the run fails if the guard did not load or if a
request was attempted. Unit tests (`tests/unit/production-simulation.test.ts`) cover the
environment, the gates' messages for each case, and the guard.

**Environment-dependent guards**, and what exercises them:

| Guard                                                            | Production-only behavior                                          | Exercised by                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `assertReleasableCopy` (`src/i18n/release-gate.ts`)              | refuses draft copy; `ALLOW_DRAFT_COPY_IN_PRODUCTION=1` overrides  | simulation (override removed), unit                             |
| `assertReleasableArtwork` (`src/i18n/release-gate.ts`)           | refuses a site card marked `'pending'`; no override               | simulation case 3, unit                                         |
| `assertContactDelivery` (`src/lib/contact/notifiers.ts`)         | requires the three Resend variables                               | simulation cases 1 and 3, unit                                  |
| `siteUrl` (`src/lib/site.ts`)                                    | requires an https `SITE_URL`; previews use their own URL          | simulation cases 2 and 3; the preview branch by unit tests only |
| `isIndexable`, `robots.ts`, `securityHeaders` (`next.config.ts`) | crawlable, sitemap, HSTS, `upgrade-insecure-requests`, no noindex | simulation (served), unit                                       |
| `isSpecimenEnabled` (`src/lib/specimen.ts`)                      | the specimen is a 404                                             | simulation (served); e2e covers the other side                  |
| `configuredNotifiers` (`VERCEL`)                                 | the e2e outbox is refused on Vercel                               | unit (a runtime path: the simulation never submits)             |
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
  no browser origin: delivery is server to server.
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
