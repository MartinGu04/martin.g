import type { Localized, ReviewStatus } from '../config'

/**
 * The ON case study (Phase 5A): chapter copy, decisions, labels, metadata and the
 * alternative text of every detail. Written for Martin's review in both locales and NOT
 * approved yet: while either locale is 'draft' a Vercel production build refuses it
 * (src/i18n/release-gate.ts); preview and local builds are unaffected.
 *
 * Everything here describes what the real material shows: the live site's own words are
 * quoted, the format is the one the site states, and nothing is claimed as a result that
 * is not objectively true (the site is live, on desktop and mobile).
 */
export const caseOnReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
}

export type OnChapterKey =
  'context' | 'problem' | 'direction' | 'website' | 'decisions' | 'film' | 'details' | 'result'

export type OnDecisionKey = 'language' | 'rhythm' | 'place' | 'exclusive' | 'application' | 'mobile'

export type OnDetailKey = 'ribbon' | 'numerals' | 'eyebrow' | 'actions' | 'mobileAction'

export type OnSwatchKey = 'cream' | 'blush' | 'bordeaux' | 'wine' | 'gold' | 'ink'

interface Plate {
  label: string
  note: string
}

export interface OnCaseCopy {
  seo: { title: string; description: string }
  ui: {
    caseStudy: string
    allWork: string
    chapters: string
    next: string
    platform: string
    platformValue: string
    status: string
    statusValue: string
  }
  opening: { statement: string }
  /** Short chapter names, for the chapter index and each chapter's marker. */
  chapters: Readonly<Record<OnChapterKey, string>>
  context: {
    heading: string
    body: readonly string[]
    formatLabel: string
    format: readonly { value: string; label: string }[]
  }
  problem: { heading: string; not: readonly string[]; resolution: string }
  direction: {
    heading: string
    intro: string
    monogram: Plate
    palette: Plate & { swatches: Readonly<Record<OnSwatchKey, string>> }
    type: Plate
    photography: Plate
    shape: Plate
  }
  website: {
    heading: string
    intro: string
    structure: Plate & { items: readonly string[]; action: string }
    rhythm: Plate
    mobile: { label: string; body: string }
  }
  decisions: {
    heading: string
    items: Readonly<
      Record<
        OnDecisionKey,
        {
          title: string
          body: string
          /** The site's own words; `original` is the Hebrew, shown beside a translation. */
          quote?: { text: string; original?: string }
        }
      >
    >
  }
  film: { heading: string; line: string }
  details: { heading: string; items: Readonly<Record<OnDetailKey, string>> }
  result: { heading: string; body: string }
}

