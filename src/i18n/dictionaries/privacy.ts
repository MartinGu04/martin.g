import type { Localized, ReviewStatus } from '../config'
import type { TrustPageCopy } from './legal'

/**
 * The privacy page (Phase 6, revised in Phase 8). It describes only what the site actually
 * does (docs/ARCHITECTURE.md, "Privacy"):
 *
 *   - the contact form's fields (required: name, email, project description; optional:
 *     phone, project type, business or project name, link, timeline); each inquiry stored
 *     in a private Supabase database (the fields, the site's language and the time; no IP
 *     address, user agent, cookie or other device data) and a copy emailed through Resend;
 *     no retention period is stated and nothing is deleted automatically
 *   - Vercel hosting and its ordinary request logs
 *   - one first-party cookie, NEXT_LOCALE, set only by the language switch (one year)
 *   - the Enable accessibility menu, loaded from cdn.enable.co.il
 *   - no analytics yet (Vercel Web Analytics is planned for Phase 7: update this page first)
 *   - self-hosted fonts, images and video; no embeds; external links without a referrer
 *
 * If the Telegram notifier (src/lib/contact/notifiers.ts) is turned on, or analytics are
 * added, this copy must say so before it ships. Approved by Martin in both locales, the
 * Phase 8 storage wording ("When you send a message", "Other services") included.
 */
export const privacyReview: Localized<ReviewStatus> = {
  en: 'approved',
  he: 'approved',
}

