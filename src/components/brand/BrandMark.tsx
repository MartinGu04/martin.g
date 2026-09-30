import type { StyleWithVars } from '@/lib/css'
import { brandMarks, type BrandMarkKey } from './brand'
import styles from './BrandMark.module.css'

export interface BrandMarkProps {
  /** Requested block size (CSS length). Clamped up to the legible minimum in CSS. */
  height?: string
  /** Requested inline size (CSS length), as an alternative to height. */
  width?: string
  className?: string
  /** Decorative when an adjacent element already provides the accessible name. */
  decorative?: boolean
  /** Overrides the accessible name (defaults to the mark's name). */
  label?: string
  /** Reserves the minimum clear space around the mark (height-based sizing only). */
  withClearSpace?: boolean
}

function BrandMark({
  mark,
  height,
  width,
  className,
  decorative,
  label,
  withClearSpace,
}: BrandMarkProps & { mark: BrandMarkKey }) {
  const asset = brandMarks[mark]
  const style: StyleWithVars = {
    '--mark-src': `url("${asset.src}")`,
    '--mark-ratio': `${asset.width} / ${asset.height}`,
    '--mark-ratio-n': (asset.width / asset.height).toFixed(4),
    '--mark-clear': asset.clearSpace,
    ...(width ? { '--mark-inline': width } : { '--mark-size': height ?? '1em' }),
  }
  const cls = [
    styles.mark,
    styles[mark],
    width ? styles.inline : '',
    withClearSpace && !width ? styles.clear : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  // Brand marks are always left-to-right artwork, whatever the document direction.
  return decorative ? (
    <span className={cls} style={style} aria-hidden="true" dir="ltr" data-mark={mark} />
  ) : (
    <span
      className={cls}
      style={style}
      role="img"
      aria-label={label ?? asset.name}
      dir="ltr"
      data-mark={mark}
    />
  )
}

/** Primary identity: tablet/desktop header, footer, hero, social assets. */
export function Wordmark(props: BrandMarkProps) {
  return <BrandMark mark="wordmark" {...props} />
}

/** Secondary symbol: compact mobile header, favicon, social avatars, small details. */
export function Monogram(props: BrandMarkProps) {
  return <BrandMark mark="monogram" {...props} />
}
