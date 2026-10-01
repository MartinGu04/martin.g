import type { HexColor } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import styles from './Thread.module.css'

/**
 * The thread: one short hairline that runs through the homepage and carries each world's
 * color into the next (the bridge's white into ON's gold, ON's gold into the amber of
 * המחלבה, and on to the cold steel of Defense Systems, the process, the capabilities and
 * About, resolving in the closing scene). It draws in from the inline start as its scene
 * arrives: same builder, different world. Decorative; static without motion.
 */
export function Thread({
  from,
  to,
  className,
}: {
  from: HexColor
  to: HexColor
  className?: string
}) {
  const style: StyleWithVars = { '--thread-from': from, '--thread-to': to }
  return (
    <span
      className={[styles.thread, className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    />
  )
}
