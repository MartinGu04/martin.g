import type { Metadata } from 'next'
import Link from 'next/link'
import '@/styles/global.css'
import { localeMeta } from '@/i18n/config'
import { notFoundCopy } from '@/i18n/dictionaries/not-found'
import { Cell, Grid } from '@/components/layout/Grid'

export const metadata: Metadata = {
  title: `404 · MARTIN.G`,
}

/** For URLs outside any locale (e.g. an unsupported locale prefix). Bilingual by design. */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main id="main">
          <Grid>
            <Cell span={{ base: 4, md: 4, lg: 6 }} style={{ paddingBlock: 'var(--space-section)' }}>
              <p className="label muted">404</p>
              <h1>{notFoundCopy.en.title}</h1>
              <p>
                <Link href="/en" hrefLang="en">
                  {notFoundCopy.en.back}
                </Link>
              </p>
            </Cell>
            <Cell span={{ base: 4, md: 4, lg: 6 }} style={{ paddingBlock: 'var(--space-section)' }}>
              <div lang="he" dir={localeMeta.he.dir}>
                <p className="label muted">404</p>
                <h2>{notFoundCopy.he.title}</h2>
                <p>
                  <Link href="/he" hrefLang="he">
                    {notFoundCopy.he.back}
                  </Link>
                </p>
              </div>
            </Cell>
          </Grid>
        </main>
      </body>
    </html>
  )
}
