'use client'

import { usePathname } from 'next/navigation'
import { localeCookie, localeMeta, locales, type Locale } from '@/i18n/config'
import styles from './LocaleSwitch.module.css'

interface LocaleSwitchProps {
  current: Locale
  /** Accessible group label, e.g. "Switch language". */
  label: string
  className?: string
  /**
   * On the narrowest screens (under 360px) show only the language to switch to: the page is
   * already in the other one. Used by the header; the footer always shows both.
   */
  compact?: boolean
}

/**
 * "EN / HE". Each code links to the same page in that locale. Plain anchors: the document
 * direction and root layout change, so a full navigation is correct. Works without JS;
 * with JS the choice is remembered in a cookie that the proxy reads for unprefixed URLs.
 *
 * Accessible names start with the visible code (WCAG 2.5.3) and add the language's own
 * name, marked with its language: "EN English", "HE עברית". In the header on screens under
 * 360px (`compact`) only the other language's code is shown.
 */
export function LocaleSwitch({ current, label, className, compact }: LocaleSwitchProps) {
  const pathname = usePathname() ?? `/${current}`
  const hrefFor = (target: Locale) =>
    pathname.replace(new RegExp(`^/${current}(?=/|$)`), `/${target}`)

  return (
    <span
      role="group"
      aria-label={label}
      className={[styles.switch, compact ? styles.compact : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {locales.map((target, i) => (
        <span key={target} className={styles.item}>
          {i > 0 ? (
            <span aria-hidden="true" className={styles.divider}>
              /
            </span>
          ) : null}
          <a
            className={styles.link}
            href={hrefFor(target)}
            hrefLang={target}
            aria-current={target === current ? 'true' : undefined}
            onClick={() => {
              document.cookie = `${localeCookie}=${target}; path=/; max-age=31536000; samesite=lax`
            }}
          >
            <span dir="ltr">{target.toUpperCase()}</span>
            <span className="visually-hidden" lang={target} dir={localeMeta[target].dir}>
              {' '}
              {localeMeta[target].nativeName}
            </span>
          </a>
        </span>
      ))}
    </span>
  )
}
