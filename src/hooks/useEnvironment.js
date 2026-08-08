import { useEffect, useState } from 'react'

/** Live `prefers-reduced-motion`, including changes made mid-session. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event) => setReduced(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/** Generic media-query subscription. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * A conservative "can this device carry four WebGL scenes" check.
 *
 * Rather than sniffing the GPU we look at the two things that actually predict
 * pain: very low core counts and coarse pointers on small screens. Anything
 * flagged here drops particle counts and postprocessing instead of the scene.
 */
export function useDeviceTier() {
  const coarse = useMediaQuery('(pointer: coarse)')
  const small = useMediaQuery('(max-width: 900px)')
  const [lowCore] = useState(() =>
    typeof navigator === 'undefined' ? false : (navigator.hardwareConcurrency ?? 8) <= 4,
  )

  if (lowCore || (coarse && small)) return 'low'
  if (small) return 'mid'
  return 'high'
}
