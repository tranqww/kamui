import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { useDeviceTier, useReducedMotion } from '../../hooks/useEnvironment.js'

/**
 * A section-scoped WebGL canvas.
 *
 * Four always-on canvases would burn a phone battery for scenes nobody is
 * looking at, so each Stage watches its own section and parks its render loop
 * (`frameloop="never"`) the moment it leaves the viewport. Entering the
 * viewport resumes it. Tone mapping is off on purpose: the art direction is
 * flat and painted, and ACES would desaturate every colour we sampled from the
 * reference.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 36], fov: 40, near: 0.1, far: 400 },
  className = 'section__canvas',
  eager = false,
  onTier,
}) {
  const host = useRef(null)
  const [active, setActive] = useState(eager)
  const [everActive, setEverActive] = useState(eager)
  const tier = useDeviceTier()
  const reduced = useReducedMotion()

  useEffect(() => {
    onTier?.(tier)
  }, [tier, onTier])

  useEffect(() => {
    const node = host.current
    if (!node || !('IntersectionObserver' in window)) {
      setActive(true)
      setEverActive(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting
        setActive(visible)
        if (visible) setEverActive(true)
      },
      // Warm the scene up just before it scrolls into view.
      { rootMargin: '25% 0px 25% 0px', threshold: 0 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Also stop rendering when the tab is hidden.
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const dprCap = tier === 'low' ? 1 : tier === 'mid' ? 1.5 : 2

  return (
    <div ref={host} className={className} aria-hidden="true">
      {everActive && (
        <Canvas
          frameloop={active && visible ? 'always' : 'never'}
          dpr={[1, dprCap]}
          camera={camera}
          gl={{
            antialias: tier !== 'low',
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            {typeof children === 'function' ? children({ tier, reduced }) : children}
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}
