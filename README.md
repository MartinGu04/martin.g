# MARTIN.G

**Digital products, systems & experiences. From problem to product.**

[**Explore MARTIN.G → mgusin.dev**](https://mgusin.dev)

Bilingual (English LTR, Hebrew RTL) portfolio and product brand for Martin Gusin.
Next.js App Router, TypeScript, statically generated, deployed on Vercel.

> This repository is **public**. Every file, path, asset, branch name, commit message,
> issue and pull request title is public. Read [Confidentiality](#confidentiality) first.

## Setup

```sh
pnpm install          # also runs `prepare`, which points Git at .githooks
cp .env.example .env.local
# add LEAK_CHECK_TERMS_B64 to .env.local (see below)
pnpm dev
```

Requirements: Node 22.18+ and pnpm 10 (`packageManager` is pinned).

## Scripts

| Script              | What it does                                                         |
| ------------------- | -------------------------------------------------------------------- |
| `pnpm dev`          | Development server                                                   |
| `pnpm build`        | `next build`, then the build-output leak check and built-HTML policy |
| `pnpm typecheck`    | Route type generation and `tsc --noEmit` (strict)                    |
| `pnpm lint`         | ESLint and the project policy checks (`scripts/lint-policy.mjs`)     |
| `pnpm test`         | Unit tests (Vitest)                                                  |
| `pnpm test:e2e`     | Playwright against the production build (run `pnpm build` first)     |
| `pnpm check`        | Typecheck, lint, format check and unit tests                         |
| `pnpm leak:files`   | Leak check of tracked and untracked files and their paths            |
| `pnpm leak:history` | Leak check of every Git object, commit message and ref name          |
| `pnpm leak:encode`  | Encode a terms list from stdin into the base64 configuration value   |

## Confidentiality

Two confidential projects appear publicly only as `confidential-01` and `confidential-02`
with sanitized titles and descriptions. Their real names must never exist anywhere in this
repository or its history: not in code, comments, file or folder names, assets, metadata,
test fixtures, branch names, commit messages, issues or pull requests.

Enforcement is layered:

1. **Types.** `ConfidentialProject` has no route, link, media, story, SEO or client fields.
2. **Data layer.** Content modules are `server-only`; drafts are filtered before rendering;
   confidential entries are never built as pages. Nothing is hidden with CSS.
3. **Leak check** (`scripts/leak-check.mjs`), with the blocklist supplied only through
   `LEAK_CHECK_TERMS_B64` (never stored in the repo):
   - Git hooks: `pre-commit` (staged content, staged paths, branch name), `commit-msg`,
     `pre-push` (pushed refs and every object in the local Git database)
   - GitHub Actions: tracked files, full history, commit messages, ref names, PR title and body
   - Vercel build: `.next` output (except the never-deployed `.next/cache` and
     `.next/dev/cache`) and `public/`; a finding fails the deployment
4. **Policy checks** (`scripts/lint-policy.mjs`): no `NEXT_PUBLIC_` variables, production
   browser source maps stay disabled, no editor metadata in SVGs, no EXIF/XMP/text
   metadata in images, and app code never references the blocklist variable.

Content is handled in two ways:

- **Text-like content** (valid UTF-8 without NUL bytes: HTML, JS, CSS, JSON, RSC payloads,
  manifests, SVG, commit messages) is normalized for case, diacritics, Hebrew niqqud and
  final letters, and invisible characters, matched with separator variants (`foo bar`,
  `foo-bar`, `FooBar`), and decoded for JS escapes, HTML entities and percent-encoding.
- **Arbitrary binary content** (images, fonts, caches, Git trees) is never converted to a
  string. Each term is pre-encoded as UTF-8, UTF-16LE and UTF-16BE byte patterns (composed,
  decomposed, niqqud-free, final-letter, case and separator forms) and matched byte-level,
  which also covers text metadata inside images and documents. Files above 32 MB are
  matched in overlapping chunks with bounded memory.

Output never contains a term: findings name the term's number and a location with matching
path segments redacted.

It **fails closed** in CI and on Vercel when the variable is missing. Locally it fails too,
unless you set `LEAK_CHECK_ALLOW_UNCONFIGURED=1` for a single command.

### Configuring the blocklist

Keep the plain list in a file **outside** the repository, one term per line (Hebrew and
English forms, common misspellings). Prefix a term with `=` to disable separator-variant
matching for that term. Then:

```sh
pnpm leak:encode < ~/private/martin-g-terms.txt
```

Put the printed value in:

- `.env.local` as `LEAK_CHECK_TERMS_B64=...` (gitignored)
- GitHub: Settings → Secrets and variables → Actions → `LEAK_CHECK_TERMS_B64`
- Vercel: Project → Settings → Environment Variables → `LEAK_CHECK_TERMS_B64`, marked
  **Sensitive**, for Production and Preview

If a confidential term is ever committed or pushed, treat it as disclosed.

## Copy review

Hebrew copy is written or approved by Martin and never auto-translated. Every dictionary and
project carries a review status. **Vercel production builds fail while any published copy is
marked `draft`** (`src/i18n/release-gate.ts`); preview and local builds are unaffected.

## More

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): decisions, structure and phase plan
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md): the visual system (tokens, type, grid,
  brand marks, motion, themes)
- [docs/CASE-STUDIES.md](docs/CASE-STUDIES.md): the case studies (Phase 5), their primitives
  and the ON narrative
