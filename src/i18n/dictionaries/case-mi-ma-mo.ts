import type { Localized, ReviewStatus } from '../config'

/**
 * The המחלבה case study (Phase 5B): chapter copy, decisions, details, labels, metadata and
 * the alternative text of every crop. Draft in both locales until Martin reviews it: while
 * either locale is 'draft', a Vercel production build refuses it (src/i18n/release-gate.ts).
 *
 * Every statement describes what the approved, sanitized screens show (Home, Team Week,
 * the manager area, Home on a phone). No numbers, users, adoption or outcomes are claimed,
 * and nothing removed from the screens (names, insignia, a module) is named or described.
 */
export const caseMiMaMoReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
}

export type MiMaMoChapterKey =
  'context' | 'picture' | 'week' | 'management' | 'phone' | 'decisions' | 'details' | 'result'

/** The states the product brings together (the context chapter's map). */
export type MiMaMoStateKey =
  | 'nextShift'
  | 'crew'
  | 'reports'
  | 'weekAhead'
  | 'entries'
  | 'roles'
  | 'snapshot'
  | 'coverage'
  | 'emergency'

export type MiMaMoDecisionKey = 'nextShift' | 'week' | 'roles' | 'snapshot' | 'phone'

export type MiMaMoDetailKey =
  'coverage' | 'today' | 'typeLevels' | 'timeLeft' | 'dayNight' | 'phoneStack'

/** An annotation on a real screen: a short name and one line. */
export interface MarkCopy {
  label: string
  note: string
}

export interface MiMaMoCaseCopy {
  seo: { title: string; description: string }
  ui: {
    /** The small visual kicker. Latin in both locales by choice ("CASE STUDY / 02"). */
    caseStudy: string
    allWork: string
    chapters: string
    platform: string
    platformValue: string
    access: string
    accessValue: string
    /** Labels a decision's proof. */
    evidence: string
    /** The three levels the product is read at: one person, one team, the operation. */
    levels: readonly [string, string, string]
  }
  opening: { statement: string }
  /** Short chapter names, for the chapter index and each chapter's marker. */
  chapters: Readonly<Record<MiMaMoChapterKey, string>>
  context: {
    heading: string
    body: readonly string[]
    mapLabel: string
    states: Readonly<Record<MiMaMoStateKey, string>>
  }
  picture: {
    heading: string
    intro: string
    marks: { nextShift: MarkCopy; crew: MarkCopy; coverage: MarkCopy }
    shortcuts: string
    weekAhead: string
  }
  week: {
    heading: string
    intro: string
    marks: { roles: MarkCopy; entries: MarkCopy; today: MarkCopy }
    day: string
  }
  management: {
    heading: string
    intro: string
    quoteLabel: string
    /** The manager area's own subtitle; `original` is the Hebrew, shown beside a translation. */
    quote: { text: string; original?: string }
    snapshot: { previous: MarkCopy; current: MarkCopy; next: MarkCopy }
    emergency: MarkCopy
  }
  phone: {
    heading: string
    intro: string
    marks: {
      greeting: string
      shortcuts: string
      nextShift: string
      crew: string
      sections: string
    }
  }
  decisions: {
    heading: string
    items: Readonly<Record<MiMaMoDecisionKey, { title: string; body: string }>>
  }
  details: { heading: string; items: Readonly<Record<MiMaMoDetailKey, string>> }
  result: { heading: string; body: string }
  closing: { kicker: string }
}

