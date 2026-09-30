# Working rules for this repository

This repository is **public**. Read README.md → Confidentiality and docs/ARCHITECTURE.md.

- Never write, ask for, or guess the real names of the confidential projects anywhere:
  code, comments, file or folder names, assets, test fixtures, branch names, commit
  messages, PR titles or bodies. Use only `confidential-01` / `confidential-02` and
  sanitized copy. Tests use synthetic canary terms only.
- Never store the leak-check blocklist in the repo. Never use `NEXT_PUBLIC_` variables.
  Keep `productionBrowserSourceMaps: false`.
- Never hide non-public information with CSS; if it is not public, it must not be rendered.
- Never auto-translate production copy. Hebrew you write is marked `review: 'draft'`.
- No em dashes in public copy. Use the brand spelling `mi-ma-mo`.
- CSS: logical properties only; read semantic color tokens, not palette constants. Use the
  type-role classes and named grid placements in docs/DESIGN-SYSTEM.md. No `ch` units for
  measures (the Hebrew face has no "0" glyph). Never render a brand mark below its minimum.
- Motion: nothing may start hidden unless `(scripting: enabled)` and
  `(prefers-reduced-motion: no-preference)`.
- Commit messages: no Claude session URLs or other session links (public breadcrumbs).
- Navigation: no placeholder or dead destinations (Contact arrives with Phase 6).
- Before pushing: `pnpm check`, `pnpm build`, `pnpm test:e2e`.
