import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  color,
  Glow,
  MergedSilhouette,
  Silhouette,
} from '../../components/three/Primitives.jsx'
import {
  archBridgeShape,
  craneShape,
  lanternProfile,
  roundedRectShape,
} from '../../lib/shapes.js'

/** Point on the quadratic Bézier that defines the bridge deck. */
function bezier(t, p0, c, p1) {
  const u = 1 - t
  return u * u * p0 + 2 * u * t * c + t * t * p1
}

/* ==========================================================================
   Arched footbridge
   ========================================================================== */

export function Bridge({ position = [0, 0, 0], span = 26, rise = 4.6, scale = 1 }) {
  const deck = useMemo(() => archBridgeShape({ span, rise, deck: 1.0 }), [span, rise])
  const handrail = useMemo(() => archBridgeShape({ span: span * 0.97, rise, deck: 0.34 }), [span, rise])
  const post = useMemo(() => roundedRectShape({ width: 0.22, height: 1, radius: 0.08 }), [])

  const railOffset = 1.55

  // Balusters follow the deck curve, so each one gets its own height.
  const posts = useMemo(() => {
    const half = span / 2
    const c = rise * 2 - 0.4
    const out = []
    for (let i = 1; i < 12; i += 1) {
      const t = i / 12
      const x = bezier(t, -half, 0, half)
      const y = bezier(t, 0, c, 0)
      out.push({ position: [x, y + railOffset * 0.5, 0.06], scale: [1, railOffset, 1] })
    }
    return out
  }, [span, rise])

  return (
    <group position={position} scale={scale}>
      <Silhouette
        shape={deck}
        position={[0, 0, 0]}
        top="#9c6a4d"
        bottom="#5c3b33"
        curveSegments={40}
      />
      <MergedSilhouette shape={post} instances={posts} top="#8a5c44" bottom="#5c3b33" />
      <Silhouette
        shape={handrail}
        position={[0, railOffset, 0.12]}
        top="#b07c58"
        bottom="#7a5240"
        curveSegments={40}
      />
    </group>
  )
}

/* ==========================================================================
   Shrine stairway
   ========================================================================== */

/**
 * A flight of stone steps climbing the hill.
 *
 * The silhouette is a trapezoid — narrowing with height fakes the perspective
 * of a flat layer — and the treads are drawn on top as lighter bars. Notching
 * the outline instead would have put the steps on the left and right edges,
 * which is not where a viewer looking up a staircase sees them.
 */
export function Stairway({
  position = [0, 0, 0],
  rotation,
  steps = 16,
  bottomWidth = 4.6,
  topWidth = 2.4,
  height = 9,
}) {
  const body = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-bottomWidth / 2, 0)
    s.lineTo(bottomWidth / 2, 0)
    s.lineTo(topWidth / 2, height)
    s.lineTo(-topWidth / 2, height)
    s.closePath()
    return s
  }, [bottomWidth, topWidth, height])

  const tread = useMemo(() => roundedRectShape({ width: 1, height: 0.1, radius: 0.04 }), [])

  const treads = useMemo(
    () =>
      Array.from({ length: steps }, (_, i) => {
        const t = (i + 0.5) / steps
        return {
          position: [0, t * height, 0.02],
          scale: [(bottomWidth + (topWidth - bottomWidth) * t) * 0.94, 1, 1],
        }
      }),
    [steps, height, bottomWidth, topWidth],
  )

  return (
    <group position={position} rotation={rotation}>
      <Silhouette shape={body} top="#7d6f8d" bottom="#33294a" />
      <MergedSilhouette
        shape={tread}
        instances={treads}
        top="#bfb0c8"
        bottom="#6e5d84"
        opacity={0.4}
        grain={0}
      />
    </group>
  )
}

/* ==========================================================================
   Stone lantern — an actual solid of revolution
   ========================================================================== */

