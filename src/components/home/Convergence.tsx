import type { HexColor } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import styles from './Convergence.module.css'

interface Strand {
  label: string
  /** The world that strand arrives from (src/content/worlds.ts, `thread`). */
  color: HexColor
}

// Three orthogonal strands from the inline end, meeting at one node, then one line on
// to the invitation, ending in the thread's open square. Drawn left to right in a
// 600 x 300 field with the strands' origins on the right; mirrored in RTL.
const STRANDS = [
  'M600 60H440V110H300V150H230',
  'M600 150H230',
  'M600 240H400V200H300V150H230',
] as const
const MEET = { x: 230, y: 150 }
const END = 24

/**
 * The closing scene's resolution: product, system and experience arrive as three strands
 * in the colors of the worlds that showed them (המחלבה's amber, the steel of Defense
 * Systems, ON's gold), meet at one node and continue as one amber line toward the
 * invitation, ending in the open square where the thread rests. The strands draw in once
 * as the scene arrives; while the visitor stays, a short pulse travels along each toward
 * the meeting point, very slowly (an ambient loop). The words are real text; the drawing
 * is decorative.
 */
export function Convergence({
  strands,
  resolve,
}: {
  strands: readonly [Strand, Strand, Strand]
  /** The resolved thread's color. */
  resolve: HexColor
}) {
  return (
    <div className={styles.field}>
      <svg
        className={styles.svg}
        viewBox="0 0 600 300"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        {STRANDS.map((d, i) => {
          const style: StyleWithVars = { '--strand': strands[i]!.color, '--i': i }
          return (
            <g key={d} style={style}>
              <path d={d} pathLength={100} className={styles.strand} />
              <path d={d} pathLength={100} className={styles.pulse} data-loop="" />
            </g>
          )
        })}
        <path
          d={`M${MEET.x} ${MEET.y}H${END + 12}`}
          pathLength={100}
          className={styles.resolve}
          style={{ '--strand': resolve } as StyleWithVars}
        />
        <rect
          x={MEET.x - 4}
          y={MEET.y - 4}
          width={8}
          height={8}
          className={styles.meet}
          style={{ '--strand': resolve } as StyleWithVars}
        />
        <rect
          x={END}
          y={MEET.y - 6}
          width={12}
          height={12}
          className={styles.end}
          style={{ '--strand': resolve } as StyleWithVars}
        />
      </svg>
      <ul role="list" className={styles.labels}>
        {strands.map((strand, i) => (
          <li
            key={strand.label}
            className={`t-label ${styles.label}`}
            style={{ '--strand': strand.color, '--i': i } as StyleWithVars}
          >
            {strand.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
