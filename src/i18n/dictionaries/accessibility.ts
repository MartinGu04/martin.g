import type { Localized, ReviewStatus } from '../config'
import type { TrustPageCopy } from './legal'

/**
 * The accessibility statement (Phase 6). It describes the work that exists and is tested
 * (docs/DESIGN-SYSTEM.md, "Accessibility baseline"; tests/e2e), names what is not done
 * yet, and makes no conformance or certification claim: WCAG 2.2 AA is stated as the
 * target only. The Enable menu is described as an addition, never as the reason the site
 * is accessible. Draft until Martin approves it.
 */
export const accessibilityReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
}

export const accessibilityCopy: Localized<TrustPageCopy> = {
  en: {
    seo: {
      title: 'Accessibility',
      description:
        'How this website is built to be usable by everyone, what is still missing, and how to report a problem.',
    },
    eyebrow: 'Accessibility',
    title: 'Accessibility',
    lead: 'This website is built to be usable by everyone: in Hebrew and in English, with a keyboard or a screen reader, on a phone or at any zoom level. This page describes what was done, what is still missing, and how to tell me about a problem.',
    updated: 'Last updated: October 2026',
    sections: [
      {
        heading: 'The goal',
        body: [
          'The target is level AA of the Web Content Accessibility Guidelines (WCAG) 2.2. It is a goal, not a certification: the site has not been audited by an outside party, and it does not claim full conformance.',
        ],
      },
      {
        heading: 'What has been done',
        body: [],
        list: [
          'Structure: every page has one main heading, headings in order, labelled regions and a link to skip to the content.',
          'Keyboard: everything that can be clicked can be reached and used with a keyboard, and the focus is always visible.',
          'Motion: the site follows your system’s reduced motion setting. Nothing waits for an animation to become readable, and nothing moves continuously while motion is reduced.',
          'Zoom and small screens: pages reflow at 200% and 400% zoom and on screens 320 pixels wide, without horizontal scrolling.',
          'Contrast: text and controls are checked automatically against the AA contrast ratios, in every color world of the site.',
          'Images and video: images that carry information have text alternatives, and decorative ones are hidden from screen readers. The brand film is a silent preview that plays only through its own play and pause control.',
          'Languages: Hebrew pages read right to left and English pages left to right, with the language of each page, and of words in the other language, marked.',
          'Forms: every field has a visible label, required fields are marked, and errors are listed, linked to their fields and announced to screen readers.',
          'Without JavaScript the content stays readable and the contact form still works. High contrast modes of the operating system are supported.',
        ],
      },
      {
        heading: 'How it is tested',
        body: [
          'Automated accessibility checks (axe) run on the pages of the site in both languages before every change is published, together with automated tests of keyboard use, zoom, reduced motion and pages without JavaScript. Manual testing with screen readers is not complete yet.',
        ],
      },
      {
        heading: 'The accessibility menu',
        body: [
          'The site also offers an accessibility menu by Enable, opened from its button on the screen, which lets you adjust how pages are displayed. It is an additional tool, not a replacement: the site is built to be accessible without it, and the menu alone does not make a website accessible.',
          'The menu is provided and maintained by Enable, a third party, and loads from its servers. Privacy explains what that means.',
        ],
        action: { label: 'Privacy', page: 'privacy' },
      },
      {
        heading: 'Known limitations',
        body: [],
        list: [
          'Screens of real products are shown as images. Their essential content is described in text alternatives, but not every label inside them is available as text.',
          'The accessibility menu is a third-party component, and its own behavior is outside my control.',
          'Manual testing with screen readers is still to be done.',
        ],
      },
      {
        heading: 'Report a problem',
        body: [
          'If something on this website is hard or impossible to use, I want to know. Write through the contact page: which page, what you tried to do, what happened, and which device, browser or assistive technology you use.',
        ],
        action: { label: 'Contact', page: 'contact' },
      },
    ],
  },
  he: {
    seo: {
      title: 'נגישות',
      description: 'איך האתר הזה בנוי כך שכולם יוכלו להשתמש בו, מה עוד חסר, ואיך מדווחים על בעיה.',
    },
    eyebrow: 'נגישות',
    title: 'הצהרת נגישות',
    lead: 'האתר הזה בנוי כך שכולם יוכלו להשתמש בו: בעברית ובאנגלית, עם מקלדת או קורא מסך, בטלפון או בכל רמת הגדלה. העמוד הזה מתאר מה נעשה, מה עוד חסר, ואיך לספר לי על בעיה.',
    updated: 'עדכון אחרון: אוקטובר 2026',
    sections: [
      {
        heading: 'המטרה',
        body: [
          'היעד הוא רמה AA של הנחיות הנגישות לתוכן אינטרנט (WCAG) 2.2. זו מטרה ולא הסמכה: האתר לא נבדק על ידי גורם חיצוני, והוא לא טוען לעמידה מלאה בהנחיות.',
        ],
      },
      {
        heading: 'מה נעשה',
        body: [],
        list: [
          'מבנה: בכל עמוד יש כותרת ראשית אחת, כותרות לפי הסדר, אזורים מסומנים וקישור לדילוג לתוכן.',
          'מקלדת: כל מה שאפשר ללחוץ עליו נגיש ושמיש גם במקלדת, והפוקוס תמיד נראה.',
          'תנועה: האתר מכבד את הגדרת הפחתת התנועה של המערכת. שום דבר לא מחכה לאנימציה כדי להיות קריא, ושום דבר לא זז ברציפות כשהתנועה מופחתת.',
          'הגדלה ומסכים קטנים: העמודים מסתדרים מחדש בהגדלה של 200% ו־400% ובמסכים ברוחב 320 פיקסלים, בלי גלילה לרוחב.',
          'ניגודיות: הטקסט והפקדים נבדקים אוטומטית מול יחסי הניגודיות של רמה AA, בכל אחד מהעולמות הצבעוניים של האתר.',
          'תמונות ווידאו: לתמונות שמעבירות מידע יש חלופה טקסטואלית, ותמונות דקורטיביות מוסתרות מקוראי מסך. סרט המותג הוא תצוגה מקדימה ללא קול, שמתנגנת רק דרך כפתור ההפעלה וההשהיה שלה.',
          'שפות: עמודים בעברית נקראים מימין לשמאל ועמודים באנגלית משמאל לימין, והשפה של כל עמוד, ושל מילים בשפה האחרת, מסומנת.',
          'טפסים: לכל שדה יש תווית גלויה, שדות חובה מסומנים, והשגיאות מרוכזות ברשימה, מקושרות לשדות שלהן ומוקראות לקוראי מסך.',
          'גם בלי JavaScript התוכן נשאר קריא וטופס יצירת הקשר עובד. מצבי ניגודיות גבוהה של מערכת ההפעלה נתמכים.',
        ],
      },
      {
        heading: 'איך זה נבדק',
        body: [
          'בדיקות נגישות אוטומטיות (axe) רצות על עמודי האתר בשתי השפות לפני כל שינוי שמתפרסם, יחד עם בדיקות אוטומטיות של שימוש במקלדת, הגדלה, הפחתת תנועה ועמודים בלי JavaScript. בדיקה ידנית עם קוראי מסך עוד לא הושלמה.',
        ],
      },
      {
        heading: 'תפריט הנגישות',
        body: [
          'באתר יש גם תפריט נגישות של Enable, שנפתח מהכפתור שלו על המסך ומאפשר להתאים את תצוגת העמודים. זה כלי נוסף ולא תחליף: האתר בנוי להיות נגיש גם בלעדיו, והתפריט לבדו לא הופך אתר לנגיש.',
          'את התפריט מספקת ומתחזקת Enable, צד שלישי, והוא נטען מהשרתים שלה. עמוד הפרטיות מסביר מה זה אומר.',
        ],
        action: { label: 'פרטיות', page: 'privacy' },
      },
      {
        heading: 'מגבלות ידועות',
        body: [],
        list: [
          'מסכים של מוצרים אמיתיים מוצגים כתמונות. התוכן החיוני שלהם מתואר בחלופה טקסטואלית, אבל לא כל תווית שבתוכם זמינה כטקסט.',
          'תפריט הנגישות הוא רכיב של צד שלישי, וההתנהגות שלו עצמו אינה בשליטתי.',
          'בדיקה ידנית עם קוראי מסך עוד לפנינו.',
        ],
      },
      {
        heading: 'דיווח על בעיה',
        body: [
          'אם משהו באתר קשה לשימוש או לא שמיש בכלל, חשוב לי לדעת. כתבו לי דרך עמוד יצירת הקשר: באיזה עמוד, מה ניסיתם לעשות, מה קרה, ובאיזה מכשיר, דפדפן או טכנולוגיה מסייעת אתם משתמשים.',
        ],
        action: { label: 'יצירת קשר', page: 'contact' },
      },
    ],
  },
}
