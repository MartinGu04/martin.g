import { staticFile } from 'remotion'

/** Approved sources with their pixel sizes (film/public is filled by `pnpm assets`). */
export interface Source {
  src: string
  w: number
  h: number
}
const a = (path: string, w: number, h: number): Source => ({ src: staticFile(path), w, h })

export const assets = {
  symbol: a('brand/symbol.png', 968, 599),
  wordmark: a('brand/wordmark.png', 1335, 228),
  mm: {
    dashboard: a('work/mi-ma-mo/dashboard.png', 1901, 1033),
    focus: a('work/mi-ma-mo/dashboard-focus.png', 1090, 576),
    admin: a('work/mi-ma-mo/admin.png', 1470, 796),
    manager: a('work/mi-ma-mo/manager-view.png', 1470, 777),
    mobile: a('work/mi-ma-mo/mobile.png', 429, 867),
    week: a('work/mi-ma-mo/team-week.png', 1442, 538),
    weekView: a('work/mi-ma-mo/team-week-view.png', 1018, 538),
    weekNarrow: a('work/mi-ma-mo/team-week-narrow.png', 470, 538),
  },
  on: {
    home: a('work/on/site-home.jpg', 1605, 996),
    mobile: a('work/on/site-mobile.jpg', 390, 704),
    story: a('work/on/site-story.jpg', 1245, 996),
    symbol: a('work/on/symbol.png', 900, 469),
    venue: a('work/on/venue.jpg', 2000, 1333),
    patisserie: a('work/on/patisserie.jpg', 1600, 2000),
  },
  grain: [0, 1, 2, 3].map((i) => staticFile(`grain/${i}.png`)),
} as const
