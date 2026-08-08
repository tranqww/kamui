import { useEffect } from 'react'

/**
 * Scroll reveal via a single shared IntersectionObserver.
 *
 * One observer for the whole page instead of one per element: cheaper, and it
 * keeps the reveal timing consistent across sections. Elements opt in with
 * `data-reveal`; the CSS does the rest, so if JS never runs everything is
 * still visible.
 */
export function useReveal({ threshold = 0.18, rootMargin = '0px 0px -8% 0px' } = {}) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!nodes.length) return undefined

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-revealed'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          // Reveals are one-shot — re-animating on every pass is nauseating.
          observer.unobserve(entry.target)
        })
      },
      { threshold, rootMargin },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [threshold, rootMargin])
}

/**
 * Tracks which section currently owns the viewport so the nav can highlight it.
 * Returns nothing; it sets `data-active-section` on <body> for CSS/JS to read.
 */
export function useActiveSection(ids, onChange) {
  useEffect(() => {
    if (!ids.length || !('IntersectionObserver' in window)) return undefined

    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return undefined

    const visibility = new Map()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target.id, entry.intersectionRatio)
        })
        let best = null
        let bestRatio = 0
        visibility.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = id
          }
        })
        if (best) onChange?.(best)
      },
      { threshold: [0.15, 0.35, 0.55, 0.75] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [ids, onChange])
}