export const privacyCopy: Localized<TrustPageCopy> = {
  en: {
    seo: {
      title: 'Privacy',
      description: 'What this website collects, why, and where it goes.',
    },
    eyebrow: 'Privacy',
    title: 'Privacy',
    lead: 'What this website collects, why, and where it goes. In short: only what you choose to send me, and the ordinary technical data involved in serving a website.',
    updated: 'Last updated: October 2026',
    sections: [
      {
        heading: 'Who is responsible',
        body: [
          'This website belongs to Martin Gusin, who is responsible for the information described here. For any question about it, write through the contact page.',
        ],
        action: { label: 'Contact', page: 'contact' },
      },
      {
        heading: 'When you send a message',
        body: [
          'The contact form asks for your name, your email address and a few words about the project. You may also add a phone number, the kind of project, a business or project name, a relevant link and when you would like to start.',
          'Your message is used only to reply to you and to talk about the project. It is not added to a mailing list, sold or shared for marketing.',
          'Your message is stored in a private database hosted by Supabase, and a copy is delivered to me by email through Resend, an email delivery service. It is stored without your IP address or other information about your device, and kept for as long as needed to handle your inquiry.',
          'The form also uses a hidden field and a basic timing check to reduce automated spam. This information is not used to identify you.',
        ],
      },
      {
        heading: 'Technical data',
        body: [
          'The website is hosted on Vercel. As part of operating the site, the hosting service may record technical data such as your IP address, browser type, the page requested and the time of the request, in order to deliver and secure the site. I do not use this data to identify visitors.',
        ],
      },
      {
        heading: 'Cookies and storage',
        body: [
          'The website sets one cookie of its own, NEXT_LOCALE, and only when you use the language switch. It remembers the language you chose for one year and is not used for tracking.',
          'The accessibility menu may store your display settings in your browser, so they stay in place between visits.',
        ],
      },
      {
        heading: 'Analytics',
        body: [
          'There is no analytics or advertising tracking on this website at the moment. This page will be updated before any is added.',
        ],
      },
      {
        heading: 'Other services',
        body: ['A few services are part of how the website works:'],
        list: [
          'Vercel hosts the website and delivers its pages.',
          'Supabase hosts the private database where messages from the contact form are stored.',
          'Resend delivers a copy of each message from the contact form to my inbox.',
          'Enable provides the accessibility menu. Its script loads from Enable’s servers (cdn.enable.co.il), so your browser connects to them, and they receive the technical data of that request, such as your IP address.',
          'Fonts, images and the video preview are served by this website itself. There are no embedded videos, maps or social media widgets.',
          'Links to other websites, such as a project’s live site, open in a new tab without passing along the address of the page you came from. The other website’s own privacy policy applies there.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'You can ask to see the information I hold about you, to correct it, or to delete it. Write through the contact page.',
        ],
        action: { label: 'Contact', page: 'contact' },
      },
    ],
  },
  he: {
    seo: {
      title: 'פרטיות',
      description: 'איזה מידע האתר הזה אוסף, למה, ולאן הוא מגיע.',
    },
    eyebrow: 'פרטיות',
    title: 'פרטיות',
    lead: 'איזה מידע האתר הזה אוסף, למה, ולאן הוא מגיע. בקצרה: רק מה שבוחרים לשלוח אליי, והמידע הטכני הרגיל שנוצר בזמן השימוש באתר.',
    updated: 'עדכון אחרון: אוקטובר 2026',
    sections: [
      {
        heading: 'מי אחראי',
        body: [
          'האתר שייך ל־Martin Gusin, שאחראי למידע שמתואר כאן. לכל שאלה בנושא אפשר לכתוב דרך עמוד יצירת הקשר.',
        ],
        action: { label: 'יצירת קשר', page: 'contact' },
      },
      {
        heading: 'כששולחים הודעה',
        body: [
          'טופס יצירת הקשר מבקש שם, כתובת אימייל וכמה מילים על הפרויקט. אפשר להוסיף גם מספר טלפון, את סוג הפרויקט, שם של עסק או פרויקט, קישור רלוונטי ומתי תרצו להתחיל.',
          'ההודעה משמשת רק כדי לחזור אליכם ולדבר על הפרויקט. היא לא מצורפת לרשימת תפוצה, לא נמכרת ולא מועברת לצורכי שיווק.',
          'ההודעה נשמרת במסד נתונים פרטי שמתארח ב־Supabase, ועותק שלה מגיע אליי באימייל דרך Resend, שירות לשליחת אימיילים. היא נשמרת בלי כתובת ה־IP שלכם ובלי מידע אחר על המכשיר שלכם, ונשמרת כל עוד היא נדרשת לצורך טיפול בפנייה.',
          'הטופס משתמש גם בשדה נסתר ובבדיקת זמן בסיסית כדי לצמצם ספאם אוטומטי. המידע הזה לא משמש לזיהוי שלכם.',
        ],
      },
      {
        heading: 'מידע טכני',
        body: [
          'האתר מתארח ב־Vercel. במסגרת הפעלת האתר, שירות האחסון עשוי לרשום מידע טכני כמו כתובת IP, סוג הדפדפן, העמוד שהתבקש ומועד הבקשה, לצורך אספקת האתר ואבטחתו. אני לא משתמש במידע הזה כדי לזהות מבקרים.',
        ],
      },
      {
        heading: 'עוגיות ואחסון',
        body: [
          'האתר שומר עוגייה אחת משלו, NEXT_LOCALE, ורק כשמשתמשים בהחלפת השפה. היא זוכרת את השפה שנבחרה למשך שנה, ולא משמשת למעקב.',
          'תפריט הנגישות עשוי לשמור את הגדרות התצוגה שלכם בדפדפן, כדי שיישארו בין ביקור לביקור.',
        ],
      },
      {
        heading: 'ניתוח נתונים',
        body: [
          'כרגע אין באתר כלי ניתוח נתונים או מעקב פרסומי. העמוד הזה יעודכן לפני שיתווסף כלי כזה.',
        ],
      },
      {
        heading: 'שירותים נוספים',
        body: ['כמה שירותים הם חלק מהאופן שבו האתר עובד:'],
        list: [
          'Vercel מארחת את האתר ומגישה את העמודים שלו.',
          'Supabase מארחת את מסד הנתונים הפרטי שבו נשמרות ההודעות מטופס יצירת הקשר.',
          'Resend מעבירה עותק של כל הודעה מטופס יצירת הקשר לתיבת הדואר שלי.',
          'Enable מספקת את תפריט הנגישות. הסקריפט שלה נטען מהשרתים של Enable (cdn.enable.co.il), כך שהדפדפן שלכם מתחבר אליהם, והם מקבלים את המידע הטכני של הבקשה הזאת, כמו כתובת ה־IP.',
          'הגופנים, התמונות ותצוגת הווידאו מוגשים מהאתר עצמו. אין באתר סרטונים מוטמעים, מפות או רכיבים של רשתות חברתיות.',
          'קישורים לאתרים אחרים, כמו אתר חי של פרויקט, נפתחים בלשונית חדשה בלי להעביר אליהם את כתובת העמוד שממנו יצאתם. מדיניות הפרטיות של אותו אתר חלה על השימוש בו.',
        ],
      },
      {
        heading: 'הזכויות שלכם',
        body: [
          'אפשר לבקש לראות את המידע שיש לי עליכם, לתקן אותו או למחוק אותו. כתבו לי דרך עמוד יצירת הקשר.',
        ],
        action: { label: 'יצירת קשר', page: 'contact' },
      },
    ],
  },
}
