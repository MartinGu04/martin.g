import type { Localized, ReviewStatus } from '../config'

/**
 * Phase 4 copy around the real project media: alternative text, captions, technical
 * annotations and the preview player's controls. Written for review, not yet approved by
 * Martin, so it is 'draft' in both locales and a Vercel production build refuses it
 * (src/i18n/release-gate.ts) until it is approved. The action labels "Visit live site" /
 * "לאתר החי" were supplied by Martin and live in the main dictionaries.
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
}

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
      he: 'קטע מאתר ON: הריטריט במספרים, ותמונה מקושתת של הנוף בגליל.',
    },
    siteMobile: {
      en: 'The ON website’s opening screen on a phone.',
      he: 'מסך הפתיחה של אתר ON בטלפון.',
    },
    film: {
      en: 'ON brand film, a silent watermarked preview: the ON mark, the retreat’s promise in short words, the Galilee and the website.',
      he: 'סרט המותג של ON, תצוגה מקדימה שקטה עם סימן מים: סמל ON, ההבטחה של הריטריט במילים קצרות, הגליל והאתר.',
    },
  },
  onCaptions: {
    siteHome: { en: 'The website, opening screen.', he: 'האתר, מסך הפתיחה.' },
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
      he: 'צוות השבוע: שבוע של משמרות, חופשות ותורנויות לכל הצוות, לפי תפקיד, בלי שמות.',
    },
    manager: {
      en: 'The manager area: coverage of the previous, current and next shift, and an emergency mode.',
      he: 'אזור המנהל: כיסוי המשמרת הקודמת, הנוכחית והבאה, ומצב חירום.',
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
      en: 'Manager area: coverage at a glance.',
      he: 'אזור המנהל: תמונת הכיסוי במבט אחד.',
    },
    mobile: { en: 'Home on a phone.', he: 'מסך הבית בטלפון.' },
  },
  about: {
    portrait: {
      en: 'Portrait of Martin Gusin in a light jacket.',
      he: 'דיוקן של Martin Gusin בז׳קט בהיר.',
    },
  },
} as const satisfies Record<string, Record<string, Localized>>
