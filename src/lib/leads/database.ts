/*
 * The `public.leads` table as the Supabase client sees it, in the shape `supabase gen types`
 * produces, kept to the one table the site uses. The schema itself is
 * supabase/migrations/20261003105852_leads.sql; change both together.
 */

export const leadStatuses = ['new', 'contacted', 'talking', 'proposal_sent', 'won', 'lost'] as const
export type LeadStatus = (typeof leadStatuses)[number]

export const notificationStatuses = ['pending', 'sent', 'failed'] as const
export type NotificationStatus = (typeof notificationStatuses)[number]

// A type alias, not an interface: the client's generic schema needs an index-compatible type.
export type LeadRow = {
  id: string
  created_at: string
  updated_at: string
  locale: string
  name: string
  email: string
  phone: string | null
  kind: string | null
  description: string
  business: string | null
  link: string | null
  timeline: string | null
  status: LeadStatus
  dedupe_key: string
  notification_status: NotificationStatus
  notification_sent_at: string | null
}

type Defaulted = 'id' | 'created_at' | 'updated_at' | 'status' | 'notification_status'
type Optional =
  Defaulted | 'phone' | 'kind' | 'business' | 'link' | 'timeline' | 'notification_sent_at'

export type LeadInsert = Omit<LeadRow, Optional> & Partial<Pick<LeadRow, Optional>>

export type LeadUpdate = Partial<LeadRow>

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow
        Insert: LeadInsert
        Update: LeadUpdate
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
