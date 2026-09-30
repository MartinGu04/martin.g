import type { HomeCopy } from '@/i18n/dictionaries/home'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { Ltr } from '@/components/type/Ltr'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import styles from './AboutScene.module.css'

/**
 * Scene 09, About: the person behind the system. Warmer and calmer than everything
 * before it: a soft overhead light, no drawn grid, more air, concise text.
 */
export function AboutScene({ copy }: { copy: HomeCopy['about'] }) {
  return (
    <Scene
      atmosphere={{ light: 'pool', grid: 'hidden', texture: 'grain', vignette: true }}
      aria-labelledby="about-title"
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <Eyebrow as="h2" id="about-title" muted={false} className="col-full">
          {copy.title}
        </Eyebrow>
        <Reveal as="p" variant="mask" className={`t-display-xl ${styles.name}`}>
          <Ltr>{copy.name}</Ltr>
        </Reveal>
        <p className={`t-label muted ${styles.role}`}>{copy.role}</p>
        <div className={styles.lines}>
          {copy.lines.map((line, i) => (
            <Reveal
              as="p"
              key={line}
              order={i}
              className={i === 0 ? 't-heading-2' : 't-lead muted'}
            >
              {line}
            </Reveal>
          ))}
        </div>
      </Grid>
    </Scene>
  )
}
