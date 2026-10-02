'use client'

import Link from 'next/link'
import type { Route } from 'next'
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FocusEvent,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import type { Locale } from '@/i18n/config'
import {
  projectKinds,
  timelines,
  type ContactCopy,
  type ContactFormCopy,
} from '@/i18n/dictionaries/contact'
import { sendInquiry } from '@/lib/contact/action'
import { hiddenFields, initialContactState, type ContactState } from '@/lib/contact/state'
import {
  contactFields,
  emptyValues,
  errorMessage,
  hasErrors,
  validate,
  validateField,
  type ContactErrors,
  type ContactField,
  type ContactValues,
  type FieldError,
} from '@/lib/contact/validate'
import { Arrow } from '@/components/type/Arrow'
import styles from './ContactExperience.module.css'

interface ContactExperienceProps {
  locale: Locale
  page: ContactCopy['page']
  form: ContactFormCopy
  success: ContactCopy['success']
  privacyHref: Route
  workHref: Route
}

const fieldId = (field: ContactField) => `contact-${field}`
/** Where an error summary link leads: the field, or a group's first option. */
const targetId = (field: ContactField) =>
  field === 'kind'
    ? `${fieldId(field)}-${projectKinds[0]}`
    : field === 'timeline'
      ? `${fieldId(field)}-${timelines[0]}`
      : fieldId(field)

function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
}

/**
 * The project inquiry: the closing scene extended into a focused conversation. One calm
 * form, then a success state in place of it (never a redirect).
 *
 * Progressive enhancement: without JavaScript the form posts to the server action and the
 * page renders its answer (native required-field checks first, the server's own errors
 * after, values kept). With JavaScript the same action runs in place, with helpful
 * validation before sending, an error summary that takes focus and links to each field, a
 * single submission at a time, and focus moved to the outcome.
 */
