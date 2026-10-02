# Architecture

Approved decisions and the structure that implements them. Update this file when a
decision changes.

## Principles

- Statically generated. Server Components by default; client components only for
  interaction or motion (today: `LocaleSwitch`, the locale not-found boundary).
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
    global-not-found.tsx   URLs outside any locale
    sitemap.ts robots.ts icon.png apple-icon.png favicon.ico
  i18n/                    config, negotiation, dictionaries, release gate
  content/                 schema, registry (server-only), resolve (view models), projects/
  components/              brand, layout (grid, rule, header, footer), nav, type, theme, media,
                           motion, project, home, scene, case-study (shared primitives and
                           one composition per case study, e.g. case-study/on), contact,
                           trust (Privacy and Accessibility), a11y (the Enable menu)
  fonts/                   self-hosted OFL fonts and licenses
  lib/                     site URL and metadata helpers, CSS var typing, navigation,
                           contact (validation, spam, dedupe, notifiers, server action)
  styles/                  layers, tokens, fonts, reset, base, typography, layout, motion
scripts/                   leak-check, lint-policy, setup-hooks
tests/unit                 Vitest (content, i18n, tokens, grid, policy, leak check)
tests/e2e                  Playwright (routing, direction, axe, confidential, brand, headers)
.githooks/                 pre-commit, commit-msg, pre-push
```

## Locales

- Both locales are prefixed: `/en/...`, `/he/...`. Slugs are shared ASCII.
- Hebrew is the default locale. `/` and unprefixed paths redirect (307, `Vary: Cookie`) in
  `src/proxy.ts`, before anything renders: to the `NEXT_LOCALE` cookie's locale if the
  visitor chose one with the language switch, otherwise to `/he`. The browser language is
  not consulted. Prefixed paths pass through, so there is no redirect loop.
- `x-default` hreflang (page metadata and sitemap) points to the Hebrew URL.
- `dynamicParams = false` everywhere: unknown locales and slugs are 404s.
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
- Brand marks are provisional masks with CSS-enforced minimum sizes per pixel density
  (the hairlines are ~2% of mark height, a property of the design). Production SVGs replace
  the masks without API changes; small-size legibility needs a brand-owned optical cut.

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
- **Release.** A Vercel production build fails without a configured notifier
  (`assertContactDelivery`, beside the copy release gate), so the only conversion path can
  never ship as a dead end. Preview builds answer "unavailable" until configured.
- **Still to configure** (not in the repository): `RESEND_API_KEY`, `CONTACT_EMAIL_TO`,
  `CONTACT_EMAIL_FROM` on Vercel (Sensitive), with a sender Resend accepts; and a Vercel
  WAF rate-limit rule on POST `/he/contact` and `/en/contact` (for example 5 per minute per
  IP). Turning Telegram on means updating the privacy copy first.

## Privacy (Phase 6 audit)

What the site actually does, which `/[locale]/privacy` states (and must keep stating):
the contact form's fields (required: name, email, project description; optional: phone,
project type, business or project name, link, timeline), delivered by email through Resend; hosting on Vercel with its
ordinary request logs; one first-party cookie, `NEXT_LOCALE`, set only by the language
switch (one year); the Enable menu's script from `cdn.enable.co.il` (and whatever it
stores in the browser); no analytics (Phase 7 adds Vercel Web Analytics: update the page
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

## Analytics

Vercel Web Analytics, planned; not part of Foundation.

## Project numbering

Projects are numbered continuously across sections from `getProjectSequence()`: routed
work first, then confidential work (01 ON, 02 המחלבה with id `mi-ma-mo`, 03 and 04
confidential). The
"Defense Systems" section has no chapter number of its own, and its items stay
non-clickable and route-less.

## Navigation

Header: Work, Contact and the language switch. Footer: the same, plus Privacy and
Accessibility, in a labelled navigation. No About page (About is a homepage scene), no
placeholder or dead links (tested).

## Launch hardening backlog

- **CSP review.** Foundation uses a static CSP with `'unsafe-inline'` for scripts and
  styles so every page stays statically generated (nonces would force dynamic rendering).
  Revisit once Vercel Web Analytics is in place: tighten `script-src` (hashes, SRI, or
  nonces only if the static trade-off is acceptable), and narrow the Enable origins
  (Phase 6) to exactly what the menu requests, as observed on a deployment. Contact needs
  no browser origin: delivery is server to server.

## Phases

- Phase 0: Decisions (done)
- Phase 1: Foundation (done)
- Phase 2: Design system (done)
- Phase 3: Content engine (done)
- Phase 4: Hero, home choreography and real projects (done)
- Phase 5: Case studies (5A ON and 5B המחלבה: merged, copy approved)
- Phase 6: Trust, accessibility and conversion (contact, privacy, accessibility, Enable;
  copy draft, in review)
- Phase 7: Launch hardening
