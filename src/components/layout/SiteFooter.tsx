import type { Dictionary } from '@/i18n/dictionaries'
import { format } from '@/i18n/get-dictionary'
import { Monogram } from '@/components/brand/BrandMark'
import { Ltr } from '@/components/type/Ltr'
import { Cell, Grid } from './Grid'
import styles from './SiteFooter.module.css'

export function SiteFooter({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <Grid className={styles.bar}>
        <Cell span={{ base: 2, md: 4, lg: 6 }}>
          <Monogram decorative height="1rem" />
        </Cell>
        <Cell span={{ base: 2, md: 4, lg: 6 }} className={styles.end}>
          <p className="muted">
            <Ltr>{format(dict.footer.copyright, { year })}</Ltr>
          </p>
        </Cell>
      </Grid>
    </footer>
  )
}
