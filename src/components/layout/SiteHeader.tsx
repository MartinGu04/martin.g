import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { Monogram, Wordmark } from '@/components/brand/BrandMark'
import { LocaleSwitch } from '@/components/nav/LocaleSwitch'
import { Cell, Grid } from './Grid'
import styles from './SiteHeader.module.css'

interface SiteHeaderProps {
  locale: Locale
  dict: Dictionary
}

export function SiteHeader({ locale, dict }: SiteHeaderProps) {
  const other: Locale = locale === 'en' ? 'he' : 'en'
  return (
    <header className={styles.header}>
      <Grid className={styles.bar}>
        <Cell span={{ base: 2, md: 4, lg: 6 }} className={styles.brandCell}>
          <Link href={`/${locale}`} className={styles.home}>
            <span className="visually-hidden">{dict.a11y.homeLink}</span>
            {/* Desktop and tablet: wordmark. Compact mobile: monogram. Both provisional. */}
            <Wordmark decorative className={styles.wordmark} />
            <Monogram decorative className={styles.monogram} />
          </Link>
        </Cell>
        <Cell span={{ base: 2, md: 4, lg: 6 }} className={styles.navCell}>
          <nav aria-label={dict.a11y.primaryNav}>
            <ul role="list" className={styles.navList}>
              <li>
                <Link href={`/${locale}#work`} className={styles.navLink}>
                  {dict.nav.work}
                </Link>
              </li>
              <li>
                <LocaleSwitch
                  current={locale}
                  target={other}
                  label={dict.a11y.switchLanguage}
                  className={styles.navLink}
                />
              </li>
            </ul>
          </nav>
        </Cell>
      </Grid>
    </header>
  )
}
