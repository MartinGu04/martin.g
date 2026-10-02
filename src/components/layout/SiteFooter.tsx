import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ContactCopy } from '@/i18n/dictionaries/contact'
import { format } from '@/i18n/get-dictionary'
import { primaryNav, trustNav } from '@/lib/navigation'
import { Wordmark } from '@/components/brand/BrandMark'
import { LocaleSwitch } from '@/components/nav/LocaleSwitch'
import { Ltr } from '@/components/type/Ltr'
import { Grid } from './Grid'
import { Rule } from './Rule'
import styles from './SiteFooter.module.css'

interface SiteFooterProps {
  locale: Locale
  dict: Dictionary
  contact: Pick<ContactCopy, 'nav' | 'footer'>
}

/**
 * Base footer: identity, positioning, copyright and the real destinations: the work, the
 * project inquiry, Privacy and Accessibility, and the language switch. Restrained, one
 * line of links. No social links, address, phone or registration details: none exist.
 */
export function SiteFooter({ locale, dict, contact }: SiteFooterProps) {
  const year = new Date().getFullYear()
  const links = [...primaryNav(locale, dict, contact), ...trustNav(locale, contact)]
  return (
    <footer className={styles.footer}>
      <Grid className={styles.grid}>
        <Rule className="col-full" decorative />
        <div className={`col-aside ${styles.identity}`}>
          <Wordmark label={dict.site.name} height="1.75rem" />
        </div>
        <div className={`col-main ${styles.statement}`}>
          <p className="t-lead">{dict.site.positioning}</p>
          <p className="t-lead muted">{dict.site.principle}</p>
        </div>
        <div className={`col-full ${styles.meta}`}>
          <p className="t-small muted">
            <Ltr>{format(dict.footer.copyright, { year })}</Ltr>
          </p>
          <nav aria-label={contact.footer.label} className={styles.nav}>
            <ul role="list" className={styles.links}>
              {links.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={`t-label ${styles.link}`}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <LocaleSwitch
                  current={locale}
                  label={dict.a11y.switchLanguage}
                  className="t-label"
                />
              </li>
            </ul>
          </nav>
        </div>
      </Grid>
    </footer>
  )
}
