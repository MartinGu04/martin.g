import type { Locale } from '@/i18n/config'
import { introCopy } from '@/i18n/dictionaries/intro'
import { introScript } from './intro-script'
import styles from './BrandIntro.module.css'

interface BrandIntroProps {
  locale: Locale
  /** The brand name, the intro's accessible name. */
  name: string
}

/**
 * The MARTIN.G brand film as the site's opening, once per browser session, on the
 * homepage only (intro-script.ts). Mounted first in <body>, above the page, which renders
 * normally beneath it: the server sends only this script, so without scripting, with
 * reduced motion, on any other page and on every later load of the session there is no
 * layer, no video element and no video request.
 */
export function BrandIntro({ locale, name }: BrandIntroProps) {
  const { intro = '', film = '', skip = '' } = styles
  const script = introScript({
    home: `/${locale}`,
    name,
    skip: introCopy[locale].skip,
    classes: { intro, film, skip: `${skip} t-label` },
  })
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
