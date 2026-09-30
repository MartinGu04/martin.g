'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** The semantic tokens the header borrows from the scene beneath it. */
const TOKENS = [
  '--surface-0',
  '--text',
  '--text-muted',
  '--line',
  '--line-strong',
  '--focus-ring',
] as const

/**
 * Lets the header belong to the world it sits over. One IntersectionObserver watches a
 * one-pixel band along the header's lower edge; the scene crossing it lends the header its
 * semantic colors, which the header crossfades (instantly with reduced motion). Worlds are
 * contrast-validated, so the header stays readable in every one of them. Without
 * JavaScript the header simply keeps the MARTIN.G colors. Renders nothing.
 */
export function HeaderWorld() {
  const pathname = usePathname()

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-header]')
    if (!header) return
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const initialThemeColor = themeColor?.content
    const scenes = [...document.querySelectorAll<HTMLElement>('[data-scene]')]
    const crossing = new Set<Element>()
    let current: HTMLElement | null = null
    let observer: IntersectionObserver | null = null

    const apply = (scene: HTMLElement | null) => {
      if (scene === current) return
      current = scene
      if (!scene) {
        for (const token of TOKENS) header.style.removeProperty(token)
        delete header.dataset.worldScheme
        if (themeColor && initialThemeColor) themeColor.content = initialThemeColor
        return
      }
      const computed = getComputedStyle(scene)
      for (const token of TOKENS) header.style.setProperty(token, computed.getPropertyValue(token))
      header.dataset.worldScheme = scene.dataset.themeScheme ?? 'dark'
      if (themeColor) themeColor.content = computed.getPropertyValue('--surface-0').trim()
    }

    const connect = () => {
      observer?.disconnect()
      crossing.clear()
      const edge = Math.round(header.getBoundingClientRect().bottom)
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) crossing.add(entry.target)
            else crossing.delete(entry.target)
          }
          // Where scenes overlap during a transition, the later (entering) one is on top.
          const owner = scenes.filter((scene) => crossing.has(scene)).at(-1)
          if (owner) apply(owner)
        },
        { rootMargin: `-${edge}px 0px -${Math.max(0, window.innerHeight - edge - 1)}px 0px` },
      )
      for (const scene of scenes) observer.observe(scene)
    }

    connect()
    window.addEventListener('resize', connect)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', connect)
      apply(null)
    }
  }, [pathname])

  return null
}
