import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Intrinsic size of a PNG or JPEG, read from its header. Under Vitest a static image
 * import is the file's path, not Next's StaticImageData, so tests measure the file itself.
 */
export function imageSize(src: unknown): { width: number; height: number } {
  if (typeof src === 'object' && src !== null && 'width' in src && 'height' in src)
    return src as { width: number; height: number }
  const file = path.join(process.cwd(), String(src).replace(/^\//, ''))
  const buf = readFileSync(file)
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  let offset = 2
  while (offset < buf.length) {
    const marker = buf[offset + 1]!
    const length = buf.readUInt16BE(offset + 2)
    // SOF0..SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) }
    }
    offset += 2 + length
  }
  throw new Error(`imageSize: no size found in ${file}`)
}
