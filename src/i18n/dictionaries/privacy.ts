import type { Localized, ReviewStatus } from '../config'
import type { TrustPageCopy } from './legal'

/**
 * The privacy page (Phase 6). It describes only what the site actually does, audited in
 * Phase 6 (docs/ARCHITECTURE.md, "Privacy"):
 *
 *   - the contact form's fields; delivery by email through Resend; no database
 *   - Vercel hosting and its ordinary request logs
 *   - one first-party cookie, NEXT_LOCALE, set only by the language switch (one year)
 *   - the Enable accessibility menu, loaded from cdn.enable.co.il
 *   - no analytics yet (Vercel Web Analytics is planned for Phase 7: update this page first)
 *   - self-hosted fonts, images and video; no embeds; external links without a referrer
 *
 * If the Telegram notifier (src/lib/contact/notifiers.ts) is turned on, or analytics are
 * added, this copy must say so before it ships. Draft until Martin approves it.
 */
export const privacyReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
}

export const privacyCopy: Localized<TrustPageCopy> = {
  en: {
    seo: {
      title: 'Privacy',
      description: 'What this website collects, why, and where it goes.',
    },
    eyebrow: 'Privacy',
    title: 'Privacy',
    lead: 'What this website collects, why, and where it goes. In short: only what you choose to send me, and the ordinary technical data every website produces.',
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
          'The contact form asks for your name, your email address, what you want to build or improve, and a description of the problem. You may also add a business or project name, a link, the kind of project and when you would like to start.',
          'Your message is used only to reply to you and to talk about the project. It is not added to a mailing list, sold or shared for marketing.',
          'The website does not keep messages in a database. Each message is delivered to me by email through Resend, an email delivery service, and stays in my inbox for as long as the conversation needs it.',
          'The form also has a hidden field that catches automated spam, and it notes how long the form was open. Neither identifies you.',
        ],
      },
      {
        heading: 'Technical data',
        body: [
          'The website is hosted on Vercel. Like any web server, it records ordinary technical data when a page is requested, such as the IP address, the type of browser, the page and the time, and uses it to deliver the site and keep it secure. I do not use this data to identify visitors.',
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
          'Resend delivers messages from the contact form to my inbox.',
          'Enable provides the accessibility menu. Its script loads from Enable’s servers (cdn.enable.co.il), so your browser connects to them, and they receive the technical data of that request, such as your IP address.',
          'Fonts, images and the video preview are served by this website itself. There are no embedded videos, maps or social media widgets.',
          'Links to other websites, such as a project’s live site, open in a new tab without telling that site which page you came from. Their own privacy policies apply there.',
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
    lead: 'איזה מידע האתר הזה אוסף, למה, ולאן הוא מגיע. בקצרה: רק מה שבוחרים לשלוח אליי, והמידע הטכני הרגיל שכל אתר מייצר.',
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
          'טופס יצירת הקשר מבקש שם, כתובת אימייל, מה רוצים לבנות או לשפר ותיאור של הבעיה. אפשר להוסיף גם שם של עסק או פרויקט, קישור, את סוג הפרויקט ומתי תרצו להתחיל.',
          'ההודעה משמשת רק כדי לחזור אליכם ולדבר על הפרויקט. היא לא מצורפת לרשימת תפוצה, לא נמכרת ולא מועברת לצורכי שיווק.',
          'האתר לא שומר הודעות במסד נתונים. כל הודעה מגיעה אליי באימייל דרך Resend, שירות לשליחת אימיילים, ונשארת בתיבת הדואר שלי כל עוד השיחה צריכה אותה.',
          'בטופס יש גם שדה נסתר שתופס ספאם אוטומטי, והוא רושם כמה זמן הטופס היה פתוח. אף אחד מהם לא מזהה אתכם.',
        ],
      },
      {
        heading: 'מידע טכני',
        body: [
          'האתר מתארח ב־Vercel. כמו כל שרת אינטרנט, הוא רושם מידע טכני רגיל כשמבקשים עמוד, כמו כתובת IP, סוג הדפדפן, העמוד והשעה, ומשתמש בו כדי להגיש את האתר ולשמור על אבטחתו. אני לא משתמש במידע הזה כדי לזהות מבקרים.',
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
          'Resend מעבירה את ההודעות מטופס יצירת הקשר לתיבת הדואר שלי.',
          'Enable מספקת את תפריט הנגישות. הסקריפט שלה נטען מהשרתים של Enable (cdn.enable.co.il), כך שהדפדפן שלכם מתחבר אליהם, והם מקבלים את המידע הטכני של הבקשה הזאת, כמו כתובת ה־IP.',
          'הגופנים, התמונות ותצוגת הווידאו מוגשים מהאתר עצמו. אין באתר סרטונים מוטמעים, מפות או רכיבים של רשתות חברתיות.',
          'קישורים לאתרים אחרים, כמו האתר החי של פרויקט, נפתחים בלשונית חדשה בלי לספר לאתר ההוא מאיזה עמוד הגעתם. שם חלה מדיניות הפרטיות שלו.',
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
