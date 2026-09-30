import type { Localized } from '@/i18n/config'

/*
 * QA-ONLY COPY for the design-system specimen. Not production copy, not reviewed, never
 * rendered in production (see src/lib/specimen.ts), deliberately outside the dictionaries
 * and the release gate. Sample strings exist only to exercise the type roles, line lengths
 * and bidi behavior. Long strings are intentionally long.
 */
export const specimenCopy = {
  title: { en: 'Design system specimen', he: 'דוגמת מערכת העיצוב' },
  note: {
    en: 'QA page for local and preview builds. Not rendered in production.',
    he: 'עמוד בדיקה לסביבות מקומיות ותצוגה מקדימה. אינו מוצג בסביבת הייצור.',
  },
  sections: {
    type: { en: 'Typography', he: 'טיפוגרפיה' },
    grid: { en: 'Grid and placements', he: 'גריד ומיקומים' },
    primitives: { en: 'Primitives', he: 'רכיבי בסיס' },
    marks: { en: 'Brand marks', he: 'סימני המותג' },
    themes: { en: 'Worlds', he: 'עולמות' },
    atmosphere: { en: 'Atmosphere', he: 'אווירה' },
    motion: { en: 'Motion', he: 'תנועה' },
    stress: { en: 'Long strings', he: 'מחרוזות ארוכות' },
  },
  sample: {
    display: { en: 'From problem to product.', he: 'מבעיה למוצר.' },
    heading: {
      en: 'Digital products, systems & experiences.',
      he: 'מוצרים דיגיטליים, מערכות וחוויות.',
    },
    lead: {
      en: 'A lead paragraph introduces a section in a calm, generous size and a comfortable measure.',
      he: 'פסקת פתיחה מציגה חלק בעמוד בגודל רגוע ונדיב ובאורך שורה נוח לקריאה.',
    },
    body: {
      en: 'Body copy is set for long reading: sixteen to seventeen pixels, generous leading and a measure of roughly seventy characters. Mixed runs such as mi-ma-mo, ON or 2024 stay isolated in Hebrew.',
      he: 'טקסט רץ מותאם לקריאה ארוכה: שש עשרה עד שבע עשרה פיקסלים, ריווח שורות נדיב ואורך שורה של כשבעים תווים. רצפים מעורבים כמו mi-ma-mo, ON או 2024 נשארים מבודדים בעברית.',
    },
    label: { en: 'Selected Work', he: 'עבודות נבחרות' },
  },
  placements: ['col-full', 'col-content', 'col-inset', 'col-aside', 'col-main', 'col-text'],
  themes: {
    inverse: { en: 'QA palette: light inverse', he: 'פלטת בדיקה: בהירה הפוכה' },
    tinted: { en: 'QA palette: tinted dark with accents', he: 'פלטת בדיקה: כהה עם הדגשות' },
  },
  worlds: {
    brand: { en: 'MARTIN.G world', he: 'העולם של MARTIN.G' },
    on: { en: 'ON world (provisional palette)', he: 'העולם של ON (פלטה זמנית)' },
    onBordeaux: {
      en: 'ON world, bordeaux register (provisional)',
      he: 'העולם של ON, משלב בורדו (זמני)',
    },
    miMaMo: { en: 'mi-ma-mo world (provisional palette)', he: 'העולם של mi-ma-mo (פלטה זמנית)' },
    confidential: { en: 'Confidential world', he: 'העולם החסוי' },
    scenesLink: {
      en: 'See the worlds in sequence, with their transitions',
      he: 'צפייה בעולמות ברצף, עם המעברים ביניהם',
    },
  },
  weights: { en: 'Weights', he: 'משקלים' },
  motion: {
    fade: { en: 'Fade', he: 'דהייה' },
    rise: { en: 'Rise', he: 'עלייה' },
    scale: { en: 'Scale 0.98 to 1', he: 'קנה מידה 0.98 עד 1' },
    mask: { en: 'Mask reveal', he: 'חשיפת מסכה' },
    parallax: { en: 'Parallax (scroll-driven CSS)', he: 'פרלקסה (CSS מונחה גלילה)' },
  },
  stress: {
    longWord: {
      en: 'Supercalifragilisticexpialidociousoperationalworkforceplatformidentifier',
      he: 'מילהארוכהמאודללארווחיםשבודקתשבירתשורותבכלרוחבימסךאפשריים',
    },
    longTitle: {
      en: 'An intentionally long project title that must wrap gracefully across several lines',
      he: 'כותרת פרויקט ארוכה במכוון שחייבת להישבר בצורה נאה על פני כמה שורות',
    },
    longParagraph: {
      en: 'Operational systems accumulate edge cases: overlapping shifts, last-minute replacements, regulatory constraints and managers who need an answer in seconds. A long paragraph like this one verifies measure, hyphenation-free wrapping and rhythm.',
      he: 'מערכות תפעוליות צוברות מקרי קצה: משמרות חופפות, החלפות של הרגע האחרון, מגבלות רגולטוריות ומנהלים שצריכים תשובה בתוך שניות. פסקה ארוכה כמו זו בודקת אורך שורה, שבירת שורות ומקצב.',
    },
  },
} as const satisfies Record<string, unknown>

export type SpecimenText = Localized
