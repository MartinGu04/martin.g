import type { Locale } from '@/i18n/config'
import type { ImageMedia } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import { IndexNumber } from '@/components/type/IndexNumber'
import { MediaShell } from './MediaShell'
import { ArtImage, aspectOf } from './MediaFrame'
import styles from './ViewCycle.module.css'

interface ViewCycleProps {
  items: readonly { media: ImageMedia; label?: string }[]
  locale: Locale
  sizes: string
  /** Seconds each view holds, crossfade included. */
  step: number
  /**
   * Without motion (no scripting, reduced motion): 'first' shows the first view alone,
   * 'grid' sets every view out in a static grid so nothing is lost.
   */
  fallback: 'first' | 'grid'
  /** A row of view labels; the current one is marked while the cycle runs. */
  labels?: boolean
  className?: string
}

/**
 * Real views taking turns in one frame while the scene is visible: a slow crossfade, the
 * incoming view laid over the outgoing one. Not a carousel: no controls, no swiping, no
 * fast cuts. Every view stays in the document with its own alternative text. The cycle is
 * an ambient loop (motion.css): it runs only inside an ambient scene that is on screen.
 * All views share the first view's ratio per tier.
 */
export function ViewCycle({
  items,
  locale,
  sizes,
  step,
  fallback,
  labels,
  className,
}: ViewCycleProps) {
  const style: StyleWithVars = { '--n': items.length, '--step': `${step}s` }
  const first = items[0]
  if (!first) return null
  const ratio = aspectOf(first.media)
  return (
    <div
      className={[styles.cycle, className].filter(Boolean).join(' ')}
      data-fallback={fallback}
      data-count={items.length}
      style={style}
    >
      <div className={styles.views}>
        {items.map(({ media }, i) => (
          <div key={i} className={styles.view} data-loop="" style={{ '--i': i } as StyleWithVars}>
            <MediaShell aspectRatio={ratio} fit={media.fit}>
              <ArtImage media={media} locale={locale} sizes={sizes} priority={false} />
            </MediaShell>
          </div>
        ))}
      </div>
      {labels ? (
        <ol role="list" className={`t-micro ${styles.labels}`}>
          {items.map(({ label }, i) => (
            <li key={i} className={styles.label} data-loop="" style={{ '--i': i } as StyleWithVars}>
              <IndexNumber value={String(i + 1).padStart(2, '0')} className={styles.index} />
              <span className={styles.rule} data-loop="" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
