import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { primaryNav, type NavLabels } from '@/lib/navigation'
import { Monogram, Wordmark } from '@/components/brand/BrandMark'
import { LocaleSwitch } from '@/components/nav/LocaleSwitch'
import { BRAND_FILM_PLAY_ATTRIBUTE } from '@/components/intro/intro-script'
import { introCopy } from '@/i18n/dictionaries/intro'
import { Grid } from './Grid'
import { HeaderWorld } from './HeaderWorld'
import styles from './SiteHeader.module.css'

interface SiteHeaderProps {
  locale: Locale
  dict: Dictionary
  labels: NavLabels
}

/**
 * Global header: quiet, architectural, aligned to the page grid, sticky. Neutral MARTIN.G
 * colors by default; while scrolling it takes on the semantic colors of the scene beneath
 * it (HeaderWorld), so it belongs to each world and never becomes unreadable.
 *   compact (< 768px): MG monogram, minimal navigation, no menu drawer
 *   tablet/desktop:    MARTIN.G wordmark at or above its legible minimum size
 * Film plays the brand film again, on any page and as often as asked (BrandIntro's runtime
 * listens for it). It is a button, not a destination, and it is shown only where the film
 * can play: with scripting, without reduced motion, in a browser that can decode it.
 */
export function SiteHeader({ locale, dict, labels }: SiteHeaderProps) {
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
            {primaryNav(locale, dict, labels).map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={`t-label ${styles.link}`}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li className={styles.filmItem}>
              <button
                type="button"
                className={`t-label ${styles.link} ${styles.film}`}
                {...{ [BRAND_FILM_PLAY_ATTRIBUTE]: '' }}
              >
                <span className={styles.filmLabel}>{introCopy[locale].film}</span>
              </button>
            </li>
            <li>
              <LocaleSwitch
                current={locale}
                label={dict.a11y.switchLanguage}
                className="t-label"
                compact
              />
            </li>
          </ul>
        </nav>
      </Grid>
      <HeaderWorld />
    </header>
  )
}
