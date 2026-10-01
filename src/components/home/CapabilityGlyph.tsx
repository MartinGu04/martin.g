import type { ReactNode } from 'react'
import type { CapabilityKey } from '@/i18n/dictionaries/showcase'

/**
 * One small glyph per capability, drawn on the same 24-unit grid as the rest of MARTIN.G:
 * hairline strokes, square nodes, orthogonal paths, no fills beyond a node, no gradients.
 * Each is a quiet construction of what the discipline does (a point finding its
 * direction, a frame inside a frame, three joined nodes, stacked layers, a stepped path, a
 * mark inside a field). Decorative: the name beside it carries the meaning.
 */
const GLYPHS: Record<CapabilityKey, ReactNode> = {
  // From a problem (a point) to a clear direction (a node at the end of a line).
  'product-strategy': (
    <>
      <circle cx="5" cy="19" r="1.5" />
      <path d="M6.5 17.5 17 7" />
      <rect x="16" y="4" width="4" height="4" />
    </>
  ),
  // An interface: a frame, its header and one block of content.
  'product-design': (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" />
      <path d="M3.5 8.5h17" />
      <rect x="7" y="11.5" width="6" height="5" />
    </>
  ),
  // Structure: three nodes, joined orthogonally.
  'system-design': (
    <>
      <rect x="3" y="3" width="5" height="5" />
      <rect x="16" y="3" width="5" height="5" />
      <rect x="9.5" y="16" width="5" height="5" />
      <path d="M8 5.5h8M5.5 8v5.5H12V16M18.5 8v5.5H12" />
    </>
  ),
  // Building: layers stacked into one working whole.
  engineering: (
    <>
      <path d="M4 7.5 12 4l8 3.5-8 3.5z" />
      <path d="M4 12l8 3.5 8-3.5M4 16.5 12 20l8-3.5" />
    </>
  ),
  // Real operational work: a stepped path through its stations.
  'operational-workflows': (
    <>
      <path d="M3 6h7v6h6v6h5" />
      <rect x="8.5" y="4.5" width="3" height="3" />
      <rect x="14.5" y="10.5" width="3" height="3" />
      <rect x="19.5" y="16.5" width="3" height="3" />
    </>
  ),
  // Identity within an experience: a mark held in its field.
  'brand-experience': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 16.5 12 12 16.5 7.5 12z" />
    </>
  ),
}

export function CapabilityGlyph({ name, className }: { name: CapabilityKey; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  )
}
