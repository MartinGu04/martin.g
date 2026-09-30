import type { ElementType, ReactNode } from 'react'
import type { StyleWithVars } from '@/lib/css'
import type { ProjectTheme } from '@/content/schema'
import styles from './ThemeScope.module.css'

/** Maps a project theme onto the semantic color tokens. Palette only, by type. */
export function themeVars(theme: ProjectTheme): StyleWithVars {
  const { colors } = theme
  const vars: StyleWithVars = {
    '--surface-0': colors.surface0,
    '--surface-1': colors.surface1,
    '--text': colors.text,
    '--text-muted': colors.textMuted,
    '--accent': colors.accent ?? colors.text,
    '--accent-2': colors.accent2 ?? colors.accent ?? colors.text,
    colorScheme: theme.scheme,
  }
  // Explicit lines win over the derived default in ThemeScope.module.css.
  if (colors.line) vars['--line'] = colors.line
  return vars
}

interface ThemeScopeProps {
  theme?: ProjectTheme | undefined
  as?: ElementType
  className?: string
  id?: string
  'aria-labelledby'?: string
  children: ReactNode
}

/**
 * Server-rendered theme boundary: the first paint already has the right palette, so there
 * is never a flash of the wrong theme. A project section may temporarily control
 * background, foreground, muted text, structural lines and one or two accents; spacing,
 * grid, type and motion tokens are untouched. Without a theme it is a neutral surface.
 */
export function ThemeScope({
  theme,
  as: Tag = 'div',
  className,
  children,
  ...rest
}: ThemeScopeProps) {
  const cls = [styles.scope, theme ? styles.themed : '', className].filter(Boolean).join(' ')
  return (
    <Tag
      className={cls}
      style={theme ? themeVars(theme) : undefined}
      data-theme-scheme={theme?.scheme}
      {...rest}
    >
      {children}
    </Tag>
  )
}
