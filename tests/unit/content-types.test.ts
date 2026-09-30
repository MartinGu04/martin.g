/*
 * Compile-time guarantees, checked by `pnpm typecheck`. Each @ts-expect-error must stay
 * an error; if a restriction is loosened, tsc fails because the directive is unused.
 */
import { describe, expect, it } from 'vitest'
import type { ConfidentialProject, ProjectTheme } from '@/content/schema'
import type { Dictionary } from '@/i18n/dictionaries'

const base = {
  id: 'confidential-99',
  visibility: 'confidential',
  order: 99,
  status: 'draft',
  review: { en: 'draft', he: 'draft' },
  title: { en: 'Confidential', he: 'חסוי' },
  summary: { en: 'Summary', he: 'תקציר' },
  disciplines: ['engineering'],
  cover: { kind: 'abstract', pattern: 'grid' },
} as const satisfies ConfidentialProject

// @ts-expect-error confidential work cannot have a route or slug
export const withSlug: ConfidentialProject = { ...base, slug: 'x' }
// @ts-expect-error confidential work cannot link anywhere
export const withHref: ConfidentialProject = { ...base, href: 'https://example.invalid' }
// @ts-expect-error confidential work cannot carry media
export const withMedia: ConfidentialProject = { ...base, media: [] }
// @ts-expect-error confidential work cannot have a case study
export const withStory: ConfidentialProject = { ...base, story: [] }
// @ts-expect-error confidential work cannot name a client
export const withClient: ConfidentialProject = { ...base, client: 'x' }
// @ts-expect-error confidential covers are abstract, never imagery
export const withImageCover: ConfidentialProject = { ...base, cover: { kind: 'image' } }
// @ts-expect-error every locale is required
export const missingLocale: ConfidentialProject = { ...base, title: { en: 'Only English' } }

export const themeWithSpacing: ProjectTheme = {
  scheme: 'dark',
  colors: {
    surface0: '#000',
    surface1: '#111',
    text: '#fff',
    textMuted: '#aaa',
    line: '#222',
    // @ts-expect-error project themes may change palette only
    spacing: '1rem',
  },
}

// @ts-expect-error the Hebrew dictionary must match the English shape exactly
export const partialDictionary: Dictionary = { site: { name: 'x' } }

describe('type-level restrictions', () => {
  it('are enforced by the TypeScript compiler', () => {
    expect(base.visibility).toBe('confidential')
  })
})
