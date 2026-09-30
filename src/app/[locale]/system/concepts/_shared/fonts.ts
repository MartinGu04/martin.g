import localFont from 'next/font/local'

/*
 * TEMPORARY concept fonts for the Phase 2 art-direction review. Imported only by the concept
 * routes, so production pages never load them. SIL OFL 1.1 (licenses in src/fonts/concepts).
 * Each face is limited to its script with unicode-range, like the production fonts.
 */

export const archivo = localFont({
  src: '../../../../../fonts/concepts/archivo-latin-wdth-wght.woff2',
  variable: '--concept-archivo',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
  declarations: [
    { prop: 'font-stretch', value: '62% 125%' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})

export const instrument = localFont({
  src: '../../../../../fonts/concepts/instrument-sans-latin-wdth-wght.woff2',
  variable: '--concept-instrument',
  weight: '400 700',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
  declarations: [
    { prop: 'font-stretch', value: '75% 100%' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})

export const hebrewStrong = localFont({
  src: '../../../../../fonts/concepts/noto-sans-hebrew-hebrew-wdth-wght.woff2',
  variable: '--concept-hebrew',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
  declarations: [
    { prop: 'font-stretch', value: '62.5% 100%' },
    {
      prop: 'unicode-range',
      value: 'U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F',
    },
  ],
})

export const conceptFontVariables = `${archivo.variable} ${instrument.variable} ${hebrewStrong.variable}`