export const caseOnCopy: Localized<OnCaseCopy> = {
  en: {
    seo: {
      title: 'ON, a dating retreat brand and website',
      description:
        'Case study: the brand and website of ON, a boutique dating retreat in the Galilee. The direction, the key decisions and the live site on desktop and mobile.',
    },
    ui: {
      caseStudy: 'Case study',
      allWork: 'All work',
      chapters: 'Chapters',
      next: 'Next project',
      platform: 'Platform',
      platformValue: 'Website in Hebrew, desktop and mobile',
      status: 'Status',
      statusValue: 'Live',
    },
    opening: {
      statement:
        'A brand and website for a boutique dating retreat in the Galilee, made to feel like the retreat itself: warm, unhurried and real.',
    },
    chapters: {
      context: 'The context',
      problem: 'The problem',
      direction: 'Direction',
      website: 'From brand to website',
      decisions: 'Key decisions',
      film: 'Film',
      details: 'Details',
      result: 'Result',
    },
    context: {
      heading: 'Two days in the Galilee, for people ready to meet for real.',
      body: [
        'ON is a boutique dating retreat: a small, balanced group of single women and men, two days in the Upper Galilee, with wine, food and real time to get to know each other.',
        'The website is where people meet it first. It had to carry what the retreat promises: quality, warmth, trust and human connection, at a premium level.',
      ],
      formatLabel: 'The format, as the site presents it',
      format: [
        { value: 'Two days', label: 'of shared experience in the Galilee' },
        { value: '24', label: 'participants only, an intimate group' },
        { value: '12 + 12', label: 'women and men, a balanced group' },
        { value: '30+', label: 'single women and men, aged 30 and up' },
      ],
    },
    problem: {
      heading: 'The challenge was mostly what it must not be.',
      not: [
        'A dating app.',
        'A generic event page.',
        'A wedding website.',
        'A wellness landing page.',
      ],
      resolution:
        'It had to attract the right people, and make the retreat feel real, intimate and intentional before anyone arrived.',
    },
    direction: {
      heading: 'Quiet luxury, in warm materials.',
      intro:
        'The identity rests on a few materials: a gold monogram, the colors of wine and evening light, a serif voice for the questions that matter, and photographs of real places.',
      monogram: { label: 'Monogram', note: 'Two letters, tied by one ribbon line.' },
      palette: {
        label: 'Palette',
        note: 'Sampled from the live site and the monogram.',
        swatches: {
          cream: 'Cream',
          blush: 'Blush',
          bordeaux: 'Bordeaux',
          wine: 'Wine',
          gold: 'Gold',
          ink: 'Ink',
        },
      },
      type: {
        label: 'Type',
        note: 'A serif voice for the questions, a script for the signature under the mark.',
      },
      photography: { label: 'Photography', note: 'Real places and real moments.' },
      shape: { label: 'The arch', note: 'One soft arch, used as a window onto the view.' },
    },
    website: {
      heading: 'From brand identity to a working website.',
      intro:
        'A Hebrew, right-to-left website, from the opening question to the suitability check, on desktop and on a phone.',
      structure: {
        label: 'Structure',
        note: 'Six destinations, and one action that stays in reach.',
        items: [
          'The experience',
          'Bella’s house',
          'The schedule',
          'The winery',
          'About me',
          'Questions',
        ],
        action: 'Check your fit',
      },
      rhythm: {
        label: 'Rhythm',
        note: 'The retreat in numbers, then a short heading, one sentence and a view through an arch.',
      },
      mobile: {
        label: 'On a phone',
        body: 'The opening is recomposed for the phone, not shrunk: the mark leads, the question sets over four lines, and the action spans the bottom of the screen.',
      },
    },
    decisions: {
      heading: 'Six decisions that shaped it.',
      items: {
        language: {
          title: 'Outside the language of dating apps',
          body: 'The opening screen leads with a question, and its supporting line says what the retreat is not.',
          quote: {
            text: 'No swipes. Just meeting for real.',
            original: 'בלי סוויפים. פשוט להיפגש באמת.',
          },
        },
        rhythm: {
          title: 'A softer, editorial rhythm',
          body: 'The story section gives each idea room: a short heading, one sentence in bordeaux and a single supporting line.',
        },
        place: {
          title: 'The Galilee as part of the story',
          body: 'The opening screen names the date and the place, and the place has chapters of its own: the house and the winery.',
        },
        exclusive: {
          title: 'Exclusive, and still warm',
          body: 'The limits are stated plainly: 24 participants, 12 women and 12 men, aged 30 and up. Each number sits under a soft icon, with a short line beneath it.',
        },
        application: {
          title: 'An application that feels intentional',
          body: 'The action is a suitability check, not a booking: a short questionnaire, no payment and no commitment. The same button also sits in the site’s header.',
        },
        mobile: {
          title: 'One identity, desktop and phone',
          body: 'On a phone the gold mark still opens the page, over evening light, with the same spaced line beneath it.',
        },
      },
    },
    film: {
      heading: 'The brand in motion.',
      line: 'The mark, the promise in a few words, the Galilee and the website, in one short film.',
    },
    details: {
      heading: 'Up close.',
      items: {
        ribbon: 'The ribbon line that ties the two letters',
        numerals: 'Numbers in the site’s serif, a small, light plus and a soft icon',
        eyebrow: 'A spaced line before the headline',
        actions: 'One action, cream on the evening photograph and bordeaux on cream',
        mobileAction: 'On a phone, the action spans the screen',
      },
    },
    result: {
      heading: 'From identity to launch.',
      body: 'The identity and the website became one complete digital experience, live and available on desktop and mobile.',
    },
  },
  he: {
    seo: {
      title: 'ON, מותג ואתר לריטריט היכרויות',
      description:
        'חקר מקרה: המותג והאתר של ON, ריטריט היכרויות בוטיק בגליל. הכיוון, ההחלטות המרכזיות והאתר החי בדסקטופ ובמובייל.',
    },
    ui: {
      caseStudy: 'חקר מקרה',
      allWork: 'כל העבודות',
      chapters: 'פרקים',
      next: 'הפרויקט הבא',
      platform: 'פלטפורמה',
      platformValue: 'אתר בעברית, דסקטופ ומובייל',
      status: 'סטטוס',
      statusValue: 'באוויר',
    },
    opening: {
      statement:
        'מותג ואתר לריטריט היכרויות בוטיק בגליל, שמרגישים כמו הריטריט עצמו: חמים, רגועים ואמיתיים.',
    },
    chapters: {
      context: 'ההקשר',
      problem: 'הבעיה',
      direction: 'הכיוון',
      website: 'ממותג לאתר',
      decisions: 'החלטות מרכזיות',
      film: 'הסרט',
      details: 'פרטים',
      result: 'התוצאה',
    },
    context: {
      heading: 'יומיים בגליל, לאנשים שרוצים להכיר באמת.',
      body: [
        'ON הוא ריטריט היכרויות בוטיק: קבוצה קטנה ומאוזנת של רווקות ורווקים, יומיים בגליל העליון, עם יין, אוכל וזמן אמיתי להכיר.',
        'האתר הוא המקום הראשון שבו פוגשים אותו. הוא היה צריך לשאת את מה שהריטריט מבטיח: איכות, חום, אמון וחיבור אנושי, ברמה של פרימיום.',
      ],
      formatLabel: 'הפורמט, כפי שהאתר מציג אותו',
      format: [
        { value: 'יומיים', label: 'של חוויה משותפת בגליל' },
        { value: '24', label: 'משתתפים בלבד, קבוצה אינטימית' },
        { value: '12 + 12', label: 'נשים וגברים, בקבוצה מאוזנת' },
        { value: '30+', label: 'רווקים ורווקות, מגיל 30 ומעלה' },
      ],
    },
    problem: {
      heading: 'האתגר היה בעיקר במה שאסור לו להיות.',
      not: ['אפליקציית היכרויות.', 'עמוד אירוע גנרי.', 'אתר חתונה.', 'דף נחיתה של וולנס.'],
      resolution:
        'הוא היה צריך למשוך את האנשים הנכונים, ולגרום לריטריט להרגיש אמיתי, אינטימי ומכוון עוד לפני שמישהו מגיע.',
    },
    direction: {
      heading: 'יוקרה שקטה, בחומרים חמים.',
      intro:
        'הזהות נשענת על כמה חומרים: מונוגרמה זהובה, צבעי יין ואור ערב, קול סריפי לשאלות החשובות, וצילומים של מקומות אמיתיים.',
      monogram: { label: 'מונוגרמה', note: 'שתי אותיות, קשורות בקו סרט אחד.' },
      palette: {
        label: 'פלטה',
        note: 'נדגמה מהאתר החי ומהמונוגרמה.',
        swatches: {
          cream: 'שמנת',
          blush: 'ורוד עתיק',
          bordeaux: 'בורדו',
          wine: 'יין',
          gold: 'זהב',
          ink: 'דיו',
        },
      },
      type: { label: 'טיפוגרפיה', note: 'סריף לשאלות, וכתב יד לחתימה שמתחת לסמל.' },
      photography: { label: 'צילום', note: 'מקומות אמיתיים ורגעים אמיתיים.' },
      shape: { label: 'הקשת', note: 'קשת רכה אחת, כחלון אל הנוף.' },
    },
    website: {
      heading: 'מזהות מותג לאתר שעובד.',
      intro: 'אתר בעברית, מימין לשמאל, משאלת הפתיחה ועד בדיקת ההתאמה, בדסקטופ ובטלפון.',
      structure: {
        label: 'מבנה',
        note: 'שש תחנות, ופעולה אחת שתמיד בהישג יד.',
        items: ['החוויה', 'הבית של בלה', 'הלו״ז', 'היקב', 'קצת עליי', 'שאלות'],
        action: 'בדיקת התאמה',
      },
      rhythm: {
        label: 'קצב',
        note: 'הריטריט במספרים, ואז כותרת קצרה, משפט אחד ונוף דרך קשת.',
      },
      mobile: {
        label: 'בטלפון',
        body: 'הפתיחה נבנית מחדש לטלפון ולא מוקטנת: הסמל מוביל, השאלה נפרשת על ארבע שורות, והפעולה פרוסה לרוחב תחתית המסך.',
      },
    },
    decisions: {
      heading: 'שש החלטות שעיצבו אותו.',
      items: {
        language: {
          title: 'מחוץ לשפה של אפליקציות היכרויות',
          body: 'מסך הפתיחה נפתח בשאלה, ושורת ההסבר שלו אומרת מה הריטריט לא.',
          quote: { text: 'בלי סוויפים. פשוט להיפגש באמת.' },
        },
        rhythm: {
          title: 'קצב רך ועריכתי',
          body: 'אזור הסיפור נותן לכל רעיון מרחב: כותרת קצרה, משפט אחד בבורדו ושורת הסבר אחת.',
        },
        place: {
          title: 'הגליל כחלק מהסיפור',
          body: 'מסך הפתיחה מציין את התאריך ואת המקום, ולמקום יש פרקים משלו: הבית והיקב.',
        },
        exclusive: {
          title: 'אקסקלוסיבי, ועדיין חם',
          body: 'הגבולות נאמרים בפשטות: 24 משתתפים, 12 נשים ו־12 גברים, מגיל 30 ומעלה. כל מספר מופיע מתחת לאייקון רך, עם שורה קצרה מתחתיו.',
        },
        application: {
          title: 'פנייה שמרגישה מכוונת',
          body: 'הפעולה היא בדיקת התאמה ולא הזמנה: שאלון קצר, ללא תשלום וללא התחייבות. אותו כפתור מופיע גם בכותרת העליונה של האתר.',
        },
        mobile: {
          title: 'זהות אחת, בדסקטופ ובטלפון',
          body: 'גם בטלפון הסמל הזהוב פותח את העמוד, מעל אור ערב, ואותה שורה מרווחת מתחתיו.',
        },
      },
    },
    film: {
      heading: 'המותג בתנועה.',
      line: 'הסמל, ההבטחה במילים ספורות, הגליל והאתר, בסרט קצר אחד.',
    },
    details: {
      heading: 'מקרוב.',
      items: {
        ribbon: 'קו הסרט שקושר בין שתי האותיות',
        numerals: 'מספרים בסריף של האתר, פלוס קטן ובהיר ואייקון רך',
        eyebrow: 'שורה מרווחת לפני הכותרת',
        actions: 'פעולה אחת, בשמנת על צילום הערב ובבורדו על רקע שמנת',
        mobileAction: 'בטלפון, הפעולה פרוסה לרוחב המסך',
      },
    },
    result: {
      heading: 'מזהות להשקה.',
      body: 'הזהות והאתר הפכו לחוויה דיגיטלית אחת ושלמה, באוויר וזמינה בדסקטופ ובמובייל.',
    },
  },
}

