'use client'

import { useActionState, useState } from 'react'
import { addLeadNote, updateLeadStatus } from '@/lib/admin/actions'
import { statusLabels } from '@/lib/admin/labels'
import { adminFields, initialActionState, type ActionState } from '@/lib/admin/state'
import { leadStatuses, NOTE_MAX_LENGTH, type LeadStatus } from '@/lib/leads/database'
import controls from './controls.module.css'
import styles from './LeadForms.module.css'

/*
 * The lead's two actions, each a Server Action that checks the admin itself. No optimistic
 * state: the page shows what the database holds once the action answers. Both work as
 * plain form posts without JavaScript.
 */

function Feedback({ state, id }: { state: ActionState; id: string }) {
  const tone =
    state.status === 'success' ? controls.success : state.status === 'error' ? controls.error : ''
  return (
    <p id={id} role="status" className={`t-small ${controls.message} ${tone}`}>
      {state.message ?? ''}
    </p>
  )
}

export function StatusForm({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [state, action, pending] = useActionState(updateLeadStatus, initialActionState)
  return (
    <form action={action} className={styles.status}>
      <input type="hidden" name={adminFields.leadId} value={leadId} />
      <div className={controls.field}>
        <label htmlFor="lead-status" className={`t-small ${controls.label}`}>
          Status
        </label>
        <div className={styles.inline}>
          <select
            id="lead-status"
            name={adminFields.status}
            defaultValue={status}
            key={status}
            className={controls.control}
            aria-describedby="status-feedback"
          >
            {leadStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={controls.primary}
            aria-disabled={pending || undefined}
            onClick={(event) => {
              if (pending) event.preventDefault()
            }}
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <Feedback state={state} id="status-feedback" />
    </form>
  )
}

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(addLeadNote, initialActionState)
  return (
    <form action={action} className={styles.note}>
      <input type="hidden" name={adminFields.leadId} value={leadId} />
      {/* A new key after each added note starts the next one empty; an error keeps the text. */}
      <NoteFields key={state.done ?? 0} invalid={state.status === 'error'} pending={pending} />
      <Feedback state={state} id="note-feedback" />
    </form>
  )
}

function NoteFields({ invalid, pending }: { invalid: boolean; pending: boolean }) {
  const [text, setText] = useState('')
  const over = text.length > NOTE_MAX_LENGTH
  return (
    <>
      <div className={controls.field}>
        <label htmlFor="lead-note" className={`t-small ${controls.label}`}>
          Add a note
        </label>
        <textarea
          id="lead-note"
          name={adminFields.note}
          rows={4}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          className={`${controls.control} ${controls.area}`}
          aria-describedby="note-count note-feedback"
          aria-invalid={invalid || over || undefined}
          dir="auto"
        />
      </div>
      <div className={styles.noteFooter}>
        <span
          id="note-count"
          className={`t-small t-numeric ${styles.count} ${over ? styles.over : ''}`}
        >
          {text.length.toLocaleString('en')} / {NOTE_MAX_LENGTH.toLocaleString('en')}
          <span className="visually-hidden"> characters</span>
        </span>
        <button
          type="submit"
          className={controls.secondary}
          aria-disabled={pending || undefined}
          onClick={(event) => {
            if (pending) event.preventDefault()
          }}
        >
          {pending ? 'Adding…' : 'Add note'}
        </button>
      </div>
    </>
  )
}
