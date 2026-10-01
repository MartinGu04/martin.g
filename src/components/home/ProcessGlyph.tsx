import type { ReactNode } from 'react'
import type { ProcessStepKey } from '@/i18n/dictionaries/home'

/**
 * One quiet line glyph per stage of the process, on the same 24-unit grid as the
 * capability glyphs: thin strokes, square nodes, no fills beyond a node. Abstract, not
 * clip art: a focus being found, a boundary being set, a grid taking structure, modules
 * joined into one, a path returning to itself. They take the step's own color, so they
 * brighten with it when it becomes current. Decorative: the word carries the meaning.
 */
const GLYPHS: Record<ProcessStepKey, ReactNode> = {
  // Understand: observation, a focus with its four bearings.
  understand: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
      <rect x="11" y="11" width="2" height="2" />
    </>
  ),
  // Define: a boundary set by its corners, a point fixed inside it.
  define: (
    <>
      <path d="M3.5 8.5v-5h5M15.5 3.5h5v5M20.5 15.5v5h-5M8.5 20.5h-5v-5" />
      <path d="M12 9.5v5M9.5 12h5" />
    </>
  ),
  // Design: structured geometry, a grid with one cell resolved.
  design: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <path d="M9.17 3.5v17M14.83 3.5v17M3.5 9.17h17M3.5 14.83h17" />
      <rect x="10.17" y="10.17" width="3.66" height="3.66" />
    </>
  ),
  // Build: modules assembled and joined.
  build: (
    <>
      <rect x="3" y="13" width="7" height="7" />
      <rect x="14" y="13" width="7" height="7" />
      <rect x="8.5" y="3.5" width="7" height="7" />
      <path d="M10 16.5h4M12 10.5V13" />
    </>
  ),
  // Refine: iteration, a path that comes back around to its start.
  refine: (
    <>
      <path d="M19 12a7 7 0 1 1-2.05-4.95" />
      <path d="M17.5 3.5v4h-4" />
      <rect x="11" y="11" width="2" height="2" />
    </>
  ),
}

export function ProcessGlyph({ step, className }: { step: ProcessStepKey; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[step]}
    </svg>
  )
}
