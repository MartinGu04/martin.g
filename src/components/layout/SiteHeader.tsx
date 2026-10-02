import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ContactCopy } from '@/i18n/dictionaries/contact'
import { primaryNav } from '@/lib/navigation'
import { Monogram, Wordmark } from '@/components/brand/BrandMark'
import { LocaleSwitch } from '@/components/nav/LocaleSwitch'
import { Grid } from './Grid'
import { HeaderWorld } from './HeaderWorld'
import styles from './SiteHeader.module.css'

interface SiteHeaderProps {
  locale: Locale
  dict: Dictionary
  contact: Pick<ContactCopy, 'nav'>
}

/**
 * Global header: quiet, architectural, aligned to the page grid, sticky. Neutral MARTIN.G
 * colors by default; while scrolling it takes on the semantic colors of the scene beneath
 * it (HeaderWorld), so it belongs to each world and never becomes unreadable.
 *   compact (< 768px): MG monogram, minimal navigation, no menu drawer
 *   tablet/desktop:    MARTIN.G wordmark at or above its legible minimum size
 */
export function SiteHeader({ locale, dict, contact }: SiteHeaderProps) {
  return (
    <header className={styles.header} data-header="">
      <Grid className={styles.bar}>
        <div className={styles.brand}>
          <Link href={`/${locale}`} className={styles.home}>
            <span className="visually-hidden">{dict.a11y.homeLink}</span>
            <Wordmark decorative className={styles.wordmark} height="var(--header-mark)" />
            <Monogram decorative className={styles.monogram} height="var(--header-mark)" />
          </Link>
        </div>
        <nav aria-label={dict.a11y.primaryNav} className={styles.nav}>
          <ul role="list" className={styles.list}>
            {primaryNav(locale, dict, contact).map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={`t-label ${styles.link}`}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <LocaleSwitch current={locale} label={dict.a11y.switchLanguage} className="t-label" />
            </li>
          </ul>
        </nav>
      </Grid>
      <HeaderWorld />
    </header>
  )
}
