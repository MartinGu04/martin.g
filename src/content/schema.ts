import type { StaticImageData } from 'next/image'
import type { Localized, ReviewStatus } from '@/i18n/config'
import type { DisciplineKey } from '@/i18n/dictionaries'

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export interface ImageMedia {
  kind: 'image'
  src: StaticImageData
  /** Required in every locale unless the image is purely decorative. */
  alt: Localized
  decorative?: boolean
  /** Crop anchor (0..1) used when compositions change across 4/8/12 layouts. */
  focal?: { x: number; y: number }
  /** Real art direction per tier, not scaled-down desktop crops. */
  art?: { tablet?: StaticImageData; mobile?: StaticImageData }
}

/**
 * Video sources are a discriminated union so heavy video can move to a dedicated
 * host later by adding a provider variant, without touching case-study components.
 * V1 implements only optimized static files served by Vercel.
 */
export type VideoSource = {
  provider: 'static'
  files: readonly { src: `/${string}`; type: 'video/mp4' | 'video/webm' }[]
}

export interface VideoMedia {
  kind: 'video'
  source: VideoSource
  poster: StaticImageData
  alt: Localized
  captions?: Localized<`/${string}.vtt`>
  /** Forced to 'never' under prefers-reduced-motion. */
  autoplay: 'never' | 'in-view'
}

/** Reserves space and aspect ratio until production media exists. */
export interface PendingMedia {
  kind: 'pending'
  aspectRatio: number
  alt: Localized
}

export type Media = ImageMedia | VideoMedia | PendingMedia

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

export type ColorToken = 'surface0' | 'surface1' | 'text' | 'textMuted' | 'line' | 'accent'

/**
 * Projects may introduce their own visual world, but only through color.
 * There are deliberately no spacing, radius, grid, type-scale or motion keys:
 * MARTIN.G layout and motion rules always apply.
 */
export interface ProjectTheme {
  scheme: 'dark' | 'light'
  colors: Readonly<Record<Exclude<ColorToken, 'accent'>, string>> & { accent?: string }
}

/* ------------------------------------------------------------------ */
/* Case-study blocks                                                   */
/* ------------------------------------------------------------------ */

export type Block =
  | { type: 'chapter'; index: string; title: Localized }
  | { type: 'statement'; text: Localized; size?: 'l' | 'xl' }
  | { type: 'text'; heading?: Localized; body: Localized<readonly string[]> }
  | {
      type: 'media'
      media: Media
      layout: 'full-bleed' | 'wide' | 'inset' | 'offset'
      caption?: Localized
    }
  | { type: 'split'; media: Media; body: Localized<readonly string[]>; mediaSide: 'start' | 'end' }
  | { type: 'sequence'; items: readonly Media[] }
  | { type: 'facts'; items: readonly { label: Localized; value: Localized }[] }
  | { type: 'metrics'; items: readonly { value: string; label: Localized }[] }
  | { type: 'quote'; text: Localized; attribution?: Localized }
  | { type: 'theme-shift'; to: ProjectTheme | 'brand' }

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export interface ProjectYears {
  from: number
  to?: number | 'present'
}

interface ProjectCore {
  /** ASCII kebab-case. For public projects it is also the URL slug. */
  id: string
  order: number
  status: 'published' | 'draft'
  /** Copy review per locale. Production builds refuse 'draft'. */
  review: Localized<ReviewStatus>
  title: Localized
  summary: Localized
  disciplines: readonly DisciplineKey[]
}

export interface PublicProject extends ProjectCore {
  visibility: 'public'
  /** Omitted until confirmed; never invented. */
  years?: ProjectYears
  theme?: ProjectTheme
  cover: Media
  story: readonly Block[]
  seo: { title: Localized; description: Localized }
}

/**
 * Confidential work is a closed shape. It has no route, no link, no media and no story.
 * Forbidden keys are typed `never` so they cannot be added even through spreads, and
 * tests/unit/content.test.ts rejects any key outside the allowlist at runtime.
 * Never place a real name, client, location or identifying detail in these objects.
 */
export interface ConfidentialProject extends ProjectCore {
  visibility: 'confidential'
  /** Omit entirely when even the year could identify the work. */
  years?: ProjectYears
  cover: { kind: 'abstract'; pattern: 'grid' | 'lines' | 'field' }
  slug?: never
  href?: never
  links?: never
  media?: never
  story?: never
  seo?: never
  theme?: never
  client?: never
}

export type Project = PublicProject | ConfidentialProject

export const confidentialAllowedKeys = [
  'id',
  'order',
  'status',
  'review',
  'title',
  'summary',
  'disciplines',
  'visibility',
  'years',
  'cover',
] as const satisfies readonly (keyof ConfidentialProject)[]
