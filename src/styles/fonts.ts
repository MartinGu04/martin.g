import localFont from 'next/font/local'

/*
 * Production typography: two self-hosted variable families (SIL OFL 1.1, licenses in
 * src/fonts). Rationale in docs/DESIGN-SYSTEM.md.
 *
 * Each family is limited to its script with unicode-range, so mixed runs (brand names,
 * numerals and English terms inside Hebrew, and the reverse) resolve per character.
 * Digits and punctuation always come from the Latin family, so numerals match in both
 * locales.
 *
 * adjustFontFallback is off on purpose: Next's generated fallback faces carry no
 * unicode-range and would capture the other script's glyphs. The role stacks in
 * fonts.css end in system fonts instead.
 */

/** Hanken Grotesk: neutral, slightly open grotesk; Latin text, display and all numerals. */
export const latinFont = localFont({
  src: '../fonts/hanken-grotesk-latin-wght.woff2',
  variable: '--font-latin',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
  // next/font reads options statically: the range must be a literal.
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})

/** Noto Sans Hebrew: matched stroke and color to Hanken Grotesk at the same weights. */
export const hebrewFont = localFont({
  src: '../fonts/noto-sans-hebrew-hebrew-wght.woff2',
  variable: '--font-hebrew',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
  declarations: [
    {
      prop: 'unicode-range',
      value: 'U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F',
    },
  ],
})

/** Class names that expose --font-latin and --font-hebrew on <html>. */
export const fontVariables = `${latinFont.variable} ${hebrewFont.variable}`
