import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * The approved MG symbol's vector path and viewBox, read from public/brand/martin-g-symbol.svg
 * at build time (pages are statically generated), so inline uses never copy or redraw it.
 */
export function symbolGeometry(): { d: string; width: number; height: number } {
  const svg = readFileSync(path.join(process.cwd(), 'public/brand/martin-g-symbol.svg'), 'utf8')
  const box = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const d = svg.match(/<path d="([^"]+)"/)?.[1]
  if (!box || !d) throw new Error('martin-g-symbol.svg: no viewBox or path.')
  return { d, width: Number(box[1]), height: Number(box[2]) }
}
