import Image from 'next/image'
import type { Locale } from '@/i18n/config'
import type { Media, VideoSource } from '@/content/schema'
import { MediaShell } from './MediaShell'

interface MediaFrameProps {
  media: Media
  locale: Locale
  /** Responsive `sizes` hint for images. */
  sizes: string
  priority?: boolean
  className?: string
}

function renderVideoSources(source: VideoSource) {
  switch (source.provider) {
    case 'static':
      return source.files.map((f) => <source key={f.src} src={f.src} type={f.type} />)
  }
}

function aspectOf(media: Media): number {
  switch (media.kind) {
    case 'pending':
      return media.aspectRatio
    case 'image':
      return media.src.width / media.src.height
    case 'video':
      return media.poster.width / media.poster.height
  }
}

/** Single entry point for all media, so providers can change without touching layouts. */
export function MediaFrame({ media, locale, sizes, priority, className }: MediaFrameProps) {
  return (
    <MediaShell aspectRatio={aspectOf(media)} className={className}>
      {media.kind === 'pending' ? (
        <div role="img" aria-label={media.alt[locale]} style={{ position: 'absolute', inset: 0 }} />
      ) : media.kind === 'image' ? (
        <Image
          src={media.src}
          alt={media.decorative ? '' : media.alt[locale]}
          sizes={sizes}
          priority={priority ?? false}
          placeholder="blur"
        />
      ) : (
        // Phase 5 adds in-view autoplay (never under reduced motion). For now: user-initiated.
        <video
          controls
          playsInline
          preload="none"
          poster={media.poster.src}
          aria-label={media.alt[locale]}
        >
          {renderVideoSources(media.source)}
          {media.captions ? (
            <track kind="captions" src={media.captions[locale]} srcLang={locale} default />
          ) : null}
        </video>
      )}
    </MediaShell>
  )
}
