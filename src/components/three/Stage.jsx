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

    // Two rings. The inner one parks and resumes the render loop as the
    // section passes; the outer one actually unmounts the canvas once the
    // section is far away, because parking stops CPU work but never returns
    // the context's render targets — and four composers' worth of full-res
    // half-float buffers is real VRAM to be holding for scenes nobody can see.
    let teardown = 0

    const near = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting
        setActive(visible)
        if (visible) setEverActive(true)
      },
      { rootMargin: '25% 0px 25% 0px', threshold: 0 },
    )

    const far = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(teardown)
        if (entry.isIntersecting) return
        // Dwell before tearing down, so a fast scroll through the page does
        // not thrash contexts and shader compiles.
        teardown = setTimeout(() => setEverActive(false), 4000)
      },
      { rootMargin: '150% 0px 150% 0px', threshold: 0 },
    )

    near.observe(node)
    far.observe(node)

    return () => {
      clearTimeout(teardown)
      near.disconnect()
      far.disconnect()
    }
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
            // Post-processing renders into its own off-screen target, so a
            // multisampled default framebuffer is allocated and then never
            // used. Only the low tier — which skips the composer — gets AA
            // here; the others get it from the composer's own multisampling.
            antialias: tier === 'low',
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          // R3F sets pointerEvents:auto on its own wrapper, which defeats the
          // `pointer-events: none` on the host and makes the canvas swallow
          // text selection drags across the section.
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <Suspense fallback={null}>
            {typeof children === 'function' ? children({ tier, reduced }) : children}
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}
