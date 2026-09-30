/** Mirrors the media queries in tokens.css. CSS cannot read variables in media queries. */
export const breakpoints = {
  tablet: 768,
  desktop: 1200,
  wide: 1600,
} as const

export const columns = { mobile: 4, tablet: 8, desktop: 12 } as const
