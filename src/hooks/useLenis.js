import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

/**
 * Smooth scrolling, wired so it can be driven and interrogated elsewhere.
 *
 * Lenis is disabled outright under prefers-reduced-motion: smoothing scroll is
 * exactly the kind of hijack that triggers motion sickness, and native
 * scrolling is the accessible fallback.
 */
export function useLenis() {
  const lenisRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    lenisRef.current = lenis

    let frame = 0
    const raf = (time) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // In-page anchors need to go through Lenis or they fight the rAF loop.
    const onClick = (event) => {
      const anchor = event.target.closest?.('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (!target) return
      event.preventDefault()
      lenis.scrollTo(target, { offset: 0, duration: 1.4 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return lenisRef
}
