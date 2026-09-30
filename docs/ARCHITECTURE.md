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

`Wordmark` (primary: desktop/tablet header, hero, social) and `Monogram` (secondary: compact
mobile header, favicon, small details) read `components/brand/brand.ts`. **Provisional:**
alpha masks derived from the reference PNGs, tinted with `currentColor`. Production assets
should be outlined SVGs with `currentColor`, a tight viewBox and one group per glyph.

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

## Phases

0. Decisions (done) · 1. Foundation (this) · 2. Design system · 3. Content engine ·
1. Hero and home choreography · 5. ON case study · 6. Contact · 7. Launch hardening
