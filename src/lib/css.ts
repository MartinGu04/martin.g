import type { CSSProperties } from 'react'

/** Inline styles that may also set CSS custom properties. */
export type StyleWithVars = CSSProperties & { [key: `--${string}`]: string | number }
