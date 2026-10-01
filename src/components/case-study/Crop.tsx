import { getImageProps, type StaticImageData } from 'next/image'
import type { ReactNode } from 'react'
import type { Locale } from '@/i18n/config'
import type { CropRegion, ImageCrop } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import styles from './Crop.module.css'

/** The frame's share of the viewport per tier (0..1), for the image's `sizes`. */
export interface CropWidth {
  base: number
  md?: number
  lg?: number
}

interface CropProps {
  crop: ImageCrop
  locale: Locale
  width: CropWidth
  caption?: ReactNode
  /** 'surface' frames an opaque screen; 'none' shows a transparent mark on the world. */
  ground?: 'surface' | 'none'
  /** Only for the above-the-fold image of a page: preloaded and fetched first. */
  priority?: boolean
  className?: string
}

const pct = (n: number) => `${Math.round(n * 10000) / 100}%`

/** Ratio, scale and offset of a region, as the frame's custom properties. */
function regionVars(src: StaticImageData, region: CropRegion, suffix = ''): StyleWithVars {
  return {
    [`--crop-ratio${suffix}`]: `${region.width} / ${region.height}`,
    [`--crop-scale${suffix}`]: src.width / region.width,
    [`--crop-x${suffix}`]: pct(-region.x / src.width),
    [`--crop-y${suffix}`]: pct(-region.y / src.height),
  }
}

/**
 * A region of a real image at its own ratio, for examining craft up close (a headline, a
 * button, the monogram's ribbon) or for framing a screen without its capture edges. The
 * frame reserves the region's ratio, so nothing shifts; the image inside is the whole
 * source, scaled so the region fills the frame. A crop may name another region of the
 * same source for phones: art direction without a second file. Regions are physical
 * (images are never mirrored), so the frame is laid out left to right in both directions.
 * Lazy and optimized by Next like every other image; `sizes` asks for the width the whole
 * image is actually drawn at.
 */
export function Crop({
  crop,
  locale,
  width,
  caption,
  ground = 'surface',
  priority = false,
  className,
}: CropProps) {
  const { src, region, mobile = region } = crop
  const vw = (share: number, r: CropRegion) => `${Math.ceil(share * (src.width / r.width) * 100)}vw`
  const sizes = [
    width.lg !== undefined ? `(width >= 75rem) ${vw(width.lg, region)}` : null,
    width.md !== undefined ? `(width >= 48rem) ${vw(width.md, region)}` : null,
    vw(width.base, mobile),
  ]
    .filter(Boolean)
    .join(', ')
  const { props } = getImageProps({ src, alt: crop.alt[locale], sizes, preload: priority })
  const style: StyleWithVars = { ...regionVars(src, region), ...regionVars(src, mobile, '-sm') }
  const frame = (
    <div className={styles.frame} data-ground={ground} style={style}>
      <div className={styles.lens}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props from getImageProps */}
        <img {...props} className={styles.image} draggable={false} />
      </div>
    </div>
  )
  if (!caption) return <div className={className}>{frame}</div>
  return (
    <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
      {frame}
      <figcaption className={`t-small muted ${styles.caption}`}>{caption}</figcaption>
    </figure>
  )
}
