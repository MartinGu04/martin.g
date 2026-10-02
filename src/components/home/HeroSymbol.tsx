import { symbolGeometry } from '@/components/brand/symbolPath'
import styles from './HeroSymbol.module.css'

/**
 * The hero's one brand device: the MG symbol drawn as hairlines (its own outline, from the
 * approved vector), very faint, cropped by the frame at the inline end and lit by the key
 * light. It draws in once on arrival and then rests; without scripting or with reduced
 * motion it is simply there. Decorative: hidden from assistive technology and on phones.
 * Brand artwork is never mirrored, so it reads the same in Hebrew.
 */
export function HeroSymbol() {
  const { d, width, height } = symbolGeometry()
  return (
    <svg
      className={styles.symbol}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} pathLength={1} className={styles.line} />
    </svg>
  )
}
