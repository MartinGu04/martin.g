import { Ltr } from '@/components/type/Ltr'
import styles from './OpsBoard.module.css'

/** Lanes of scheduled blocks: [start %, length %, tone]. Abstract, not product data. */
const LANES = [
  [
    [4, 22],
    [34, 30, 'a'],
    [70, 18],
  ],
  [
    [0, 30],
    [38, 20],
    [62, 34, 'b'],
  ],
  [
    [12, 40, 'a'],
    [58, 16],
    [80, 16],
  ],
  [
    [2, 16],
    [22, 26],
    [54, 40, 'b'],
  ],
  [
    [8, 30],
    [44, 22, 'a'],
    [72, 24],
  ],
] as const

const HOURS = ['00', '04', '08', '12', '16', '20', '24']

/** Hourly load, 24 values between 0 and 1: the rhythm of a working day. */
const RHYTHM = [
  0.2, 0.15, 0.12, 0.12, 0.18, 0.35, 0.7, 0.9, 0.95, 0.85, 0.8, 0.75, 0.7, 0.8, 0.95, 0.9, 0.8,
  0.65, 0.5, 0.45, 0.5, 0.55, 0.4, 0.3,
]

/**
 * An operational fragment standing in for product imagery until the real interface
 * arrives (Phase 4): scheduling lanes on a time axis and a day's load rhythm. Entirely
 * decorative and hidden from assistive technology; it depicts no real data. Blocks fill
 * in along the time axis as the scene arrives, and lose their accent as it leaves.
 */
export function OpsBoard({ className }: { className?: string }) {
  return (
    <div className={[styles.board, className].filter(Boolean).join(' ')} aria-hidden="true">
      <div className={`t-micro t-numeric ${styles.axis}`}>
        {HOURS.map((hour) => (
          <span key={hour}>
            <Ltr>{hour}</Ltr>
          </span>
        ))}
      </div>
      {LANES.map((blocks, lane) => (
        <div key={lane} className={styles.lane}>
          <span className={`t-micro t-numeric ${styles.laneIndex}`}>
            <Ltr>{String(lane + 1).padStart(2, '0')}</Ltr>
          </span>
          <span className={styles.track}>
            {blocks.map(([start, size, tone], i) => (
              <i
                key={i}
                className={[styles.block, tone ? styles[`tone_${tone}`] : '']
                  .filter(Boolean)
                  .join(' ')}
                style={{ insetInlineStart: `${start}%`, inlineSize: `${size}%` }}
              />
            ))}
          </span>
        </div>
      ))}
      <div className={styles.rhythm}>
        {RHYTHM.map((value, hour) => (
          <i key={hour} style={{ blockSize: `${Math.round(value * 100)}%` }} />
        ))}
      </div>
      <span className={styles.scan} />
    </div>
  )
}
