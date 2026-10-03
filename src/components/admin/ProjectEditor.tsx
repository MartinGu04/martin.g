'use client'

import { useActionState, useState, type MouseEvent } from 'react'
import { directionOf, type Locale } from '@/i18n/config'
import {
  COPY_LABELS,
  COPY_LIMITS,
  copyErrors,
  EDITOR_LOCALES,
  isCopyComplete,
  LOCALE_CODES,
  LOCALE_NAMES,
  sameCopy,
  type CopyField,
  type EditorProject,
  type ProjectCopy,
} from '@/lib/projects/copy-rules'
import { saveProjectCopy } from '@/lib/admin/project-actions'
import { initialCopyActionState, projectFields, type CopyActionState } from '@/lib/admin/state'
import controls from './controls.module.css'
import styles from './ProjectEditor.module.css'

/*
 * One project, one editor (Phase 8C). The HE | EN switch changes only which language's
 * text fields are shown: both languages' unsaved text is kept here while switching, and
 * Save sends the shown language alone, so saving English can never change Hebrew, or the
 * reverse. Shared properties are not part of this form. Without JavaScript the switch is
 * a plain link and Save a plain form post.
 */

type Drafts = Record<Locale, ProjectCopy>

const baselineOf = (project: EditorProject, locale: Locale): ProjectCopy => {
  const saved = project.saved[locale]
  return saved ? { title: saved.title, summary: saved.summary } : project.defaults[locale]
}

function initialDrafts(project: EditorProject): Drafts {
  return Object.fromEntries(EDITOR_LOCALES.map((l) => [l, baselineOf(project, l)])) as Drafts
}

/** "HE ✓", "EN • Missing", with "Unsaved" when the text differs from what is stored. */
export function LocaleStatus({
  locale,
  complete,
  unsaved,
}: {
  locale: Locale
  complete: boolean
  unsaved?: boolean
}) {
  return (
    <span
      className={`t-small ${styles.status} ${complete ? styles.complete : styles.missing}`}
      data-locale-status={locale}
    >
      <span className={styles.code}>{LOCALE_CODES[locale]}</span>
      {complete ? (
        <>
          <span aria-hidden="true">✓</span>
          <span className="visually-hidden">{LOCALE_NAMES[locale]} complete</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">•</span> Missing
          <span className="visually-hidden"> {LOCALE_NAMES[locale]} text</span>
        </>
      )}
      {unsaved ? <span className={styles.unsaved}>Unsaved</span> : null}
    </span>
  )
}

export function ProjectEditor({
  project,
  initialLocale,
  editable,
}: {
  project: EditorProject
  initialLocale: Locale
  editable: boolean
}) {
  const [active, setActive] = useState<Locale>(initialLocale)
  const [drafts, setDrafts] = useState<Drafts>(() => initialDrafts(project))
  const [state, action, pending] = useActionState(saveProjectCopy, initialCopyActionState)

  const draft = drafts[active]
  const dir = directionOf(active)
  const dirty = (locale: Locale) => !sameCopy(drafts[locale], baselineOf(project, locale))
  // An answer about one language shows with that language; one about the form, always.
  const answer: CopyActionState | null =
    state.locale === undefined || state.locale === active ? state : null
  const local = copyErrors(draft)

  const select = (locale: Locale) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    setActive(locale)
    // Keeps the address shareable without a navigation, which would cost the unsaved text.
    window.history.replaceState(null, '', `?locale=${locale}`)
  }

  const update = (field: CopyField, value: string) =>
    setDrafts((current) => ({ ...current, [active]: { ...current[active], [field]: value } }))

  const fieldError = (field: CopyField) =>
    answer?.status === 'error' && answer.errors?.[field] ? answer.errors[field] : undefined

  return (
    <div className={styles.editor}>
      <div className={styles.top}>
        <nav aria-label="Language" className={styles.switch}>
          {EDITOR_LOCALES.map((locale) => (
            <a
              key={locale}
              href={`?locale=${locale}`}
              onClick={select(locale)}
              aria-current={locale === active ? 'true' : undefined}
              className={`t-small ${styles.segment}`}
              lang="en"
            >
              {LOCALE_CODES[locale]}
              <span className="visually-hidden"> ({LOCALE_NAMES[locale]})</span>
            </a>
          ))}
        </nav>
        <p className={styles.statuses}>
          {EDITOR_LOCALES.map((locale) => (
            <LocaleStatus
              key={locale}
              locale={locale}
              complete={isCopyComplete(drafts[locale])}
              unsaved={dirty(locale)}
            />
          ))}
        </p>
      </div>

      {/* The server's answer names a missing field; the browser's own bubble would not. */}
      <form action={action} className={styles.form} aria-labelledby="copy-heading" noValidate>
        <input type="hidden" name={projectFields.project} value={project.id} />
        <input type="hidden" name={projectFields.locale} value={active} />
        <div className={styles.formHead}>
          <h2 id="copy-heading" className={`t-label ${styles.formTitle}`}>
            {LOCALE_NAMES[active]} text
          </h2>
          <p className={`t-small ${styles.source}`}>
            {project.saved[active]
              ? 'Edited here. Saving replaces this language only.'
              : 'The site’s current text, from the code. Saving stores it for this language only.'}
          </p>
        </div>

        {(['title', 'summary'] as const).map((field) => {
          const id = `copy-${field}`
          const value = draft[field]
          const over = value.length > COPY_LIMITS[field]
          const error = fieldError(field)
          const missing = Boolean(local[field]) && !over
          const shared = {
            id,
            name: projectFields[field],
            value,
            lang: active,
            dir,
            'aria-required': true,
            readOnly: !editable,
            'aria-invalid': Boolean(error) || over || missing || undefined,
            'aria-describedby': `${id}-count${error ? ` ${id}-error` : ''}`,
          }
          return (
            <div key={field} className={controls.field}>
              <label htmlFor={id} className={`t-small ${controls.label}`}>
                {COPY_LABELS[field]} <span className={styles.lang}>({LOCALE_CODES[active]})</span>
              </label>
              {field === 'summary' ? (
                <textarea
                  {...shared}
                  rows={4}
                  onChange={(event) => update(field, event.currentTarget.value)}
                  className={`${controls.control} ${controls.area}`}
                />
              ) : (
                <input
                  {...shared}
                  type="text"
                  onChange={(event) => update(field, event.currentTarget.value)}
                  className={controls.control}
                />
              )}
              <div className={styles.fieldFoot}>
                {error ? (
                  <span
                    id={`${id}-error`}
                    className={`t-small ${controls.error} ${controls.message}`}
                  >
                    {error}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  id={`${id}-count`}
                  className={`t-small t-numeric ${styles.count} ${over ? styles.over : ''}`}
                >
                  {value.length.toLocaleString('en')} / {COPY_LIMITS[field].toLocaleString('en')}
                  <span className="visually-hidden"> characters</span>
                </span>
              </div>
            </div>
          )
        })}

        <div className={styles.actions}>
          {editable ? (
            <button
              type="submit"
              className={controls.primary}
              aria-disabled={pending || undefined}
              onClick={(event) => {
                if (pending) event.preventDefault()
              }}
            >
              {pending ? 'Saving…' : `Save ${LOCALE_NAMES[active]}`}
            </button>
          ) : null}
          <p
            role="status"
            className={`t-small ${controls.message} ${
              answer?.status === 'success'
                ? controls.success
                : answer?.status === 'error'
                  ? controls.error
                  : ''
            }`}
          >
            {answer?.message ?? ''}
          </p>
        </div>
      </form>
    </div>
  )
}
