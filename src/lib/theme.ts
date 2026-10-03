import type { HexColor, ProjectTheme } from '@/content/schema'

/** WCAG 2.x relative luminance of a #rrggbb color. */
export function luminance(hex: HexColor): number {
  const value = hex.slice(1)
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => {
    const c = Number.parseInt(value.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: HexColor, b: HexColor): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The brand's page background, --mg-black (--surface-0 in src/styles/tokens.css), for the
 * places CSS cannot reach: the theme-color meta and the web app manifest. A unit test keeps
 * it equal to the token. HeaderWorld then follows each scene's --surface-0 while scrolling.
 */
export const brandSurface: HexColor = '#060606'

const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * Validates a project theme against the system's accessibility floor. Returns a list of
 * problems (empty when the theme is usable). Checked in unit tests for every theme.
 *   - foreground and muted text >= 4.5:1 on both surfaces (WCAG AA body text)
 *   - accents >= 3:1 on the background (large text and UI components, WCAG 1.4.11)
 *   - the scheme matches the background's lightness (drives color-scheme for controls)
 */
export function themeIssues(theme: ProjectTheme): string[] {
  const issues: string[] = []
  const { colors } = theme
  for (const [name, value] of Object.entries(colors)) {
    if (value !== undefined && !HEX.test(value)) issues.push(`${name} must be #rrggbb`)
  }
  if (issues.length > 0) return issues

  for (const surface of ['surface0', 'surface1'] as const) {
    for (const text of ['text', 'textMuted'] as const) {
      const ratio = contrastRatio(colors[text], colors[surface])
      if (ratio < 4.5) issues.push(`${text} on ${surface} is ${ratio.toFixed(2)}:1 (needs 4.5)`)
    }
  }
  for (const accent of ['accent', 'accent2'] as const) {
    const value = colors[accent]
    if (!value) continue
    const ratio = contrastRatio(value, colors.surface0)
    if (ratio < 3) issues.push(`${accent} on surface0 is ${ratio.toFixed(2)}:1 (needs 3)`)
  }
  const light = luminance(colors.surface0) > 0.4
  if ((theme.scheme === 'light') !== light) issues.push(`scheme does not match surface0 lightness`)
  return issues
}
