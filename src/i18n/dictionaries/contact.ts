import type { Localized, ReviewStatus } from '../config'

/**
 * Phase 6 copy: the closing scene's action, the Contact navigation and footer labels, the
 * project inquiry page, its form, errors and success state. Written for review: 'draft' in
 * both locales until Martin approves it, so the release gate (src/i18n/release-gate.ts)
 * refuses a Vercel production build meanwhile.
 *
 * Hebrew addresses the visitor in the plural or with infinitives, as the approved homepage
 * copy does. The form's labels, hints, placeholders and options (revised in Phase 6 to speak
 * a client's language rather than product terminology) are Martin's own wording. Nothing
 * here promises a response time.
 */
export const contactReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
}

export type ProjectKind = 'website' | 'landing' | 'app' | 'existing' | 'other'
export type Timeline = 'asap' | 'month' | 'quarter' | 'later' | 'undecided'

export const projectKinds: readonly ProjectKind[] = [
  'website',
  'landing',
  'app',
  'existing',
  'other',
]
export const timelines: readonly Timeline[] = ['asap', 'month', 'quarter', 'later', 'undecided']

/** Error codes shared by the client and the server (src/lib/contact/validate.ts). */
export type ContactErrorCode =
  | 'nameRequired'
  | 'emailRequired'
  | 'emailInvalid'
  | 'phoneInvalid'
  | 'descriptionRequired'
  | 'tooLong'
  | 'linkInvalid'
  | 'optionInvalid'

/**
 * A field's visible label, and optionally a hint under it and a placeholder inside it.
 * Placeholders only show the kind of answer that belongs there; they never replace the
 * label or the hint.
 */
interface FieldCopy {
  label: string
  hint?: string
  placeholder?: string
}

export interface ContactFormCopy {
  requiredNote: string
  optional: string
  name: FieldCopy
  email: FieldCopy
  phone: FieldCopy
  kind: { legend: string; options: Readonly<Record<ProjectKind, string>> }
  description: FieldCopy
  business: FieldCopy
  link: FieldCopy
  timeline: { legend: string; options: Readonly<Record<Timeline, string>> }
  /** The spam trap's label, read only by software that fills every field. */
  trap: string
  submit: string
  pending: string
  /** Shown beside the action: what the details are used for, then a link to Privacy. */
  privacyNote: string
  privacyLink: string
  summaryTitle: string
  errors: Readonly<Record<ContactErrorCode, string>>
  failure: { title: string; body: string }
  unavailable: { title: string; body: string }
}

export interface ContactCopy {
  /** The closing scene's primary action. */
  cta: string
  /** Header and footer label for the inquiry page. */
  nav: string
  footer: { label: string; privacy: string; accessibility: string }
  seo: { title: string; description: string }
  page: { eyebrow: string; title: string; lead: string }
  form: ContactFormCopy
  success: { title: string; body: string; back: string }
}