export const caseMiMaMoCopy: Localized<MiMaMoCaseCopy> = {
  en: {
    seo: {
      title: 'המחלבה, an operational workforce product',
      description:
        'Case study: המחלבה, an operational workforce product for scheduling, management workflows and day-to-day operations. Real, sanitized screens on the desktop and on a phone.',
    },
    ui: {
      caseStudy: 'Case study',
      allWork: 'All work',
      chapters: 'Chapters',
      platform: 'Platform',
      platformValue: 'Desktop and phone',
      access: 'Access',
      accessValue: 'Signed-in product, no public link',
      evidence: 'Evidence',
      levels: ['Your shift', 'The team', 'The operation'],
    },
    opening: {
      statement:
        'One working system for scheduling, management workflows and day-to-day operations, from a person’s next shift to the operation as a whole.',
    },
    chapters: {
      context: 'The context',
      picture: 'The operational picture',
      week: 'Built around the week',
      management: 'Management at a glance',
      phone: 'One system, different contexts',
      decisions: 'Key decisions',
      details: 'System details',
      result: 'Result',
    },
    context: {
      heading: 'An operation runs on states: who is on, who is off, what is covered.',
      body: [
        'המחלבה is an operational workforce product, built around scheduling, management workflows and day-to-day operations.',
        'Shifts, leave, duties, reports and coverage are read at different levels: a person checking their next shift, a team looking at its week, and a manager looking at the operation as a whole. The product brings them into one system and gives each level a view of its own.',
      ],
      mapLabel: 'Where each state is read',
      states: {
        nextShift: 'Your next shift',
        crew: 'Who is on it',
        reports: 'Reports',
        weekAhead: 'The week ahead',
        entries: 'Shifts, leave and duties',
        roles: 'Grouping by role',
        snapshot: 'Previous, current and next shift',
        coverage: 'Coverage',
        emergency: 'Emergency mode',
      },
    },
    picture: {
      heading: 'The next shift comes first.',
      intro:
        'Home opens with a greeting and the date. Under them comes the next shift: its name set large, then the day and the hours, and who is on it in the same card.',
      marks: {
        nextShift: {
          label: 'The next shift',
          note: 'Its name set large, with the day and the hours beneath it.',
        },
        crew: {
          label: 'Who is on it',
          note: 'The people on the shift, each with a role. The names are removed here.',
        },
        coverage: { label: 'Coverage', note: 'Stated in words, beside them.' },
      },
      shortcuts: 'Above it, the way into reports and Team Week.',
      weekAhead: 'Below it, the week ahead, day by day, with today marked.',
    },
    week: {
      heading: 'The whole team’s week, in one view.',
      intro:
        'Team Week sets out shifts, leave and duties across the week: a row for each day, a column for each person, and the columns grouped by role. In the public version the names are removed.',
      marks: {
        roles: { label: 'By role', note: 'The columns sit under role headings.' },
        entries: {
          label: 'Shifts, leave and duties',
          note: 'Every entry has a label of its own.',
        },
        today: { label: 'Today', note: 'Marked in the day column.' },
      },
      day: 'One day, closer: each entry carries its own label, icon and tint.',
    },
    management: {
      heading: 'A manager needs a different picture.',
      intro:
        'The manager area moves up a level: from one person and one team to the operation as a whole.',
      quoteLabel: 'In the product’s own words',
      quote: {
        text: 'A snapshot of the schedule, the coverage and the team.',
        original: 'תמונת מצב של הסידור, הכיסוי והצוות.',
      },
      snapshot: {
        previous: { label: 'Previous shift', note: 'When it ran, and its coverage.' },
        current: { label: 'Current shift', note: 'Its coverage, and the time left in it.' },
        next: { label: 'Next shift', note: 'Its coverage, and what is missing.' },
      },
      emergency: {
        label: 'Emergency mode',
        note: 'A panel of its own at the top of the manager area, with its own button to activate it.',
      },
    },
    phone: {
      heading: 'Designed to remain useful on a phone.',
      intro:
        'On a phone, Home keeps the same order as on the desktop. The main sections move to a bar along the bottom of the screen.',
      marks: {
        greeting: 'The greeting and the date',
        shortcuts: 'The report and Team Week, one above the other',
        nextShift: 'The next shift',
        crew: 'Who is on it, and the coverage',
        sections: 'The main sections, along the bottom',
      },
    },
    decisions: {
      heading: 'Five decisions, each one visible in the product.',
      items: {
        nextShift: {
          title: 'The next shift before everything else',
          body: 'On Home, the next shift is the largest card, set below the greeting and the two shortcuts, with its name in large type.',
        },
        week: {
          title: 'The week as a shared view',
          body: 'Team Week brings the whole team into a single weekly view: every day a row, every person a column, and today marked.',
        },
        roles: {
          title: 'Information grouped by role',
          body: 'The columns sit under role headings, with a divider between the groups. The same roles return in the manager area’s snapshot.',
        },
        snapshot: {
          title: 'An operational snapshot for managers',
          body: 'The manager area’s overview sets the previous, current and next shift side by side, each with its coverage state.',
        },
        phone: {
          title: 'The same hierarchy on a phone',
          body: 'On a phone, Home keeps its order: the greeting, the two shortcuts, then the next shift and who is on it.',
        },
      },
    },
    details: {
      heading: 'The mechanics, up close.',
      items: {
        coverage: 'Coverage in words, with an icon and a color: full coverage or none.',
        today: 'Today, marked the same way on Home and in Team Week.',
        typeLevels: 'A small label, the shift in large type, then the day and the hours.',
        timeLeft: 'The time left in the current shift, in words and as a bar.',
        dayNight: 'Day and night shifts carry a sun or a moon.',
        phoneStack: 'On a phone, the two shortcuts stand one above the other.',
      },
    },
    result: {
      heading: 'Many operational states, one working system.',
      body: 'המחלבה brings scheduling, management workflows and day-to-day operations into one system, with real interfaces on desktop and phone.',
    },
    closing: { kicker: 'Also in the work' },
  },
  he: {
    seo: {
      title: 'המחלבה, מוצר תפעולי לניהול כוח אדם',
      description:
        'חקר מקרה: המחלבה, מוצר תפעולי לניהול כוח אדם: שיבוצים, תהליכי ניהול ותפעול יומיומי. מסכים אמיתיים, אחרי הסרת פרטים מזהים, בדסקטופ ובטלפון.',
    },
    ui: {
      caseStudy: 'Case study',
      allWork: 'כל העבודות',
      chapters: 'פרקים',
      platform: 'פלטפורמה',
      platformValue: 'דסקטופ וטלפון',
      access: 'גישה',
      accessValue: 'מערכת למשתמשים רשומים, ללא קישור ציבורי',
      evidence: 'נראה ב־',
      levels: ['המשמרת שלך', 'הצוות', 'התפעול'],
    },
    opening: {
      statement:
        'מערכת אחת לשיבוצים, לתהליכי ניהול ולתפעול היומיומי: מהמשמרת הבאה של כל אחד ועד לתפעול כולו.',
    },
    chapters: {
      context: 'ההקשר',
      picture: 'תמונת המצב',
      week: 'סביב השבוע',
      management: 'ניהול במבט אחד',
      phone: 'מערכת אחת, הקשרים שונים',
      decisions: 'החלטות מרכזיות',
      details: 'פרטי המערכת',
      result: 'התוצאה',
    },
    context: {
      heading: 'תפעול נשען על מצבים: מי במשמרת, מי בחופש, ומה מכוסה.',
      body: [
        'המחלבה היא מוצר תפעולי לניהול כוח אדם, שנבנה סביב שיבוצים, תהליכי ניהול ותפעול יומיומי.',
        'משמרות, חופשות, תורנויות, דוחות וכיסוי נראים אחרת בכל רמה: אדם שבודק את המשמרת הבאה שלו, צוות שמסתכל על השבוע שלו, ומנהל שצריך לראות את התפעול כולו. המוצר מרכז את כל אלה במערכת אחת, ונותן לכל רמה את התצוגה שמתאימה לה.',
      ],
      mapLabel: 'איפה רואים כל מצב',
      states: {
        nextShift: 'המשמרת הבאה שלך',
        crew: 'מי משובץ בה',
        reports: 'דוחות',
        weekAhead: 'השבוע הקרוב',
        entries: 'משמרות, חופשות ותורנויות',
        roles: 'קיבוץ לפי תפקיד',
        snapshot: 'המשמרת הקודמת, הנוכחית והבאה',
        coverage: 'כיסוי',
        emergency: 'מצב חירום',
      },
    },
    picture: {
      heading: 'המשמרת הבאה קודמת לכל.',
      intro:
        'מסך הבית נפתח בברכה ובתאריך. מתחתיהם מגיעה המשמרת הבאה: שם המשמרת מופיע בגדול, אחריו היום והשעות, ובאותו כרטיס גם מי משובץ בה.',
      marks: {
        nextShift: {
          label: 'המשמרת הבאה',
          note: 'שם המשמרת מופיע בגדול, ומתחתיו היום והשעות.',
        },
        crew: {
          label: 'מי משובץ בה',
          note: 'האנשים במשמרת, כל אחד עם התפקיד שלו. כאן השמות הוסרו.',
        },
        coverage: { label: 'כיסוי', note: 'הכיסוי מוצג במילים לצד המשתתפים.' },
      },
      shortcuts: 'מעליה, הדרך לדוחות ולצוות השבוע.',
      weekAhead: 'מתחתיה, השבוע הקרוב, יום אחר יום, והיום מסומן.',
    },
    week: {
      heading: 'השבוע של כל הצוות, בתצוגה אחת.',
      intro:
        'צוות השבוע פורש משמרות, חופשות ותורנויות לאורך השבוע: שורה לכל יום, עמודה לכל אדם, והעמודות מקובצות לפי תפקיד. בגרסה הציבורית השמות הוסרו.',
      marks: {
        roles: { label: 'לפי תפקיד', note: 'העמודות יושבות תחת כותרות של תפקידים.' },
        entries: {
          label: 'משמרות, חופשות ותורנויות',
          note: 'לכל רשומה תווית משלה.',
        },
        today: { label: 'היום', note: 'מסומן בעמודת הימים.' },
      },
      day: 'יום אחד, מקרוב: לכל רשומה תווית, אייקון וגוון משלה.',
    },
    management: {
      heading: 'מנהל צריך תמונה אחרת.',
      intro: 'אזור המנהל עולה רמה: מאדם אחד ומצוות אחד, אל התפעול כולו.',
      quoteLabel: 'במילים של המוצר עצמו',
      quote: { text: 'תמונת מצב של הסידור, הכיסוי והצוות.' },
      snapshot: {
        previous: { label: 'המשמרת הקודמת', note: 'מתי התקיימה, ומה היה הכיסוי.' },
        current: { label: 'המשמרת הנוכחית', note: 'הכיסוי שלה, והזמן שנותר בה.' },
        next: { label: 'המשמרת הבאה', note: 'הכיסוי שלה, ומה חסר.' },
      },
      emergency: {
        label: 'מצב חירום',
        note: 'מצב החירום מקבל אזור נפרד בראש אזור המנהל, עם כפתור הפעלה משלו.',
      },
    },
    phone: {
      heading: 'בנוי להישאר שימושי גם בטלפון.',
      intro:
        'בטלפון, מסך הבית שומר על אותו סדר כמו בדסקטופ. האזורים הראשיים עוברים לסרגל בתחתית המסך.',
      marks: {
        greeting: 'הברכה והתאריך',
        shortcuts: 'הדוח וצוות השבוע, זה מעל זה',
        nextShift: 'המשמרת הבאה',
        crew: 'מי משובץ בה, והכיסוי',
        sections: 'האזורים הראשיים, בתחתית',
      },
    },
    decisions: {
      heading: 'חמש החלטות, וכל אחת מהן נראית במוצר.',
      items: {
        nextShift: {
          title: 'המשמרת הבאה לפני כל דבר אחר',
          body: 'במסך הבית, המשמרת הבאה היא הכרטיס הגדול ביותר, מתחת לברכה ולשני הקיצורים, ושמה באות גדולה.',
        },
        week: {
          title: 'השבוע כתצוגה משותפת',
          body: 'צוות השבוע מרכז שבוע שלם של הצוות בתצוגה אחת: כל יום שורה, כל אדם עמודה, והיום מסומן.',
        },
        roles: {
          title: 'מידע מקובץ לפי תפקיד',
          body: 'העמודות יושבות תחת כותרות של תפקידים, עם קו מפריד בין הקבוצות. אותם תפקידים חוזרים בתמונת המצב של אזור המנהל.',
        },
        snapshot: {
          title: 'תמונת מצב תפעולית למנהלים',
          body: 'הסקירה באזור המנהל מציבה זו לצד זו את המשמרת הקודמת, הנוכחית והבאה, כל אחת עם מצב הכיסוי שלה.',
        },
        phone: {
          title: 'אותה היררכיה בטלפון',
          body: 'בטלפון, מסך הבית שומר על הסדר שלו: הברכה, שני הקיצורים, ואז המשמרת הבאה ומי משובץ בה.',
        },
      },
    },
    details: {
      heading: 'המנגנון, מקרוב.',
      items: {
        coverage: 'כיסוי במילים, עם אייקון וצבע: כיסוי מלא או ללא כיסוי.',
        today: 'היום, מסומן באותו אופן במסך הבית ובצוות השבוע.',
        typeLevels: 'תווית קטנה, שם המשמרת בגדול, ואז היום והשעות.',
        timeLeft: 'הזמן שנותר במשמרת הנוכחית, בטקסט ובפס התקדמות.',
        dayNight: 'משמרות יום ולילה מסומנות בשמש או בירח.',
        phoneStack: 'בטלפון, שני הקיצורים עומדים זה מעל זה.',
      },
    },
    result: {
      heading: 'הרבה מצבים תפעוליים, מערכת אחת שעובדת.',
      body: 'המחלבה מחברת שיבוצים, תהליכי ניהול ותפעול יומיומי למערכת אחת, עם ממשקים אמיתיים בדסקטופ ובטלפון.',
    },
    closing: { kicker: 'עוד מהעבודה' },
  },
}

