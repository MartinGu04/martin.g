/*
 * QA-ONLY COPY for the scene and world demonstration (preview builds only, see
 * src/lib/specimen.ts). Not production copy and not reviewed; deliberately outside the
 * dictionaries and the release gate. Project titles, summaries and disciplines come from
 * the approved content; these strings only label the demonstration.
 */
export const scenesCopy = {
  title: { en: 'Scenes and worlds', he: 'סצנות ועולמות' },
  note: {
    en: 'Demonstration of the scene grammar. Project worlds use provisional palettes; this is not a case study.',
    he: 'הדגמה של דקדוק הסצנות. עולמות הפרויקטים משתמשים בפלטות זמניות; זה אינו חקר מקרה.',
  },
  worlds: {
    brand: { en: 'Scene · MARTIN.G world', he: 'סצנה · העולם של MARTIN.G' },
    on: { en: 'Scene · ON world (provisional palette)', he: 'סצנה · העולם של ON (פלטה זמנית)' },
    miMaMo: {
      en: 'Scene · mi-ma-mo world (provisional palette)',
      he: 'סצנה · העולם של mi-ma-mo (פלטה זמנית)',
    },
    confidential: { en: 'Scene · confidential world', he: 'סצנה · העולם החסוי' },
  },
  transitions: {
    wipe: { en: 'Transition: wipe to full bleed', he: 'מעבר: פתיחה לרוחב מלא' },
    split: { en: 'Transition: center split', he: 'מעבר: פיצול מהמרכז' },
    cut: { en: 'Transition: hard cut', he: 'מעבר: חיתוך חד' },
  },
  photo: { en: 'Photography, in production', he: 'צילום, בהפקה' },
  fragment: {
    en: 'Illustrative interface fragment, not product data',
    he: 'קטע ממשק להמחשה, לא נתוני מוצר',
  },
} as const
