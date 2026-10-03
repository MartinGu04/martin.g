import type { LeadStatus, NotificationStatus } from '@/lib/leads/database'

/** The admin's words for the stored values. Dependency-free, so client forms can use them. */
export const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  talking: 'Talking',
  proposal_sent: 'Proposal sent',
  won: 'Won',
  lost: 'Lost',
}

export const notificationLabels: Record<NotificationStatus, string> = {
  sent: 'Email sent',
  pending: 'Email pending',
  failed: 'Email failed',
}
