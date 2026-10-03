import type { CapabilityKey } from '@/i18n/dictionaries/showcase'

/** A place on the homepage where a capability can be seen at work. */
export type Evidence = 'on' | 'mi-ma-mo' | 'defense'

/**
 * The capabilities on the homepage, in order, each with the work that proves it (as
 * Martin assigned it). Evidence names scenes on the same page, so every proof is a real
 * destination: ON, המחלבה, or the Internal Systems archive.
 */
export const capabilityProof: readonly { key: CapabilityKey; evidence: readonly Evidence[] }[] = [
  { key: 'product-strategy', evidence: ['on', 'mi-ma-mo'] },
  { key: 'product-design', evidence: ['on', 'mi-ma-mo'] },
  { key: 'system-design', evidence: ['mi-ma-mo', 'defense'] },
  { key: 'engineering', evidence: ['mi-ma-mo', 'defense'] },
  { key: 'operational-workflows', evidence: ['mi-ma-mo', 'defense'] },
  { key: 'brand-experience', evidence: ['on'] },
]