export function StoneLantern({ position, scale = 1, glow = true }) {
  const geometry = useMemo(() => {
    const profile = lanternProfile({ scale: 1 })
    const geo = new THREE.LatheGeometry(profile, 18)
    geo.computeBoundingBox()
    return geo
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  // Object-space bounds, matching the gradient shader's space.
  const bounds = useMemo(() => {
    const box = geometry.boundingBox
    return [box.min.y, box.max.y]
  }, [geometry])

  return (
    <group position={position} scale={scale}>
      <mesh geometry={geometry} rotation={[0, 0.4, 0]}>
        <gradientMaterial
          uTop={color('#6a5878')}
          uBottom={color('#241a33')}
          uY0={bounds[0]}
          uY1={bounds[1]}
          uGrain={0.018}
          uRim={0.42}
          uRimColor={color('#c79ec0')}
          uRimWidth={0.4}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {glow && (
        <>
          {/* Tight core for the lit window, wide halo for the spill. Keep the
              core small: sized to the firebox it reads as a lantern, sized to
              the whole stone it reads as a face. */}
          <Glow position={[0, 1.9, 0.66]} size={1.15} color="#ffe6b4" intensity={1} falloff={1.4} core={0.4} flicker={0.28} />
          <Glow position={[0, 1.9, 0.6]} size={4.8} color="#ff9c3c" intensity={0.3} falloff={3} core={0} flicker={0.16} />
        </>
      )}
    </group>
  )
}

/* ==========================================================================
   Herons wading in the shallows
   ========================================================================== */

export function Crane({ position = [0, 0, 0], scale = 1, flip = false, legHeight = 1.5 }) {
  const body = useMemo(() => craneShape({ scale: 1 }), [])
  const leg = useMemo(() => roundedRectShape({ width: 0.11, height: 1, radius: 0.05 }), [])

  return (
    <group position={position} scale={[flip ? -scale : scale, scale, scale]}>
      {/* Where the legs meet the water. Without this the bird reads as pasted
          on rather than standing in the shallows. Radial falloff, squashed
          into an ellipse to match the water's viewing angle. */}
      <mesh position={[-0.05, 0.05, -0.05]} scale={[1, 0.34, 1]}>
        <planeGeometry args={[3.4, 3.4]} />
        <glowMaterial
          uColor={color('#241738')}
          uIntensity={0.62}
          uFalloff={2.2}
          uCore={0}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Silhouette
        shape={leg}
        position={[-0.34, legHeight * 0.5 - 0.06, -0.02]}
        scale={[1, legHeight, 1]}
        top="#efe3ea"
        bottom="#9d80a8"
      />
      <Silhouette
        shape={leg}
        position={[0.1, legHeight * 0.44 - 0.06, -0.02]}
        scale={[1, legHeight * 0.88, 1]}
        top="#efe3ea"
        bottom="#9d80a8"
      />
      <Silhouette
        shape={body}
        position={[0, legHeight - 0.2, 0]}
        top="#ffffff"
        bottom="#c3a8cd"
        curveSegments={26}
      />
    </group>
  )
}

/* ==========================================================================
   Torii gate
   ========================================================================== */

export function Torii({ position = [0, 0, 0], scale = 1, color = '#8e3f52' }) {
  const pillar = useMemo(() => roundedRectShape({ width: 0.7, height: 8, radius: 0.2 }), [])
  const tie = useMemo(() => roundedRectShape({ width: 8.4, height: 0.55, radius: 0.14 }), [])

  // The kasagi (top rail) sweeps up at both ends, like the roof lines.
  const kasagi = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-5.6, 0.2)
    s.quadraticCurveTo(0, -0.5, 5.6, 0.2)
    s.lineTo(5.6, -0.5)
    s.quadraticCurveTo(0, -1.2, -5.6, -0.5)
    s.closePath()
    return s
  }, [])

  return (
    <group position={position} scale={scale}>
      <Silhouette shape={pillar} position={[-3.4, 4, 0]} top={color} bottom="#4d1f2e" />
      <Silhouette shape={pillar} position={[3.4, 4, 0]} top={color} bottom="#4d1f2e" />
      <Silhouette shape={tie} position={[0, 6.4, 0.05]} top={color} bottom="#5f2739" />
      <Silhouette shape={kasagi} position={[0, 8.2, 0.1]} top="#a34a5f" bottom="#5f2739" curveSegments={30} />
    </group>
  )
}