export function ContactExperience({
  locale,
  page,
  form,
  success,
  privacyHref,
  workHref,
}: ContactExperienceProps) {
  // Without JavaScript the form posts to the action and the server renders its answer
  // here as `answer`. With JavaScript the form calls the same action directly (below), so
  // a lost connection becomes a "not sent" state with every value kept, never a crash.
  const [answer, formAction] = useActionState(sendInquiry, initialContactState)
  const [state, setState] = useState<ContactState>(answer)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<ContactValues>(() => answer.values ?? emptyValues)
  const [errors, setErrors] = useState<ContactErrors>(() => answer.errors ?? {})
  const [summary, setSummary] = useState<ContactErrors>(() => answer.errors ?? {})
  const [attempted, setAttempted] = useState(answer.status === 'invalid')
  const [checkTick, setCheckTick] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const submitting = useRef(false)
  const startedAt = useRef('')
  const submissionId = useRef('')
  const lastState = useRef(state)

  // Hydrated: this component validates, so the browser's own bubbles step aside; and the
  // form is usable from now on (the spam check's clock).
  useEffect(() => {
    if (formRef.current) formRef.current.noValidate = true
    startedAt.current = String(Date.now())
  }, [])

  // After each answer, focus moves to it: the success heading, the problem, or the summary.
  useEffect(() => {
    if (state === lastState.current) return
    lastState.current = state
    submitting.current = false
    const target =
      state.status === 'sent'
        ? successRef.current
        : state.status === 'invalid'
          ? summaryRef.current
          : bannerRef.current
    target?.focus()
  }, [state])

  // After the form's own check finds problems, focus moves to their summary.
  useEffect(() => {
    if (checkTick > 0) summaryRef.current?.focus()
  }, [checkTick])

  if (state.status === 'sent') {
    return (
      <div className={styles.success}>
        <p className="t-label muted">{page.eyebrow}</p>
        <h1 ref={successRef} tabIndex={-1} className={`t-display ${styles.successTitle}`}>
          {success.title}
        </h1>
        <p className={`t-lead ${styles.successBody}`}>{success.body}</p>
        <Link href={workHref} className={`t-action ${styles.back}`}>
          <span>{success.back}</span>
          <Arrow />
        </Link>
      </div>
    )
  }

  const update = (field: ContactField, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    // An error already shown clears as soon as the value is acceptable.
    if (errors[field]) setErrors((current) => withField(current, field, validateField(field, next)))
  }

  const check = (field: ContactField) => (event: FocusEvent) => {
    // Leaving a field inside the group (radio to radio) is not leaving the group.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    // Before the first attempt nothing is judged on the way through the form: an error
    // appearing on blur would move the layout under a pointer that is already on its way
    // to the next field or the action.
    if (!attempted) return
    setErrors((current) => withField(current, field, validateField(field, values)))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPending || submitting.current) return
    const found = validate(values)
    setAttempted(true)
    if (hasErrors(found)) {
      setErrors(found)
      setSummary(found)
      setCheckTick((tick) => tick + 1)
      return
    }
    setErrors({})
    setSummary({})
    submitting.current = true
    // Read by the action from this submission's form data (src/lib/contact/state.ts).
    if (!submissionId.current) submissionId.current = newSubmissionId()
    const form = event.currentTarget
    setHidden(form, hiddenFields.startedAt, startedAt.current)
    setHidden(form, hiddenFields.submission, submissionId.current)
    const data = new FormData(form)
    startTransition(async () => {
      let next: ContactState
      try {
        next = await sendInquiry(state, data)
      } catch {
        next = { status: 'failed', values }
      }
      startTransition(() => {
        setState(next)
        if (next.status === 'invalid' && next.errors) {
          setErrors(next.errors)
          setSummary(next.errors)
        }
      })
    })
  }

  const message = (error: FieldError) => errorMessage(form.errors[error.code], error)
  const summaryFields = contactFields.filter((field) => summary[field])
  const showBanner = state.status === 'failed' || state.status === 'unavailable'
  const banner = state.status === 'unavailable' ? form.unavailable : form.failure

  const text = (
    field: Exclude<ContactField, 'kind' | 'timeline'>,
    copy: { label: string; hint?: string; placeholder?: string },
    options: {
      optional?: boolean
      type?: 'text' | 'email' | 'tel'
      autoComplete?: string
      inputMode?: 'text' | 'email' | 'url' | 'tel'
      dir?: 'auto' | 'ltr'
      multiline?: boolean
    } = {},
  ) => {
    const id = fieldId(field)
    const error = errors[field]
    const describedBy =
      [copy.hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
      undefined
    const shared = {
      id,
      name: field,
      value: values[field],
      required: !options.optional,
      dir: options.dir ?? 'auto',
      // An example of the answer, never the label (the label and hint stay visible).
      placeholder: copy.placeholder,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
      onBlur: check(field),
      className: styles.control,
    }
    return (
      <div className={styles.field}>
        <Label htmlFor={id} optional={options.optional ? form.optional : undefined}>
          {copy.label}
        </Label>
        {copy.hint ? (
          <p id={`${id}-hint`} className={`t-small muted ${styles.hint}`}>
            {copy.hint}
          </p>
        ) : null}
        {error ? <ErrorText id={`${id}-error`}>{message(error)}</ErrorText> : null}
        {options.multiline ? (
          <textarea
            {...shared}
            rows={6}
            className={`${styles.control} ${styles.area}`}
            onChange={(event) => update(field, event.target.value)}
          />
        ) : (
          <input
            {...shared}
            type={options.type ?? 'text'}
            autoComplete={options.autoComplete}
            inputMode={options.inputMode}
            spellCheck={options.dir === 'ltr' ? false : undefined}
            onChange={(event) => update(field, event.target.value)}
          />
        )}
      </div>
    )
  }

  const choice = <T extends string>(
    field: 'kind' | 'timeline',
    legend: string,
    keys: readonly T[],
    labels: Readonly<Record<T, string>>,
  ) => {
    const id = fieldId(field)
    const error = errors[field]
    return (
      <fieldset
        className={styles.choice}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={check(field)}
      >
        <legend className={styles.legend}>
          <Label as="span" optional={form.optional}>
            {legend}
          </Label>
        </legend>
        {error ? <ErrorText id={`${id}-error`}>{message(error)}</ErrorText> : null}
        <div className={styles.options}>
          {keys.map((key) => (
            <label key={key} className={`t-body ${styles.option}`}>
              <input
                type="radio"
                id={`${id}-${key}`}
                name={field}
                value={key}
                checked={values[field] === key}
                onChange={() => update(field, key)}
                className={styles.radio}
              />
              <span>{labels[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  return (
    <>
      <div className={styles.intro}>
        <p className="t-label muted">{page.eyebrow}</p>
        <h1 className={`t-heading-1 ${styles.title}`}>{page.title}</h1>
        <p className={`t-lead muted ${styles.lead}`}>{page.lead}</p>
      </div>

      <div className={styles.panel}>
        <span className={styles.thread} aria-hidden="true" />
        {showBanner ? (
          <div
            ref={bannerRef}
            tabIndex={-1}
            className={styles.banner}
            aria-labelledby="contact-banner-title"
          >
            <h2 id="contact-banner-title" className={`t-body-l ${styles.bannerTitle}`}>
              {banner.title}
            </h2>
            <p className="t-body">{banner.body}</p>
          </div>
        ) : null}
        {summaryFields.length > 0 ? (
          <div
            ref={summaryRef}
            tabIndex={-1}
            className={styles.summary}
            aria-labelledby="contact-summary-title"
          >
            <h2 id="contact-summary-title" className={`t-body-l ${styles.summaryTitle}`}>
              {form.summaryTitle}
            </h2>
            <ul role="list" className={styles.summaryList}>
              {summaryFields.map((field) => (
                <li key={field}>
                  <a
                    href={`#${targetId(field)}`}
                    className="t-body"
                    onClick={(event: MouseEvent) => {
                      const target = document.getElementById(targetId(field))
                      if (!target) return
                      event.preventDefault()
                      target.focus()
                    }}
                  >
                    {message(summary[field]!)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <form
          ref={formRef}
          action={formAction}
          onSubmit={onSubmit}
          className={styles.form}
          aria-describedby="contact-required-note"
        >
          <p id="contact-required-note" className="t-small muted">
            {form.requiredNote}
          </p>
          <input type="hidden" name={hiddenFields.locale} value={locale} />
          <input type="hidden" name={hiddenFields.startedAt} defaultValue="" />
          <input type="hidden" name={hiddenFields.submission} defaultValue="" />
          <div className={styles.trap} aria-hidden="true">
            <label htmlFor="contact-trap">{form.trap}</label>
            <input
              id="contact-trap"
              type="text"
              name={hiddenFields.trap}
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>

          <div className={styles.pair}>
            {text('name', form.name, { autoComplete: 'name' })}
            {text('email', form.email, {
              type: 'email',
              autoComplete: 'email',
              inputMode: 'email',
              dir: 'ltr',
            })}
          </div>
          <div className={styles.pair}>
            {text('phone', form.phone, {
              optional: true,
              type: 'tel',
              autoComplete: 'tel',
              inputMode: 'tel',
              dir: 'ltr',
            })}
          </div>
          {choice('kind', form.kind.legend, projectKinds, form.kind.options)}
          {text('description', form.description, { multiline: true })}
          <div className={styles.pair}>
            {text('business', form.business, { optional: true, autoComplete: 'organization' })}
            {text('link', form.link, {
              optional: true,
              autoComplete: 'url',
              inputMode: 'url',
              dir: 'ltr',
            })}
          </div>
          {choice('timeline', form.timeline.legend, timelines, form.timeline.options)}

          <div className={styles.actions}>
            <button
              type="submit"
              className={`t-action ${styles.submit}`}
              aria-disabled={isPending ? true : undefined}
            >
              <span>{isPending ? form.pending : form.submit}</span>
              <Arrow />
            </button>
            <p className={`t-small muted ${styles.note}`}>
              {form.privacyNote}{' '}
              <Link href={privacyHref} className={styles.inline}>
                {form.privacyLink}
              </Link>
            </p>
          </div>
          <p className="visually-hidden" role="status">
            {isPending ? form.pending : ''}
          </p>
        </form>
      </div>
    </>
  )
}

function setHidden(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name)
  if (input instanceof HTMLInputElement) input.value = value
}

function withField(
  errors: ContactErrors,
  field: ContactField,
  error: FieldError | undefined,
): ContactErrors {
  const next = { ...errors }
  if (error) next[field] = error
  else delete next[field]
  return next
}

function Label({
  children,
  htmlFor,
  optional,
  as = 'label',
}: {
  children: ReactNode
  htmlFor?: string
  optional?: string | undefined
  as?: 'label' | 'span'
}) {
  const content = (
    <>
      {children}
      {optional ? <span className={styles.optional}> ({optional})</span> : null}
    </>
  )
  return as === 'label' ? (
    <label htmlFor={htmlFor} className={`t-body ${styles.label}`}>
      {content}
    </label>
  ) : (
    <span className={`t-body ${styles.label}`}>{content}</span>
  )
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={`t-small ${styles.error}`}>
      <span className={styles.errorMark} aria-hidden="true" />
      {children}
    </p>
  )
}
