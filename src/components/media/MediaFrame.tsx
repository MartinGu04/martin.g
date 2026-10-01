import { getImageProps, type StaticImageData } from 'next/image'
import type { ReactNode } from 'react'
import type { Locale } from '@/i18n/config'
import type { ImageMedia, Media, VideoSource } from '@/content/schema'
import { MediaShell, type AspectRatio } from './MediaShell'
import shellStyles from './MediaShell.module.css'
import { PreviewVideo, type PreviewVideoLabels } from './PreviewVideo'

interface MediaFrameProps {
  media: Media
  locale: Locale
  /** Responsive `sizes` hint for images. */
  sizes: string
  /** Only for the above-the-fold image of a page: preloaded and fetched first. */
  priority?: boolean
  caption?: ReactNode
  className?: string
  /** Required for video: the preview player's control labels. */
  videoLabels?: PreviewVideoLabels
  /**
   * 'drift': a very slow ambient move inside the frame (a loop: it runs only while its
   * scene is visible, never without scripting or with reduced motion).
   */
  motion?: 'drift'
}

/** Mirrors the tier breakpoints (48rem and 75rem); a source applies below its tier's end. */
const TIER_QUERY = {
  mobile: '(max-width: 47.99rem)',
  tablet: '(max-width: 74.99rem)',
} as const

function videoFiles(source: VideoSource) {
  switch (source.provider) {
    case 'static':
      return source.files
  }
}

const ratio = (img: StaticImageData) => img.width / img.height

export function aspectOf(media: Media): AspectRatio {
  switch (media.kind) {
    case 'pending':
      return media.aspectRatio
    case 'image':
      return {
        mobile: ratio(media.art?.mobile ?? media.src),
        tablet: ratio(media.art?.tablet ?? media.src),
        desktop: ratio(media.src),
      }
    case 'video':
      return ratio(media.poster)
  }
}

/**
 * An image with real art direction: each tier can receive its own crop or screen (for
 * example a phone screen instead of the desktop one), not a scaled-down copy. Every source
 * carries its intrinsic size and the frame reserves the tier's ratio, so nothing shifts.
 */
export function ArtImage({
  media,
  locale,
  sizes,
  priority,
}: {
  media: ImageMedia
  locale: Locale
  sizes: string
  priority: boolean
}) {
  const alt = media.decorative ? '' : media.alt[locale]
  const opaque = media.fit !== 'contain'
  const common = { alt, sizes, ...(opaque ? { placeholder: 'blur' as const } : {}) }
  const { props: img } = getImageProps({ ...common, src: media.src, preload: priority })
  const sources = (['mobile', 'tablet'] as const).flatMap((tier) => {
    const src = media.art?.[tier]
    if (!src) return []
    const { props } = getImageProps({ ...common, src })
    return [{ tier, props }]
  })
  if (sources.length === 0) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props from getImageProps
    return <img {...img} />
  }
  return (
    <picture>
      {sources.map(({ tier, props }) => (
        <source
          key={tier}
          media={TIER_QUERY[tier]}
          srcSet={props.srcSet}
          sizes={props.sizes}
          width={props.width}
          height={props.height}
        />
      ))}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- props from getImageProps */}
      <img {...img} />
    </picture>
  )
}

/** Single entry point for all media, so providers can change without touching layouts. */
export function MediaFrame({
  media,
  locale,
  sizes,
  priority,
  caption,
  className,
  videoLabels,
  motion,
}: MediaFrameProps) {
  if (media.kind === 'video') {
    if (!videoLabels) throw new Error('MediaFrame: video needs its player labels.')
    // Only flattened, single-locale values cross into the client component.
    const { props: poster } = getImageProps({ src: media.poster, alt: '', width: 1280 })
    const posterSrc = poster.srcSet?.split(' ')[0] ?? poster.src // the 1x candidate
    return (
      <PreviewVideo
        files={videoFiles(media.source)}
        poster={{ src: posterSrc, width: media.poster.width, height: media.poster.height }}
        description={media.alt[locale]}
        labels={videoLabels}
        caption={caption}
        className={className}
      />
    )
  }
  return (
    <MediaShell
      aspectRatio={aspectOf(media)}
      fit={media.kind === 'image' ? media.fit : undefined}
      caption={caption}
      className={className}
    >
      {media.kind === 'pending' ? (
        <div role="img" aria-label={media.alt[locale]} style={{ position: 'absolute', inset: 0 }} />
      ) : motion === 'drift' ? (
        <span className={shellStyles.drift} data-loop="">
          <ArtImage media={media} locale={locale} sizes={sizes} priority={priority ?? false} />
        </span>
      ) : (
        <ArtImage media={media} locale={locale} sizes={sizes} priority={priority ?? false} />
      )}
    </MediaShell>
  )
}
