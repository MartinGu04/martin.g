'use client'

import { usePathname } from 'next/navigation'
import { localeCookie, localeMeta, type Locale } from '@/i18n/config'

interface LocaleSwitchProps {
  current: Locale
  target: Locale
  /** Visually hidden prefix, e.g. "Switch language". */
  label: string
  className?: string
}

/**
 * Links to the same page in the other locale. A plain anchor: the document direction and
 * root layout change, so a full navigation is correct. Works without JS; with JS the
 * choice is remembered in a cookie that the proxy reads for unprefixed URLs.
 */
export function LocaleSwitch({ current, target, label, className }: LocaleSwitchProps) {
  const pathname = usePathname() ?? `/${current}`
  const href = pathname.replace(new RegExp(`^/${current}(?=/|$)`), `/${target}`)
  return (
    <a
      className={className}
      href={href}
      hrefLang={target}
      onClick={() => {
        document.cookie = `${localeCookie}=${target}; path=/; max-age=31536000; samesite=lax`
      }}
    >
      <span className="visually-hidden">{label}: </span>
      <span lang={target} dir={localeMeta[target].dir}>
        {localeMeta[target].nativeName}
      </span>
    </a>
  )
}
