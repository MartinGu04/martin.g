import type { Locale } from '@/i18n/config'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import type { Block, Media } from '@/content/schema'
import { Grid } from '@/components/layout/Grid'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import styles from './ProjectMedia.module.css'

type MediaBlock = Extract<Block, { type: 'media' | 'sequence' }>

function isMediaBlock(block: Block): block is MediaBlock {
  return block.type === 'media' || block.type === 'sequence'
}

/** Landscape views take the full row; portrait views and phone screens are set narrower. */
function shapeOf(media: Media): 'wide' | 'portrait' | 'phone' {
  if (media.kind !== 'image') return 'wide'
  const ratio = media.src.width / media.src.height
  if (ratio < 0.7) return 'phone'
  return ratio < 1.4 ? 'portrait' : 'wide'
}

/**
 * Phase 4: the project's real media, in order, with short captions. Only media blocks are
 * rendered; the long-form block renderer (chapters, statements, text, facts) is Phase 5,
 * and any other block fails the build rather than disappearing silently.
 */
export function ProjectMedia({
  story,
  locale,
  showcase,
}: {
  story: readonly Block[]
  locale: Locale
  showcase: ShowcaseCopy
}) {
  const unsupported = story.find((block) => !isMediaBlock(block))
  if (unsupported) throw new Error(`ProjectMedia: '${unsupported.type}' blocks arrive in Phase 5.`)
  const blocks = story.filter(isMediaBlock)

  return (
    <Grid className={styles.grid}>
      {blocks.map((block, i) =>
        block.type === 'media' ? (
          <Reveal key={i} className={`col-content ${styles.block}`}>
            <MediaFrame
              media={block.media}
              locale={locale}
              sizes="(width >= 75rem) 84vw, 100vw"
              caption={
                block.media.kind === 'video'
                  ? `${showcase.film.title}. ${showcase.film.note}`
                  : block.caption?.[locale]
              }
              videoLabels={showcase.film}
            />
          </Reveal>
        ) : (
          <ul key={i} role="list" className={`col-content ${styles.sequence}`}>
            {block.items.map(({ media, caption }, j) => (
              <Reveal as="li" key={j} order={j % 2} className={styles[shapeOf(media)]}>
                <MediaFrame
                  media={media}
                  locale={locale}
                  sizes={
                    shapeOf(media) === 'wide'
                      ? '(width >= 75rem) 84vw, 100vw'
                      : '(width >= 48rem) 40vw, 100vw'
                  }
                  caption={caption?.[locale]}
                />
              </Reveal>
            ))}
          </ul>
        ),
      )}
    </Grid>
  )
}
