import { Composition } from 'remotion'
import { Film } from './Film'
import { FPS, s, versions } from './config/timeline'

/**
 * Two native films, not one export cropped twice:
 *   Desktop  16:9, 1920×1080 design space (rendered at 2× for the 3840×2160 master)
 *   Mobile   9:16, 1080×1920, re-directed shot by shot for the tall frame
 */
export function Root() {
  return (
    <>
      {(['desktop', 'mobile'] as const).map((id) => {
        const v = versions[id]
        return (
          <Composition
            key={id}
            id={id === 'desktop' ? 'Desktop' : 'Mobile'}
            component={Film as never}
            durationInFrames={s(v.cues.end)}
            fps={FPS}
            width={v.width}
            height={v.height}
            defaultProps={{ version: id }}
          />
        )
      })}
    </>
  )
}
