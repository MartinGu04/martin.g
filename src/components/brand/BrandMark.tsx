import type { StyleWithVars } from '@/lib/css'
import { brandMarks, type BrandMarkKey } from './brand'
import styles from './BrandMark.module.css'

export interface BrandMarkProps {
  /** CSS length for the mark's block size. Proportions always come from the asset. */
  height?: string
  /** CSS length for the inline size, as an alternative to height. */
  width?: string
  className?: string
  /** Decorative when an adjacent element already provides the accessible name. */
  decorative?: boolean
  /** Overrides the accessible name (defaults to the mark's name). */
  label?: string
}

function BrandMark({
  mark,
  height,
  width,
  className,
  decorative,
  label,
}: BrandMarkProps & { mark: BrandMarkKey }) {
  const asset = brandMarks[mark]
  const style: StyleWithVars = {
    '--mark-src': `url("${asset.src}")`,
    aspectRatio: `${asset.width} / ${asset.height}`,
    ...(width ? { inlineSize: width } : { blockSize: height ?? '1em' }),
  }
  const cls = [styles.mark, className].filter(Boolean).join(' ')
  // Brand marks are always left-to-right artwork, whatever the document direction.
  return decorative ? (
    <span className={cls} style={style} aria-hidden="true" dir="ltr" />
  ) : (
    <span className={cls} style={style} role="img" aria-label={label ?? asset.name} dir="ltr" />
  )
}

/** Primary identity: desktop and tablet header, hero, social assets. */
export function Wordmark(props: BrandMarkProps) {
  return <BrandMark mark="wordmark" {...props} />
}

/** Secondary symbol: compact mobile header, favicon, social avatars, small details. */
export function Monogram(props: BrandMarkProps) {
  return <BrandMark mark="monogram" {...props} />
}
