import type { ElementType, ReactNode } from 'react'
import type { StyleWithVars } from '@/lib/css'
import type { ProjectTheme } from '@/content/schema'
import styles from './ThemeScope.module.css'

/** Maps a project theme onto the semantic color tokens. Palette only, by type. */
export function themeVars(theme: ProjectTheme): StyleWithVars {
  const { colors } = theme
  return {
    '--surface-0': colors.surface0,
    '--surface-1': colors.surface1,
    '--text': colors.text,
    '--text-muted': colors.textMuted,
    '--line': colors.line,
    '--accent': colors.accent ?? colors.text,
    '--focus-ring': colors.text,
    colorScheme: theme.scheme,
  }
}

interface ThemeScopeProps {
  theme?: ProjectTheme | undefined
  as?: ElementType
  className?: string
  children: ReactNode
}

/**
 * Server-rendered theme boundary: the first paint already has the right palette.
 * Without a theme it inherits the MARTIN.G brand tokens.
 */
export function ThemeScope({ theme, as: Tag = 'div', className, children }: ThemeScopeProps) {
  const cls = [styles.scope, className].filter(Boolean).join(' ')
  return (
    <Tag className={cls} style={theme ? themeVars(theme) : undefined}>
      {children}
    </Tag>
  )
}
