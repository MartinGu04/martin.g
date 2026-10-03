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
  /**
   * 'cover' (default) fills its frame; 'contain' shows a cut-out (a device with a
   * transparent surround) whole, without a frame surface or edge.
   */
  fit?: 'cover' | 'contain'
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

/**
 * Video is only ever a watermarked preview made for publication (never a master): the
 * player has no native controls, no download, no picture-in-picture and no remote
 * playback (src/components/media/PreviewVideo.tsx).
 */
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

/**
 * A region of a real, approved image shown at its own ratio: a detail of a screen or a
 * mark examined up close. Never a new asset: the browser loads the same source as every
 * other use of it, and the region is applied in the frame (src/components/case-study/Crop).
 */
export interface ImageCrop {
  kind: 'crop'
  src: StaticImageData
  /** In source pixels, from the image's top-left corner (images are not mirrored in RTL). */
  region: CropRegion
  /** A different region of the same source for phones (art direction without a new file). */
  mobile?: CropRegion
  alt: Localized
}

export interface CropRegion {
  x: number
  y: number
  width: number
  height: number
}

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

/** Theme colors are 6-digit hex so contrast can be validated (src/lib/theme.ts). */
export type HexColor = `#${string}`

/**
 * The layers of a scene's atmosphere (<Atmosphere>). Every layer reads the scope's
 * semantic colors, so the same spec renders correctly in any world.
 */
export interface AtmosphereSpec {
  /** Where light falls: a directional shaft, an overhead pool, a raking side light, or none. */
  readonly light?: 'shaft' | 'pool' | 'side' | 'none'
  /** How much of the grid is drawn. The grid itself is always authoritative. */
  readonly grid?: 'hidden' | 'light' | 'fade' | 'visible'
  /** Surface texture: fine grain, softer paper, a technical dot field, or none. */
  readonly texture?: 'grain' | 'paper' | 'dots' | 'none'
  /** Corner registration marks (a technical accent, never the identity). */
  readonly marks?: boolean
  readonly vignette?: boolean
}

/**
 * A project world. MARTIN.G provides the grammar (scale, type hierarchy, spacing, grid,
 * motion, transitions, brand marks, pacing); a world may change color, light, texture and
 * atmosphere, and nothing else. There are deliberately no spacing, radius, grid,
 * type-scale or motion keys.
 *
 * Required: background (surface0), raised surface (surface1), foreground (text) and muted
 * text. Optional: structural lines (derived from the foreground when omitted), up to two
 * accents (default to the foreground), the color of light fields and of the shade they
 * fall off into (derived from the scheme when omitted), and the atmosphere layers. Focus
 * ring, selection and control borders are always derived, so a theme cannot break them.
 */
export interface ProjectTheme {
  scheme: 'dark' | 'light'
  colors: {
    readonly surface0: HexColor
    readonly surface1: HexColor
    readonly text: HexColor
    readonly textMuted: HexColor
    readonly line?: HexColor
    readonly accent?: HexColor
    readonly accent2?: HexColor
    readonly light?: HexColor
    readonly shade?: HexColor
  }
  atmosphere?: AtmosphereSpec
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
  | { type: 'sequence'; items: readonly { media: Media; caption?: Localized }[] }
  | { type: 'facts'; items: readonly { label: Localized; value: Localized }[] }
  | { type: 'metrics'; items: readonly { value: string; label: Localized }[] }
  | { type: 'quote'; text: Localized; attribution?: Localized }
  | { type: 'theme-shift'; to: ProjectTheme | 'brand' }

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

/** An absolute https URL outside MARTIN.G. */
export type ExternalUrl = `https://${string}`

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
  /**
   * Destinations outside MARTIN.G. Only URLs approved for public visitors: never a
   * login-gated or internal deployment.
   */
  links?: { live?: ExternalUrl }
  story: readonly Block[]
  seo: { title: Localized; description: Localized }
}

/**
 * Confidential work is a closed shape. It has no route, no link, no media and no story.
 * Forbidden keys are typed `never` so they cannot be added even through spreads, and
 * tests/unit/content.test.ts rejects any key outside the allowlist at runtime.
 * Never place a real name, client, location or identifying detail in these objects.
 */
interface ConfidentialCore extends ProjectCore {
  visibility: 'confidential'
  /** Omit entirely when even the year could identify the work. */
  years?: ProjectYears
  slug?: never
  href?: never
  links?: never
  media?: never
  story?: never
  seo?: never
  theme?: never
  client?: never
}

/** The default for confidential work: generated abstract geometry, never imagery. */
export interface AbstractCover {
  kind: 'abstract'
  pattern: 'grid' | 'lines' | 'field'
}

/**
 * The one exception to abstract-only covers: the single final portfolio image Martin
 * supplied and approved for confidential-01, fully anonymized in its pixels (no readable
 * text, names, numbers, dates, identifiers, product name or logo). Never an original
 * screenshot or an intermediate derived from the real system. The asset's hash is pinned
 * in tests/unit/content.test.ts, so replacing it is a deliberate, reviewed change.
 */
export interface ApprovedInterfaceCover {
  kind: 'approved-interface'
  src: StaticImageData
  /** Generic in every locale: never a name, a product or anything the image could show. */
  alt: Localized
  /** Crop anchor (0..1) for the tighter frame. */
  focal?: { x: number; y: number }
}

/** The only confidential project allowed an approved interface cover. */
export const INTERFACE_COVER_EXCEPTION = 'confidential-01'

/**
 * Confidential work is a closed shape: no route, no link, no media field and no story.
 * Covers are abstract, except that confidential-01 (and only it, by type) may show its
 * approved anonymized interface image.
 */
export type ConfidentialProject =
  | (ConfidentialCore & { cover: AbstractCover })
  | (ConfidentialCore & {
      id: typeof INTERFACE_COVER_EXCEPTION
      cover: AbstractCover | ApprovedInterfaceCover
    })

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
