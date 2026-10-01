import { isHebrew } from '@/lib/script'

/**
 * Isolates a proper name (a project, brand or person) in its own script direction, so it
 * never reorders the text around it: Latin names run left to right, Hebrew names (המחלבה)
 * right to left and carry lang="he" for pronunciation on English pages.
 */
export function Name({ children }: { children: string }) {
  return isHebrew(children) ? (
    <bdi dir="rtl" lang="he">
      {children}
    </bdi>
  ) : (
    <bdi dir="ltr">{children}</bdi>
  )
}