export const contactCopy: Localized<ContactCopy> = {
  en: {
    cta: 'Start a project',
    nav: 'Contact',
    footer: { label: 'Site', privacy: 'Privacy', accessibility: 'Accessibility' },
    seo: {
      title: 'Start a project',
      description:
        'Tell Martin Gusin about what you want to create: a website, a landing page, a system or an app.',
    },
    page: {
      eyebrow: 'Start a project',
      title: 'Tell me a little about what you want to create.',
      lead: 'A few details are enough to begin. You don’t need to have everything figured out.',
    },
    form: {
      requiredNote: 'Every field is required unless it is marked optional.',
      optional: 'optional',
      name: { label: 'Name', placeholder: 'Your name' },
      email: {
        label: 'Email',
        hint: 'So I can get back to you.',
        placeholder: 'name@example.com',
      },
      phone: {
        label: 'Phone',
        hint: 'If you’re comfortable with me getting back to you by phone.',
        placeholder: '050-1234567',
      },
      kind: {
        legend: 'What kind of project is it?',
        options: {
          website: 'Website',
          landing: 'Landing page',
          app: 'System / app',
          existing: 'I have an existing website or system',
          other: 'Something else / Not sure yet',
        },
      },
      description: {
        label: 'Tell me a little about the project',
        hint: 'What do you want to create, who is it for, and what should it help you do?',
        placeholder:
          'For example: I’m starting a new business and want a clear, professional website that explains what I offer and helps people find me.',
      },
      business: { label: 'Business or project name', placeholder: 'For example: Studio North' },
      link: { label: 'Existing website or relevant link', placeholder: 'https://example.com' },
      timeline: {
        legend: 'When would you like to start?',
        options: {
          asap: 'As soon as possible',
          month: 'Within the next month',
          quarter: 'Within 1–3 months',
          later: 'More than 3 months from now',
          undecided: 'No date yet',
        },
      },
      trap: 'Leave this field empty',
      submit: 'Send',
      pending: 'Sending…',
      privacyNote: 'Your details are used only to reply to you.',
      privacyLink: 'Privacy',
      summaryTitle: 'A few details need another look:',
      errors: {
        nameRequired: 'Enter your name.',
        emailRequired: 'Enter your email address.',
        emailInvalid: 'Enter an email address like name@example.com.',
        phoneInvalid: 'Enter a phone number, like 050-1234567.',
        descriptionRequired: 'Tell me a few words about the project.',
        tooLong: 'Keep this under {max} characters.',
        linkInvalid: 'Enter a full link, like https://example.com.',
        optionInvalid: 'Choose one of the options.',
      },
      failure: {
        title: 'The message wasn’t sent.',
        body: 'Something went wrong on the way. Your details are still here, so you can try again.',
      },
      unavailable: {
        title: 'Sending isn’t available right now.',
        body: 'Your details are still here. Please try again a little later.',
      },
    },
    success: {
      title: 'Got it.',
      body: 'Your message reached me. The reply will come to the email you left.',
      back: 'Back to the work',
    },
  },
  he: {
    cta: 'מתחילים פרויקט',
    nav: 'יצירת קשר',
    footer: { label: 'האתר', privacy: 'פרטיות', accessibility: 'נגישות' },
    seo: {
      title: 'מתחילים פרויקט',
      description: 'ספרו ל־Martin Gusin על מה שאתם רוצים ליצור: אתר, דף נחיתה, מערכת או אפליקציה.',
    },
    page: {
      eyebrow: 'מתחילים פרויקט',
      title: 'ספרו לי קצת על מה שאתם רוצים ליצור.',
      lead: 'כמה פרטים מספיקים כדי להתחיל. לא צריך להגיע עם הכול סגור.',
    },
    form: {
      requiredNote: 'כל השדות הם חובה, חוץ מאלה שמסומנים כרשות.',
      optional: 'רשות',
      name: { label: 'שם', placeholder: 'איך קוראים לכם?' },
      email: { label: 'אימייל', hint: 'כדי שאוכל לחזור אליכם.', placeholder: 'name@example.com' },
      phone: {
        label: 'טלפון',
        hint: 'אם נוח לכם שאחזור גם בטלפון.',
        placeholder: '050-1234567',
      },
      kind: {
        legend: 'איזה סוג פרויקט זה?',
        options: {
          website: 'אתר',
          landing: 'דף נחיתה',
          app: 'מערכת / אפליקציה',
          existing: 'יש לי אתר או מערכת קיימים',
          other: 'משהו אחר / עוד לא בטוח',
        },
      },
      description: {
        label: 'ספרו לי קצת על הפרויקט',
        hint: 'מה אתם רוצים ליצור, למי זה מיועד, ומה חשוב לכם שהוא יעשה?',
        placeholder:
          'לדוגמה: אני פותח עסק חדש ורוצה אתר ברור ומקצועי שיציג מה אני מציע ויעזור לאנשים להגיע אליי.',
      },
      business: { label: 'שם העסק או הפרויקט', placeholder: 'לדוגמה: Studio North' },
      link: { label: 'אתר קיים או קישור רלוונטי', placeholder: 'https://example.com' },
      timeline: {
        legend: 'מתי הייתם רוצים להתחיל?',
        options: {
          asap: 'בהקדם',
          month: 'בחודש הקרוב',
          quarter: 'תוך 1–3 חודשים',
          later: 'בעוד יותר מ־3 חודשים',
          undecided: 'עדיין אין תאריך',
        },
      },
      trap: 'יש להשאיר את השדה הזה ריק',
      submit: 'שליחה',
      pending: 'בשליחה…',
      privacyNote: 'הפרטים משמשים רק כדי לחזור אליכם.',
      privacyLink: 'פרטיות',
      summaryTitle: 'כמה פרטים דורשים תיקון:',
      errors: {
        nameRequired: 'נא למלא שם.',
        emailRequired: 'נא למלא כתובת אימייל.',
        emailInvalid: 'נא למלא כתובת אימייל תקינה, למשל name@example.com.',
        phoneInvalid: 'נא למלא מספר טלפון, למשל 050-1234567.',
        descriptionRequired: 'נא לכתוב כמה מילים על הפרויקט.',
        tooLong: 'עד {max} תווים, בבקשה.',
        linkInvalid: 'נא למלא קישור מלא, למשל https://example.com.',
        optionInvalid: 'נא לבחור אחת מהאפשרויות.',
      },
      failure: {
        title: 'ההודעה לא נשלחה.',
        body: 'משהו השתבש בדרך. הפרטים עדיין כאן, ואפשר לנסות שוב.',
      },
      unavailable: {
        title: 'השליחה לא זמינה כרגע.',
        body: 'הפרטים עדיין כאן. אפשר לנסות שוב מעט מאוחר יותר.',
      },
    },
    success: {
      title: 'קיבלתי.',
      body: 'ההודעה הגיעה אליי. התשובה תגיע לאימייל שהשארתם.',
      back: 'חזרה לעבודות',
    },
  },
}
