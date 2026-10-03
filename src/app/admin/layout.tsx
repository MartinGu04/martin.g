import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@/styles/global.css'
import { fontVariables } from '@/styles/fonts'
import { themeVars } from '@/components/theme/ThemeScope'
import { adminTheme } from '@/components/admin/theme'

/*
 * The private admin's own root layout (Phase 8B): English, left to right, outside the
 * public bilingual site, with none of its navigation, motion or third-party scripts. Every
 * admin page is rendered per request (it reads the session), so no lead data is ever
 * generated at build time or cached; requireAdmin() guards each page and action.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Admin · MARTIN.G', template: '%s · MARTIN.G Admin' },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: 'no-referrer',
}

export const viewport: Viewport = {
  themeColor: adminTheme.colors.surface0,
  colorScheme: 'dark',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables} style={themeVars(adminTheme)}>
      <body>{children}</body>
    </html>
  )
}
