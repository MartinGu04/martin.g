import type { CSSProperties, ReactNode } from 'react'
import { Img } from 'remotion'
import type { Source } from '../config/assets'

/**
 * A region of an approved image, shown at a given width. The image itself is never altered;
 * Img holds the frame until the pixels are decoded, so nothing pops in.
 */
export function Crop({
  src,
  region,
  width,
  style,
  children,
}: {
  src: Source
  /** [x, y, w, h] in source pixels; the whole image when omitted. */
  region?: readonly [number, number, number, number]
  width: number
  style?: CSSProperties
  children?: ReactNode
}) {
  const [x, y, w, h] = region ?? [0, 0, src.w, src.h]
  const k = width / w
  return (
    <div style={{ position: 'relative', width, height: h * k, overflow: 'hidden', ...style }}>
      <Img
        src={src.src}
        style={{
          position: 'absolute',
          insetInlineStart: -x * k,
          insetBlockStart: -y * k,
          width: src.w * k,
          height: src.h * k,
          maxWidth: 'none',
        }}
      />
      {children}
    </div>
  )
}

/** Keeps sources decoded for elements that use them as CSS backgrounds. */
export function Preload({ srcs }: { srcs: readonly string[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      {srcs.map((s) => (
        <Img key={s} src={s} style={{ width: 1, height: 1 }} />
      ))}
    </div>
  )
}
