import type { Localized, ReviewStatus } from '../config'

/**
 * Copy around the real project media (Phase 4, revised in 4.5): alternative text, captions,
 * technical annotations, the preview player's controls and the closing scene's word cycle.
 * Martin's Hebrew corrections are applied and the rest was reviewed for literal phrasing;
 * it stays 'draft' until Martin approves it, and a Vercel production build refuses it
 * (src/i18n/release-gate.ts) until then. The action labels "Visit live site" / "לאתר החי"
 * and the Defense Systems wording were supplied by Martin and live in the main dictionaries.
 */
export const showcaseReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
}

export interface ShowcaseCopy {
  /** Appended to external links for assistive technology. */
  opensInNewTab: string
  film: {
    title: string
    note: string
    play: string
    pause: string
  }
  miMaMo: {
    /** How the screens were made safe to publish. */
    sanitized: string
    views: { home: string; teamWeek: string; manager: string; mobile: string }
  }
  /** The closing scene's slow word cycle, from the approved positioning. Decorative. */
  contactCycle: readonly string[]
  /** What each capability means, one sentence (English supplied by Martin). */
  capabilities: Readonly<Record<CapabilityKey, string>>
}

export type CapabilityKey =
  | 'product-strategy'
  | 'product-design'
  | 'system-design'
  | 'engineering'
  | 'operational-workflows'
  | 'brand-experience'

export const showcaseCopy: Localized<ShowcaseCopy> = {
  en: {
    opensInNewTab: '(opens in a new tab)',
    film: {
      title: 'Brand film',
      note: 'Watermarked preview. Silent.',
      play: 'Play the brand film preview',
      pause: 'Pause the brand film preview',
    },
    miMaMo: {
      sanitized: 'Real product screens. Personnel names and identifying marks removed.',
      views: { home: 'Home', teamWeek: 'Team Week', manager: 'Manager area', mobile: 'Mobile' },
    },
    contactCycle: ['Product', 'System', 'Experience'],
    capabilities: {
      'product-strategy': 'From problem to a clear product direction.',
      'product-design': 'From direction to an interface designed for real use.',
      'system-design': 'From experience to structure, workflows and architecture.',
      engineering: 'From architecture to a working product.',
      'operational-workflows': 'Designing systems around real operational work.',
      'brand-experience': 'Turning identity into a coherent digital experience.',
    },
  },
  he: {
    opensInNewTab: '(נפתח בלשונית חדשה)',
    film: {
      title: 'סרט המותג',
      note: 'תצוגה מקדימה עם סימן מים. ללא קול.',
      play: 'הפעלת התצוגה המקדימה של סרט המותג',
      pause: 'השהיית התצוגה המקדימה של סרט המותג',
    },
    miMaMo: {
      sanitized: 'מסכי מוצר אמיתיים. שמות אנשי צוות וסימנים מזהים הוסרו.',
      views: { home: 'מסך הבית', teamWeek: 'צוות השבוע', manager: 'אזור המנהל', mobile: 'מובייל' },
    },
    contactCycle: ['מוצר', 'מערכת', 'חוויה'],
    capabilities: {
      'product-strategy': 'מבעיה לכיוון מוצר ברור.',
      'product-design': 'מכיוון לממשק שמעוצב לשימוש אמיתי.',
      'system-design': 'מחוויה למבנה, לתהליכי עבודה ולארכיטקטורה.',
      engineering: 'מארכיטקטורה למוצר שעובד.',
      'operational-workflows': 'מערכות שנבנות סביב עבודה תפעולית אמיתית.',
      'brand-experience': 'להפוך זהות לחוויה דיגיטלית אחת ושלמה.',
    },
  },
}

/** Alternative text and captions for every real image, per locale. */
export const mediaCopy = {
  on: {
    patisserie: {
      en: 'A hand reaching for pastries on a patisserie counter, one of the local stops on the retreat.',
      he: 'יד מושטת אל מאפים על דלפק של פטיסרי, אחת התחנות המקומיות בריטריט.',
    },
    venue: {
      en: 'The guesthouse garden: a vine pergola, a lawn and shaded terraces.',
      he: 'הגינה של בית האירוח: פרגולת גפנים, דשא ומרפסות מוצלות.',
    },
    siteHome: {
      en: 'The ON website’s opening screen: the gold ON mark over a Galilee sunset, the headline and the call to apply.',
      he: 'מסך הפתיחה של אתר ON: סמל ON הזהוב מעל שקיעה בגליל, הכותרת והקריאה לבדיקת התאמה.',
    },
    siteStory: {
      en: 'A section of the ON website: the retreat in numbers, and an arched photograph of the Galilee view.',
      he: 'קטע מאתר ON: הריטריט במספרים, ונוף הגליל בתמונה בחלון מקושת.',
    },
    siteMobile: {
      en: 'The ON website’s opening screen on a phone.',
      he: 'מסך הפתיחה של אתר ON בטלפון.',
    },
    film: {
      en: 'ON brand film, a silent watermarked preview: the ON mark, the retreat’s promise in short words, the Galilee and the website.',
      he: 'סרט המותג של ON בתצוגה מקדימה, ללא קול ועם סימן מים: סמל ON, הבטחת הריטריט במילים ספורות, נופי הגליל והאתר.',
    },
  },
  onCaptions: {
    siteHome: { en: 'The website, opening screen.', he: 'מסך הפתיחה של האתר.' },
    siteStory: { en: 'The website: the retreat in numbers.', he: 'האתר: הריטריט במספרים.' },
    siteMobile: { en: 'The website on a phone.', he: 'האתר בטלפון.' },
    venue: { en: 'The guesthouse garden.', he: 'הגינה של בית האירוח.' },
    patisserie: { en: 'A local stop on the route.', he: 'תחנה מקומית במסלול.' },
  },
  miMaMo: {
    dashboard: {
      en: 'The home screen of המחלבה: a greeting, the next shift, who is on it, reports and the week ahead.',
      he: 'מסך הבית של המחלבה: ברכה, המשמרת הבאה, מי משובץ בה, דוחות והשבוע הקרוב.',
    },
    teamWeek: {
      en: 'Team Week: a week of shifts, leave and duties for the whole team, grouped by role, names removed.',
      he: 'צוות השבוע: המשמרות, החופשות והתורנויות של כל הצוות לאורך השבוע, לפי תפקיד ובלי שמות.',
    },
    manager: {
      en: 'The manager area: a snapshot of the previous, current and next shift, alongside an emergency mode.',
      he: 'אזור המנהל: תמונת מצב של המשמרת הקודמת, הנוכחית והבאה, לצד מצב חירום.',
    },
    mobile: {
      en: 'The home screen of המחלבה on a phone.',
      he: 'מסך הבית של המחלבה בטלפון.',
    },
  },
  miMaMoCaptions: {
    dashboard: {
      en: 'Home: the next shift and the week ahead.',
      he: 'מסך הבית: המשמרת הבאה והשבוע הקרוב.',
    },
    teamWeek: { en: 'Team Week, by role.', he: 'צוות השבוע, לפי תפקיד.' },
    manager: {
      en: 'Manager area: the operational picture at a glance.',
      he: 'אזור המנהל: תמונת מצב תפעולית במבט אחד.',
    },
    mobile: { en: 'Home on a phone.', he: 'מסך הבית בטלפון.' },
  },
  about: {
    portrait: {
      en: 'Portrait of Martin Gusin in a light jacket.',
      he: 'דיוקן של מרטין גוסין בז׳קט בהיר.',
    },
  },
} as const satisfies Record<string, Record<string, Localized>>
