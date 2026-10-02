import type { Localized, ReviewStatus } from '../config'

/**
 * Phase 6 copy: the closing scene's action, the Contact navigation and footer labels, the
 * project inquiry page, its form, errors and success state. Written for review: 'draft' in
 * both locales until Martin approves it, so the release gate (src/i18n/release-gate.ts)
 * refuses a Vercel production build meanwhile.
 *
 * Hebrew addresses the visitor in the plural or with infinitives (no gendered forms), as
 * the approved homepage copy does. Nothing here promises a response time.
 */
export const contactReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
}

export type ProjectKind = 'website' | 'product' | 'system' | 'improve' | 'unsure'
export type Timeline = 'now' | 'soon' | 'later' | 'open'

export const projectKinds: readonly ProjectKind[] = [
  'website',
  'product',
  'system',
  'improve',
  'unsure',
]
export const timelines: readonly Timeline[] = ['now', 'soon', 'later', 'open']

/** Error codes shared by the client and the server (src/lib/contact/validate.ts). */
export type ContactErrorCode =
  | 'nameRequired'
  | 'emailRequired'
  | 'emailInvalid'
  | 'goalRequired'
  | 'detailsRequired'
  | 'detailsShort'
  | 'tooLong'
  | 'linkInvalid'
  | 'optionInvalid'

export interface ContactFormCopy {
  requiredNote: string
  optional: string
  name: { label: string }
  email: { label: string; hint: string }
  kind: { legend: string; options: Readonly<Record<ProjectKind, string>> }
  goal: { label: string; hint: string }
  details: { label: string; hint: string }
  business: { label: string }
  link: { label: string; hint: string }
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
        'Tell Martin Gusin about the problem you want to solve: a website, a product or an operational system.',
    },
    page: {
      eyebrow: 'Start a project',
      title: 'Tell me about the problem.',
      lead: 'A few details are enough to begin. It takes a minute or two, and it reaches me directly.',
    },
    form: {
      requiredNote: 'Every field is required unless it is marked optional.',
      optional: 'optional',
      name: { label: 'Your name' },
      email: { label: 'Email', hint: 'For the reply. Nothing else.' },
      kind: {
        legend: 'What kind of project is this?',
        options: {
          website: 'Website or digital experience',
          product: 'A product',
          system: 'An operational system',
          improve: 'Improving something that exists',
          unsure: 'Not sure yet',
        },
      },
      goal: { label: 'What are you trying to build or improve?', hint: 'One line is enough.' },
      details: {
        label: 'What is the problem?',
        hint: 'What isn’t working today, who it affects, and what would change once it is solved.',
      },
      business: { label: 'Business or project name' },
      link: { label: 'Website or relevant link', hint: 'For example https://example.com' },
      timeline: {
        legend: 'When would you like to start?',
        options: {
          now: 'As soon as possible',
          soon: 'In the coming months',
          later: 'Later on',
          open: 'Flexible',
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
        goalRequired: 'Say in a line what you are trying to build or improve.',
        detailsRequired: 'Describe the problem in a few words.',
        detailsShort: 'A little more detail, please: at least {min} characters.',
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
      description: 'ספרו ל־Martin Gusin על הבעיה שרוצים לפתור: אתר, מוצר או מערכת תפעולית.',
    },
    page: {
      eyebrow: 'מתחילים פרויקט',
      title: 'ספרו לי על הבעיה.',
      lead: 'כמה פרטים מספיקים כדי להתחיל. זה לוקח דקה או שתיים, וזה מגיע ישירות אליי.',
    },
    form: {
      requiredNote: 'כל השדות הם חובה, חוץ מאלה שמסומנים כרשות.',
      optional: 'רשות',
      name: { label: 'שם' },
      email: { label: 'אימייל', hint: 'בשביל התשובה. לא יותר.' },
      kind: {
        legend: 'איזה סוג פרויקט זה?',
        options: {
          website: 'אתר או חוויה דיגיטלית',
          product: 'מוצר',
          system: 'מערכת תפעולית',
          improve: 'שיפור של משהו קיים',
          unsure: 'עוד לא ברור',
        },
      },
      goal: { label: 'מה רוצים לבנות או לשפר?', hint: 'שורה אחת מספיקה.' },
      details: {
        label: 'מה הבעיה?',
        hint: 'מה לא עובד היום, על מי זה משפיע, ומה ישתנה כשזה ייפתר.',
      },
      business: { label: 'שם העסק או הפרויקט' },
      link: { label: 'אתר או קישור רלוונטי', hint: 'למשל https://example.com' },
      timeline: {
        legend: 'מתי תרצו להתחיל?',
        options: {
          now: 'כמה שיותר מהר',
          soon: 'בחודשים הקרובים',
          later: 'בהמשך',
          open: 'גמיש',
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
        goalRequired: 'נא לכתוב בשורה מה רוצים לבנות או לשפר.',
        detailsRequired: 'נא לתאר את הבעיה בכמה מילים.',
        detailsShort: 'עוד קצת פרטים, בבקשה: לפחות {min} תווים.',
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
