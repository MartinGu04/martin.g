/*
 * The `public.leads` and `public.lead_notes` tables as the Supabase client sees them, in
 * the shape `supabase gen types` produces, kept to the tables the site uses. The schemas
 * are supabase/migrations/20261003105852_leads.sql and 20261003122041_lead_notes.sql;
 * change both together.
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

/** Private CRM notes (Phase 8B): plain text, never HTML. */
export const NOTE_MAX_LENGTH = 4000

export type LeadNoteRow = {
  id: string
  lead_id: string
  body: string
  created_at: string
  updated_at: string
}

export type LeadNoteInsert = Pick<LeadNoteRow, 'lead_id' | 'body'> &
  Partial<Pick<LeadNoteRow, 'id' | 'created_at' | 'updated_at'>>

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow
        Insert: LeadInsert
        Update: LeadUpdate
        Relationships: []
      }
      lead_notes: {
        Row: LeadNoteRow
        Insert: LeadNoteInsert
        Update: Partial<LeadNoteRow>
        Relationships: [
          {
            foreignKeyName: 'lead_notes_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
