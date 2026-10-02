/**
 * The shape of the Privacy and Accessibility pages (Phase 6): a short lead, then sections
 * of plain paragraphs and lists. A section may end with one link to another page of the
 * site (the contact page, Privacy or Accessibility), never to an outside address.
 */
export type TrustPage = 'contact' | 'privacy' | 'accessibility'

export interface TrustSection {
  heading: string
  body: readonly string[]
  list?: readonly string[]
  action?: { label: string; page: TrustPage }
}

export interface TrustPageCopy {
  seo: { title: string; description: string }
  eyebrow: string
  title: string
  lead: string
  updated: string
  sections: readonly TrustSection[]
}
