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
- No em dashes in public copy. The second project's public name is המחלבה; its id, slug and
  code identifiers stay `mi-ma-mo`.
- Project media: only supplied, approved assets, sanitized in the pixels before they enter the
  repo (no names, insignia or personal schedules); originals stay outside the repo. Video is
  only ever a watermarked preview, never the master, played by `PreviewVideo` (no native
  controls). Live-site links only for URLs approved for public visitors.
- CSS: logical properties only; read semantic color tokens, not palette constants. Use the
  type-role classes and named grid placements in docs/DESIGN-SYSTEM.md. No `ch` units for
  measures (the Hebrew face has no "0" glyph). Never render a brand mark below its minimum.
- Motion: nothing may start hidden unless `(scripting: enabled)` and
  `(prefers-reduced-motion: no-preference)`. Continuous loops only inside `<Scene ambient>`,
  on `data-loop` elements (paused offscreen, none with reduced motion); slow, restrained,
  real content only.
- Internal Systems (confidential work): sanitized aliases and generated abstract geometry
  only; never classified, warning, clearance or dossier language or styling. One explicit
  exception: `confidential-01` may show its one approved, fully anonymized portfolio image
  (`src/assets/confidential/`, pinned by hash). Never add originals, intermediate
  screenshots or any other confidential image.
- Commit messages: no Claude session URLs or other session links (public breadcrumbs).
- Navigation: no placeholder or dead destinations. Contact, Privacy and Accessibility exist
  since Phase 6.
- Before pushing: `pnpm check`, `pnpm build`, `pnpm test:e2e`.
