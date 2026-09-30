import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { format } from '@/i18n/get-dictionary'
import { primaryNav } from '@/lib/navigation'
import { Wordmark } from '@/components/brand/BrandMark'
import { LocaleSwitch } from '@/components/nav/LocaleSwitch'
import { Ltr } from '@/components/type/Ltr'
import { Grid } from './Grid'
import { Rule } from './Rule'
import styles from './SiteFooter.module.css'

interface SiteFooterProps {
  locale: Locale
  dict: Dictionary
}

/**
 * Base footer: identity, positioning, copyright and the same real destinations as the
 * header. No social or contact links until those destinations exist.
 */
export function SiteFooter({ locale, dict }: SiteFooterProps) {
  const year = new Date().getFullYear()
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
          <ul role="list" className={styles.links}>
            {primaryNav(locale, dict).map((item) => (
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
        </div>
      </Grid>
    </footer>
  )
}
