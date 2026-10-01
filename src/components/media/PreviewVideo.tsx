'use client'

import { useRef, useState, useSyncExternalStore, type ReactNode, type SyntheticEvent } from 'react'
import styles from './PreviewVideo.module.css'

export interface PreviewVideoLabels {
  play: string
  pause: string
}

interface PreviewVideoProps {
  files: readonly { src: string; type: string }[]
  poster: { src: string; width: number; height: number }
  /** What the film shows, for assistive technology (it is silent and has no dialogue). */
  description: string
  labels: PreviewVideoLabels
  caption?: ReactNode
  className?: string
}

const block = (event: SyntheticEvent) => event.preventDefault()

const noop = () => () => {}
/** False on the server and during hydration, true once the player runs in the browser. */
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )

/**
 * A player for watermarked preview films. Deterrents only, never protection: the browser
 * must receive the file to play it, so a determined visitor can still recover or record
 * it. The real protection is upstream: the published file is already a reduced, silent,
 * watermarked preview, and the master never enters the repository or the deployment.
 *
 * - no native controls, so no download, picture-in-picture or casting menu; the
 *   `controlsList` and `disable*` attributes cover browsers that still offer them
 * - one restrained control (play / pause), a real button with a visible focus ring
 * - no context menu and no dragging on the presentation area; a transparent layer over
 *   the picture toggles playback on click or tap and sits below the control, so it never
 *   takes focus or intercepts the button
 * - never autoplays (so it also honors reduced motion), loads nothing until asked
 * - the <video> exists only once the player runs: without JavaScript a browser must show
 *   its native controls on any video, so the server renders the poster alone, and the
 *   media URL is not in the server HTML
 */
export function PreviewVideo({
  files,
  poster,
  description,
  labels,
  caption,
  className,
}: PreviewVideoProps) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const hydrated = useHydrated()

  const toggle = () => {
    const el = video.current
    if (!el) return
    if (el.paused) void el.play().catch(() => setPlaying(false))
    else el.pause()
  }

  return (
    <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
      <div
        className={styles.stage}
        style={{ aspectRatio: `${poster.width} / ${poster.height}` }}
        onContextMenu={block}
        onDragStart={block}
      >
        {hydrated ? (
          <>
            <video
              ref={video}
              className={styles.video}
              poster={poster.src}
              preload="none"
              muted
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noremoteplayback noplaybackrate"
              draggable={false}
              aria-label={description}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            >
              {files.map((file) => (
                <source key={file.src} src={file.src} type={file.type} />
              ))}
            </video>
            <div className={styles.shield} aria-hidden="true" onClick={toggle} />
            <button
              type="button"
              className={styles.control}
              onClick={toggle}
              aria-label={playing ? labels.pause : labels.play}
              data-state={playing ? 'playing' : 'paused'}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                {playing ? (
                  <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" />
                ) : (
                  <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                )}
              </svg>
            </button>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- the poster is already optimized
          <img
            className={styles.video}
            src={poster.src}
            width={poster.width}
            height={poster.height}
            alt={description}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
      {caption ? (
        <figcaption className={`t-small muted ${styles.caption}`}>{caption}</figcaption>
      ) : null}
    </figure>
  )
}