/** Alternative text for the case study's crops of the approved screens, per locale. */
export const caseMiMaMoMedia = {
  opening: {
    en: 'The home screen of המחלבה on a desktop, beside its navigation: a greeting and the date, shortcuts to a report and to Team Week, and the next shift with who is on it.',
    he: 'מסך הבית של המחלבה בדסקטופ, לצד הניווט: ברכה ותאריך, קיצורים לדוח ולצוות השבוע, והמשמרת הבאה עם מי שמשובץ בה.',
  },
  nextShift: {
    en: 'The next-shift card on Home: the shift’s name, its day and hours, and who is on it, with the coverage marked full. The name is removed.',
    he: 'כרטיס המשמרת הבאה במסך הבית: שם המשמרת, היום והשעות, ומי משובץ בה, והכיסוי מסומן כמלא. השם הוסר.',
  },
  shortcuts: {
    en: 'Two shortcuts on Home: a report for tomorrow, and Team Week.',
    he: 'שני קיצורים במסך הבית: דוח למחר, וצוות השבוע.',
  },
  weekAhead: {
    en: 'The week ahead on Home: a card for each day from Sunday to Saturday, today outlined, and the shifts in their days.',
    he: 'השבוע הקרוב במסך הבית: כרטיס לכל יום מראשון עד שבת, היום מסומן במסגרת, והמשמרות בימים שלהן.',
  },
  weekAheadToday: {
    en: 'The end of the week ahead, close: the card marked today and Saturday.',
    he: 'סוף השבוע הקרוב, מקרוב: הכרטיס שמסומן כהיום ויום שבת.',
  },
  dayRow: {
    en: 'One day in Team Week, close: entries with their labels, icons and tints. Names removed.',
    he: 'יום אחד בצוות השבוע, מקרוב: רשומות עם התוויות, האייקונים והגוונים שלהן. השמות הוסרו.',
  },
  previous: {
    en: 'The previous shift in the manager area: a night shift, its date and hours, coverage full.',
    he: 'המשמרת הקודמת באזור המנהל: משמרת לילה, התאריך והשעות, כיסוי מלא.',
  },
  current: {
    en: 'The current shift: a day shift and its hours, coverage full, and the time left in words and as a bar.',
    he: 'המשמרת הנוכחית: משמרת יום והשעות שלה, כיסוי מלא, והזמן שנותר במילים וכפס.',
  },
  next: {
    en: 'The next shift: a night shift with no coverage, and the missing role noted.',
    he: 'המשמרת הבאה: משמרת לילה ללא כיסוי, וציון של התפקיד החסר.',
  },
  emergency: {
    en: 'The emergency mode panel at the top of the manager area, with its button to activate it.',
    he: 'פאנל מצב החירום בראש אזור המנהל, עם כפתור ההפעלה שלו.',
  },
  homeOrder: {
    en: 'Home: the two shortcut cards above the larger next-shift card.',
    he: 'מסך הבית: שני כרטיסי הקיצור מעל כרטיס המשמרת הבאה, הגדול מהם.',
  },
  weekView: {
    en: 'Team Week: the days as rows, people as columns, today marked. Names removed.',
    he: 'צוות השבוע: הימים כשורות, האנשים כעמודות, והיום מסומן. השמות הוסרו.',
  },
  roleHeaders: {
    en: 'The top of Team Week: column headings grouped by role, with a divider between the groups. Names removed.',
    he: 'ראש צוות השבוע: כותרות העמודות מקובצות לפי תפקיד, עם קו מפריד בין הקבוצות. השמות הוסרו.',
  },
  snapshot: {
    en: 'The manager area’s snapshot: the previous, current and next shift, each with its coverage state.',
    he: 'תמונת המצב באזור המנהל: המשמרת הקודמת, הנוכחית והבאה, כל אחת עם מצב הכיסוי שלה.',
  },
  phoneOrder: {
    en: 'Home on a phone: the greeting and the date, the two shortcuts, and the next shift, in that order.',
    he: 'מסך הבית בטלפון: הברכה והתאריך, שני הקיצורים, והמשמרת הבאה, בסדר הזה.',
  },
  coverageFull: {
    en: 'The current shift’s heading in the manager area: now, day, and coverage full in green.',
    he: 'כותרת המשמרת הנוכחית באזור המנהל: עכשיו, יום, וכיסוי מלא בירוק.',
  },
  coverageNone: {
    en: 'The next shift’s heading: next, night, and no coverage in red.',
    he: 'כותרת המשמרת הבאה: הבאה, לילה, ואין כיסוי באדום.',
  },
  todayHome: {
    en: 'Today’s card in the week ahead on Home, outlined and labelled today.',
    he: 'הכרטיס של היום בשבוע הקרוב במסך הבית, עם מסגרת ותווית היום.',
  },
  todayWeek: {
    en: 'Today in the Team Week day column, outlined and labelled today.',
    he: 'היום בעמודת הימים של צוות השבוע, עם מסגרת ותווית היום.',
  },
  typeLevels: {
    en: 'The next shift’s heading on Home: a small label, the shift’s name in large type, then the day and the hours.',
    he: 'כותרת המשמרת הבאה במסך הבית: תווית קטנה, שם המשמרת באות גדולה, ואז היום והשעות.',
  },
  timeLeft: {
    en: 'The time left in the current shift, in words and as a progress bar.',
    he: 'הזמן שנותר במשמרת הנוכחית, במילים וכפס התקדמות.',
  },
  dayNight: {
    en: 'Two entries in Team Week: a night shift with a moon, and a day shift with a sun.',
    he: 'שתי רשומות בצוות השבוע: משמרת לילה עם ירח, ומשמרת יום עם שמש.',
  },
  phoneStack: {
    en: 'On a phone, the report and Team Week shortcuts, one above the other.',
    he: 'בטלפון, הקיצורים לדוח ולצוות השבוע, זה מעל זה.',
  },
} as const satisfies Record<string, Localized>
