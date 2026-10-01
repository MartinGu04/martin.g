import Image, { type StaticImageData } from 'next/image'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ConfidentialProject, HexColor } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Name } from '@/components/type/Name'
import { SystemDiagram } from '@/components/project/SystemDiagram'
import { Scene } from '@/components/scene/Scene'
import styles from './WorkBridge.module.css'

export interface WorkChapter {
  /** In-page anchor of the scene that shows the work. */
  href: `#${string}`
  number: string
  title: string
  /** Who the project is, beside its name and clearly secondary to it (ON's own identity). */
  identity?: string
  /** One short line naming the world the chapter opens. */
  line: string
  /** The world's own accent: the chapter's rule, number and focus color. */
  accent: HexColor
  /** A small glimpse of the world: a real crop, or the abstract geometry for Defense. */
  preview:
    | { kind: 'image'; src: StaticImageData; position?: string }
    | { kind: 'diagram'; pattern: ConfidentialProject['cover']['pattern'] }
}

/**
 * Selected Work as the table of contents for the worlds ahead: three chapters (ON,
 * המחלבה, Defense Systems), each a number, a title, one line, and a small glimpse of the
 * world in its own accent (ON also carries its own identity, quieter than its name). The
 * chapters sit at the center of a viewport-tall frame, so the table of contents is what the
 * visitor sees between the hero and the first world. The glimpse is a real crop (the ON website, a sanitized
 * המחלבה screen) or, for Defense Systems, its generated geometry; it rests muted and comes
 * to full color when the chapter is pointed at or focused. Each chapter is one link to its
 * scene; the glimpse is decorative (the scene below shows the work itself).
 */
export function WorkBridge({ dict, chapters }: { dict: Dictionary; chapters: WorkChapter[] }) {
  return (
    <Scene as="div" size="frame" theme={worlds.graphite} className={styles.bridge}>
      <Grid className={styles.grid}>
        <div className={styles.entry}>
          <Eyebrow as="h2" id="work-title" index="01" muted={false} className={styles.label}>
            {dict.work.selectedTitle}
          </Eyebrow>
        </div>
        <ol role="list" className={styles.chapters}>
          {chapters.map((chapter) => (
            <li key={chapter.href} style={{ '--chapter': chapter.accent } as StyleWithVars}>
              <a href={chapter.href} className={styles.chapter}>
                <span className={styles.rule} aria-hidden="true" />
                <IndexNumber value={chapter.number} className={`t-label ${styles.number}`} />
                <span className={styles.title}>
                  <span className="t-heading-2">
                    <Name>{chapter.title}</Name>
                  </span>
                  {chapter.identity ? (
                    <span className={`t-body-l ${styles.identity}`}>{chapter.identity}</span>
                  ) : null}
                </span>
                <span className={`t-body-l muted ${styles.line}`}>{chapter.line}</span>
                <span className={styles.preview} aria-hidden="true">
                  {chapter.preview.kind === 'image' ? (
                    <Image
                      src={chapter.preview.src}
                      alt=""
                      sizes="10rem"
                      className={styles.image}
                      style={{ objectPosition: chapter.preview.position ?? 'top' }}
                    />
                  ) : (
                    <span className={styles.diagram}>
                      <SystemDiagram pattern={chapter.preview.pattern} still />
                    </span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </Grid>
    </Scene>
  )
}