/** Alternative text for the case study's real images and details, per locale. */
export const caseOnMedia = {
  monogram: {
    en: 'The ON monogram in gold: an O and an N tied by a ribbon line.',
    he: 'מונוגרמת ON בזהב: O ו־N שקשורים בקו סרט.',
  },
  headline: {
    en: 'The opening headline in the site’s serif, in Hebrew: What if your next story starts outside the screen?',
    he: 'כותרת הפתיחה בסריף של האתר: ומה אם הסיפור הבא שלכם מתחיל דווקא מחוץ למסך?',
  },
  lockup: {
    en: 'The gold ON mark over the line Love, Retreat, Galilee and the script signature Turn Love ON.',
    he: 'סמל ON הזהוב מעל השורה Love, Retreat, Galilee והחתימה בכתב יד Turn Love ON.',
  },
  numerals: {
    en: 'Close-up of 12 + 12 in the site’s serif, under a wine-glass icon in a blush circle, above the line women and men.',
    he: 'תקריב של 12 + 12 בסריף של האתר, מתחת לאייקון של כוסות יין בעיגול ורוד עתיק, מעל השורה נשים וגברים.',
  },
  eyebrow: {
    en: 'The spaced line Dating Retreat in the Galilee, in Hebrew, above the headline.',
    he: 'השורה המרווחת ריטריט היכרויות בגליל, מעל הכותרת.',
  },
  cta: {
    en: 'The call to action, Check your fit for the retreat, above the line: a short questionnaire, no payment and no commitment.',
    he: 'הקריאה לפעולה, בדיקת התאמה לריטריט, מעל השורה: שאלון קצר, ללא תשלום וללא התחייבות.',
  },
  datePlace: {
    en: 'The date and the place, on one line at the foot of the opening screen.',
    he: 'התאריך והמקום, בשורה אחת בתחתית מסך הפתיחה.',
  },
  nav: {
    en: 'The site’s navigation in Hebrew: six destinations and the Check your fit button.',
    he: 'הניווט של האתר: שש תחנות וכפתור בדיקת התאמה.',
  },
  pillDark: {
    en: 'The Check your fit button in cream, over the evening photograph.',
    he: 'כפתור בדיקת התאמה בשמנת, מעל צילום הערב.',
  },
  pillLight: {
    en: 'The same button in bordeaux, on a cream page.',
    he: 'אותו כפתור בבורדו, על עמוד בצבע שמנת.',
  },
  numbers: {
    en: 'The retreat in numbers: two days in the Galilee, 24 participants, 12 women and 12 men, aged 30 and up, each under a soft icon.',
    he: 'הריטריט במספרים: יומיים בגליל, 24 משתתפים, 12 נשים ו־12 גברים, מגיל 30 ומעלה, כל אחד מתחת לאייקון רך.',
  },
  rhythm: {
    en: 'A heading, Maybe it is time to meet a little differently, then one sentence in bordeaux and a line of support.',
    he: 'כותרת, אולי הגיע הזמן להכיר קצת אחרת, ואחריה משפט אחד בבורדו ושורת הסבר.',
  },
  arch: {
    en: 'A photograph in an arched frame: a white balcony opening onto the Galilee hills.',
    he: 'צילום במסגרת מקושתת: מרפסת לבנה שנפתחת אל גבעות הגליל.',
  },
  mobileTop: {
    en: 'The top of the opening screen on a phone: the gold mark over evening light, and the spaced line.',
    he: 'ראש מסך הפתיחה בטלפון: הסמל הזהוב מעל אור ערב, והשורה המרווחת.',
  },
  mobileAction: {
    en: 'The call to action across the bottom of a phone screen.',
    he: 'הקריאה לפעולה לרוחב תחתית מסך הטלפון.',
  },
  ribbon: {
    en: 'Close-up of the monogram, where the ribbon line crosses the N.',
    he: 'תקריב של המונוגרמה, במקום שבו קו הסרט חוצה את ה־N.',
  },
} as const satisfies Record<string, Localized>
