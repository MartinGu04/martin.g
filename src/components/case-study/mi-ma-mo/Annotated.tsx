import type { Locale } from '@/i18n/config'
import type { CropRegion, ImageCrop } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import { Ltr } from '@/components/type/Ltr'
import { Crop, type CropWidth } from '../Crop'
import styles from './Annotated.module.css'

/** Where a mark's number sits: outside one corner of its box (physical, like the image). */
export type TagCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface Mark {
  id: string
  number: string
  /** In the crop's source pixels. */
  box: CropRegion
  tag?: TagCorner
  /** A slow pulse on the box (a loop: only in an ambient scene, while it is on screen). */
  pulse?: boolean
}

const pct = (n: number) => `${Math.round(n * 10000) / 100}%`

/** The part of a box inside a region, or null when they do not meet. */
function within(box: CropRegion, region: CropRegion): CropRegion | null {
  const x = Math.max(box.x, region.x)
  const y = Math.max(box.y, region.y)
  const right = Math.min(box.x + box.width, region.x + region.width)
  const bottom = Math.min(box.y + box.height, region.y + region.height)
  if (right <= x || bottom <= y) return null
  return { x, y, width: right - x, height: bottom - y }
}

function boxVars(box: CropRegion, region: CropRegion, suffix = ''): StyleWithVars {
  return {
    [`--mx${suffix}`]: pct((box.x - region.x) / region.width),
    [`--my${suffix}`]: pct((box.y - region.y) / region.height),
    [`--mw${suffix}`]: pct(box.width / region.width),
    [`--mh${suffix}`]: pct(box.height / region.height),
  }
}

/**
 * A real screen with numbered boxes around parts of its interface (the next shift, who is
 * on it, today). The boxes are measured in the screenshot's own pixels, so they stay on
 * their element at every size; where the crop frames another region on phones, each box is
 * clipped to it, and a box outside it is not drawn there. The overlay is decorative: the
 * numbers and names are read from the list the composition sets beside the screen.
 */
export function Annotated({
  crop,
  locale,
  width,
  marks,
  ground = 'surface',
  priority,
  className,
}: {
  crop: ImageCrop
  locale: Locale
  width: CropWidth
  marks: readonly Mark[]
  /** 'none' for a screen with its own transparent edges (the phone, frame included). */
  ground?: 'surface' | 'none'
  priority?: boolean
  className?: string
}) {
  const { region, mobile = region } = crop
  return (
    <div className={[styles.annotated, className].filter(Boolean).join(' ')}>
      <Crop
        crop={crop}
        locale={locale}
        width={width}
        ground={ground}
        {...(priority ? { priority } : {})}
      />
      <div className={styles.overlay} aria-hidden="true">
        {marks.map((mark) => {
          const main = within(mark.box, region)
          if (!main) return null
          const small = within(mark.box, mobile)
          const style: StyleWithVars = {
            ...boxVars(main, region),
            ...(small ? boxVars(small, mobile, '-sm') : {}),
          }
          return (
            <span
              key={mark.id}
              className={styles.mark}
              data-tag={mark.tag ?? 'top-right'}
              data-phone={small ? undefined : 'off'}
              style={style}
            >
              {mark.pulse ? <span className={styles.pulse} data-loop="" /> : null}
              <span className={`t-label t-numeric ${styles.tag}`}>
                <Ltr>{mark.number}</Ltr>
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** The legend beside an annotated screen: the same numbers, each with a name and a line. */
export function MarkList({
  items,
  className,
}: {
  items: readonly { id: string; number: string; label: string; note?: string }[]
  className?: string
}) {
  return (
    <ol role="list" className={[styles.list, className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <span className={`t-label t-numeric ${styles.number}`} aria-hidden="true">
            <Ltr>{item.number}</Ltr>
          </span>
          <span className={styles.text}>
            <span className={`t-body-l ${styles.label}`}>{item.label}</span>
            {item.note ? <span className="t-body muted">{item.note}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  )
}
