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
  components/              brand, layout (grid, header, footer), nav, type, theme, media, project, hero
  lib/                     site URL and metadata helpers, CSS var typing
  styles/                  layers, tokens, fonts, reset, base, motion
scripts/                   leak-check, lint-policy, setup-hooks
tests/unit                 Vitest (content, i18n, tokens, grid, policy, leak check)
tests/e2e                  Playwright (routing, direction, axe, confidential, brand, headers)
.githooks/                 pre-commit, commit-msg, pre-push
```

## Locales

- Both locales are prefixed: `/en/...`, `/he/...`. Slugs are shared ASCII.
- `/` and unprefixed paths redirect (307) by `NEXT_LOCALE` cookie, then `Accept-Language`
  (`he`/`iw` → `he`), then `en`.
- `dynamicParams = false` everywhere: unknown locales and slugs are 404s.
- Dictionaries: `en.ts` is the shape; `he.ts` is typed against it.
- Bidi: numerals, brand and project names, and Latin terms inside Hebrew are isolated with
  `<Ltr>` (`<bdi dir="ltr">`). Brand marks are always `dir="ltr"`.
- Hebrew has no case: label styles switch from tracked uppercase to weight and size through
  `:lang(he)` tokens.

## Typography

Latin and Hebrew are separate families, each registered with a script-specific
`unicode-range` (`src/styles/fonts.css`). Mixed runs resolve per character; each locale
decides which family leads for shared glyphs. **Provisional:** the faces point at local
system fonts. The design-system phase replaces them with free, self-hosted files via
`next/font/local`, keeping the family names and role variables.

## Grid and breakpoints

| Tier    | Range    | Columns | Gutter | Margin                   |
| ------- | -------- | ------- | ------ | ------------------------ |
| Mobile  | < 768px  | 4       | 12px   | 20px                     |
| Tablet  | ≥ 768px  | 8       | 20px   | 40px                     |
| Desktop | ≥ 1200px | 12      | 24px   | fluid 48–80              |
| Wide    | ≥ 1600px | 12      | 32px   | content capped at 1600px |

`<Grid>` and `<Cell span={{ base, md, lg }} start={{ ... }}>` compile to CSS custom
properties. Spans inherit upward. Grid lines follow the inline direction, so layouts mirror
in RTL without extra code. Physical `left`/`right` CSS is rejected by `lint-policy`.

## Themes

Semantic color tokens (`--surface-0`, `--surface-1`, `--text`, `--text-muted`, `--line`,
`--accent`) are the only colors components read. `ThemeScope` (server) writes a project's
palette as inline variables. `ProjectTheme` has no spacing, radius, type or motion keys, so
projects change palette, never system. Scroll-driven theme transitions (`ThemeConductor`)
arrive with the hero phase.

## Brand marks

`Wordmark` (primary) and `Monogram` (secondary) read `components/brand/brand.ts`.

- **Wordmark** on larger layouts, at sizes that pass real-size testing (hero, social,
  and the tablet/desktop header once verified).
- **Monogram** for compact mobile branding, favicon and small details.

**Provisional:** alpha masks derived from the reference PNGs, tinted with `currentColor`.
Known issue: at header size (about 17px tall) the wordmark's hairlines disappear. This is
not to be compensated by changing proportions or thickening the traced mask. Phase 2
replaces the masks with production SVGs (outlined, `currentColor`, tight viewBox, one group
per glyph) and sets each mark's minimum size from real-size tests.

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
"Selected Confidential Work" section has no chapter number of its own, and its items stay
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
- Phase 1: Foundation (this)
- Phase 2: Design system
- Phase 3: Content engine
- Phase 4: Hero and home choreography
- Phase 5: ON case study
- Phase 6: Contact
- Phase 7: Launch hardening
