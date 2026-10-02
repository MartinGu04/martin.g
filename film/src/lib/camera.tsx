/**
 * A small 3D camera on top of CSS 3D transforms. Scenes describe a world in pixels (origin at
 * the center of the frame, z towards the viewer) and a camera that moves through it, so the
 * shots are choreographed as camera moves, not as zooms on flat pictures.
 *
 * The camera's (x, y, z) is the point on its focal plane: a plane at z = cam.z renders at
 * scale 1. Depth of field blurs planes by their distance from the focal plane; planes that
 * come close to the lens fade out instead of clipping through it.
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { useVideoConfig } from 'remotion'

export interface Cam {
  x: number
  y: number
  z: number
  /** Degrees. Pitch, yaw, roll. */
  rx?: number
  ry?: number
  rz?: number
  /** Blur in px per 1000px away from the focal plane (0 = everything sharp). */
  dof?: number
  /** World z of the plane in focus (rack focus). Defaults to cam.z (the scale-1 plane). */
  focusZ?: number
}

interface CamCtx extends Required<Cam> {
  P: number
}
const Ctx = createContext<CamCtx | null>(null)

export function useCam() {
  const c = useContext(Ctx)
  if (!c) throw new Error('Plane outside Stage')
  return c
}

/** Perspective distance for a frame: about a 37 degree vertical field of view at 1080px. */
export function perspectiveFor(width: number, height: number) {
  return Math.max(width, height) * 0.84
}

export function Stage({
  cam,
  children,
  style,
}: {
  cam: Cam
  children: ReactNode
  style?: CSSProperties
}) {
  const { width, height } = useVideoConfig()
  const P = perspectiveFor(width, height)
  const c: CamCtx = { rx: 0, ry: 0, rz: 0, dof: 0, focusZ: cam.z, ...cam, P }
  return (
    <Ctx.Provider value={c}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          perspective: `${P}px`,
          perspectiveOrigin: '50% 50%',
          ...style,
        }}
      >
        <div
          style={{
            position: 'absolute',
            insetInlineStart: width / 2,
            insetBlockStart: height / 2,
            transformStyle: 'preserve-3d',
            transform:
              `translateZ(${P}px) rotateZ(${-c.rz}deg) rotateX(${-c.rx}deg) rotateY(${-c.ry}deg) ` +
              `translateZ(${-P}px) translate3d(${-c.x}px, ${-c.y}px, ${-c.z}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </Ctx.Provider>
  )
}

export interface PlaneProps {
  x?: number
  y?: number
  z?: number
  rx?: number
  ry?: number
  rz?: number
  scale?: number
  w: number
  h: number
  opacity?: number
  /** Excluded from depth of field (lines, type that must stay sharp). */
  sharp?: boolean
  /** Extra blur in px. */
  blur?: number
  children?: ReactNode
  style?: CSSProperties
}

/** A flat object in the world. Fades out as it nears the lens; blurs off the focal plane. */
export function Plane({
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  scale = 1,
  w,
  h,
  opacity = 1,
  sharp,
  blur = 0,
  children,
  style,
}: PlaneProps) {
  const c = useCam()
  const dist = c.z + c.P - z // distance from the eye along the view axis (ignores rotation)
  const near = Math.min(1, Math.max(0, (dist - c.P * 0.06) / (c.P * 0.22)))
  const o = opacity * near
  if (o <= 0.002) return null
  const off = Math.abs(z - c.focusZ)
  const b = blur + (sharp ? 0 : (c.dof * off) / 1000)
  return (
    <div
      style={{
        position: 'absolute',
        insetInlineStart: 0,
        insetBlockStart: 0,
        width: w,
        height: h,
        transformStyle: 'preserve-3d',
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale}) translate(-50%, -50%)`,
        opacity: o,
        filter: b > 0.25 ? `blur(${b.toFixed(2)}px)` : undefined,
        transformOrigin: '0 0',
        backfaceVisibility: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
