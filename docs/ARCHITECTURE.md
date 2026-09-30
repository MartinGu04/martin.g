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
    [locale]/              root layout: <html lang dir>; home; work/[slug]; not-found
    global-not-found.tsx   URLs outside any locale
    sitemap.ts robots.ts icon.png apple-icon.png favicon.ico
  i18n/                    config, negotiation, dictionaries, release gate
  content/                 schema, registry (server-only), resolve (view models), projects/
  components/              brand, layout (grid, rule, header, footer), nav, type, theme, media,
                           motion, project, hero
  fonts/                   self-hosted OFL fonts and licenses
  lib/                     site URL and metadata helpers, CSS var typing
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
changing case-study components.

## Contact (Phase 6, not built)

Server Action with progressive enhancement, hand-written validation, honeypot and timing
checks, and a `ContactNotifier` interface with Resend (email) and Telegram Bot (phone)
implementations. No database. Rate limiting via a Vercel WAF rule.

## Analytics

Vercel Web Analytics, planned; not part of Foundation.

## Project numbering

Projects are numbered continuously across sections from `getProjectSequence()`: routed
work first, then confidential work (01 ON, 02 mi-ma-mo, 03 and 04 confidential). The
"Restricted Work" section has no chapter number of its own, and its items stay
non-clickable and route-less.

## Navigation

Work and the language switch only. Contact is added to the navigation only when a real
destination exists (Phase 6); no placeholder or dead links.

## Launch hardening backlog

- **CSP review.** Foundation uses a static CSP with `'unsafe-inline'` for scripts and
  styles so every page stays statically generated (nonces would force dynamic rendering).
  Revisit once Vercel Web Analytics and the real Contact integration are in place: tighten
  `script-src` (hashes, SRI, or nonces only if the static trade-off is acceptable), and add
  exactly the origins those integrations need to `connect-src` / `script-src`.

## Phases

- Phase 0: Decisions (done)
- Phase 1: Foundation (done)
- Phase 2: Design system (this)
- Phase 3: Content engine
- Phase 4: Hero and home choreography
- Phase 5: ON case study
- Phase 6: Contact
- Phase 7: Launch hardening
