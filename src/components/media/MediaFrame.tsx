import Image from 'next/image'
import type { Locale } from '@/i18n/config'
import type { Media, VideoSource } from '@/content/schema'
import styles from './MediaFrame.module.css'

interface MediaFrameProps {
  media: Media
  locale: Locale
  /** Responsive `sizes` hint for images. */
  sizes: string
  priority?: boolean
}

function renderVideoSources(source: VideoSource) {
  switch (source.provider) {
    case 'static':
      return source.files.map((f) => <source key={f.src} src={f.src} type={f.type} />)
  }
}

/** Single entry point for all media, so providers can change without touching layouts. */
export function MediaFrame({ media, locale, sizes, priority }: MediaFrameProps) {
  switch (media.kind) {
    case 'pending':
      return (
        <div
          className={styles.pending}
          style={{ aspectRatio: String(media.aspectRatio) }}
          role="img"
          aria-label={media.alt[locale]}
        />
      )
    case 'image':
      return (
        <Image
          className={styles.image}
          src={media.src}
          alt={media.decorative ? '' : media.alt[locale]}
          sizes={sizes}
          priority={priority ?? false}
          placeholder="blur"
        />
      )
    case 'video':
      // Phase 5 adds in-view autoplay (never under reduced motion). V1 foundation: user-initiated.
      return (
        <video
          className={styles.video}
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
      )
  }
}
