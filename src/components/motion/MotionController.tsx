'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const REVEAL_SELECTOR = '[data-reveal]:not([data-revealed])'

function revealAll() {
  document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => el.setAttribute('data-revealed', ''))
}

/**
 * The only JavaScript in the motion system: one IntersectionObserver that marks reveal
 * elements as revealed once they enter the viewport. Everything visual is CSS.
 * Mounted once in the root layout; renders nothing.
 */
export function MotionController() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    if (root.getAttribute('data-motion') === 'off') {
      revealAll()
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches || !('IntersectionObserver' in window)) {
      root.setAttribute('data-motion', 'off')
      revealAll()
      return
    }

    root.setAttribute('data-motion', 'on')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-revealed', '')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    )
    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el))

    const onPreferenceChange = () => {
      if (!reduced.matches) return
      observer.disconnect()
      root.setAttribute('data-motion', 'off')
      revealAll()
    }
    reduced.addEventListener('change', onPreferenceChange)

    return () => {
      observer.disconnect()
      reduced.removeEventListener('change', onPreferenceChange)
    }
  }, [pathname])

  return null
}
