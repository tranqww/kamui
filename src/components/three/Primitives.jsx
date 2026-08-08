import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import '../../lib/materials.jsx'
import { attachPointer, pointerTarget } from '../../lib/pointer.js'
import { clamp01, damp, lerp, makeRng } from '../../lib/rng.js'

/* ==========================================================================
   Silhouette — a generated THREE.Shape filled with a vertical gradient
   ========================================================================== */

export function Silhouette({
  shape,
  position = [0, 0, 0],
  rotation,
  scale = 1,
  top = '#ffffff',
  bottom = '#000000',
  gradientHeight,
  gradientFrom,
  opacity = 1,
  grain = 0.012,
  rim = 0,
  rimColor = '#ffd9c2',
  rimWidth = 0.06,
  curveSegments = 18,
  renderOrder,
  ...rest
}) {
  const geometry = useMemo(
    () => new THREE.ShapeGeometry(shape, curveSegments),
    [shape, curveSegments],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  // Drive the gradient from the shape's own extent in world space so callers
  // never have to hand-tune Y ranges after moving a layer.
  const [y0, y1] = useMemo(() => {
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    const s = Array.isArray(scale) ? scale[1] : scale
    const baseY = position[1]
    const lo = gradientFrom ?? baseY + box.min.y * s
    const hi = gradientHeight != null ? lo + gradientHeight : baseY + box.max.y * s
    return [lo, hi]
  }, [geometry, position, scale, gradientFrom, gradientHeight])

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
      renderOrder={renderOrder}
      {...rest}
    >
      <gradientMaterial
        uTop={new THREE.Color(top)}
        uBottom={new THREE.Color(bottom)}
        uY0={y0}
        uY1={y1}
        uOpacity={opacity}
        uGrain={grain}
        uRim={rim}
        uRimColor={new THREE.Color(rimColor)}
        uRimWidth={rimWidth}
        transparent={opacity < 1}
        depthWrite={opacity >= 1}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ==========================================================================
   Glow — additive halo billboard for every light source in the scenes
   ========================================================================== */

export function Glow({
  position = [0, 0, 0],
  size = 6,
  color = '#ffb547',
  intensity = 1,
  falloff = 2.6,
  core = 0.12,
  flicker = 0,
  renderOrder = 10,
}) {
  const ref = useRef(null)

  useFrame((state) => {
    if (ref.current && flicker > 0) ref.current.uTime = state.clock.elapsedTime
  })

  return (
    <mesh position={position} renderOrder={renderOrder}>
      <planeGeometry args={[size, size]} />
      <glowMaterial
        ref={ref}
        uColor={new THREE.Color(color)}
        uIntensity={intensity}
        uFalloff={falloff}
        uCore={core}
        uFlicker={flicker}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ==========================================================================
   Haze — the atmospheric veil that separates one depth layer from the next
   ========================================================================== */

export function Haze({
  position = [0, 0, 0],
  rotation,
  width = 200,
  height = 60,
  color = '#d68cbb',
  opacity = 0.5,
  power = 1.6,
  flip = false,
  additive = false,
  renderOrder = 5,
}) {
  return (
    <mesh position={position} rotation={rotation} renderOrder={renderOrder}>
      <planeGeometry args={[width, height]} />
      <hazeMaterial
        uColor={new THREE.Color(color)}
        uOpacity={opacity}
        uPower={power}
        uFlip={flip ? 1 : 0}
        transparent
        depthWrite={false}
        depthTest={!additive}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Sun shafts. Additive tapered quads fanned from a single origin — cheaper and
 * far more art-directable than a screen-space god-ray pass.
 */
export function LightShafts({
  position = [0, 0, 0],
  count = 5,
  spread = 0.34,
  tilt = -0.42,
  length = 90,
  width = 5,
  color = '#ffe3cf',
  opacity = 0.1,
}) {
  const shafts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0.5 : i / (count - 1)
        return {
          key: `shaft-${i}`,
          angle: tilt + (t - 0.5) * spread,
          offset: (t - 0.5) * width * 3.4,
          scale: 0.6 + Math.sin(t * Math.PI) * 0.9,
        }
      }),
    [count, spread, tilt, width],
  )

  return (
    <group position={position}>
      {shafts.map(({ key, angle, offset, scale }) => (
        <Haze
          key={key}
          position={[offset, 0, 0]}
          rotation={[0, 0, angle]}
          width={width * scale}
          height={length}
          color={color}
          opacity={opacity * scale}
          power={2.4}
          additive
          renderOrder={6}
        />
      ))}
    </group>
  )
}

/* ==========================================================================
   Drift — GPU particle field: sakura petals, embers, fireflies
   ========================================================================== */

export function Drift({
  count = 400,
  area = [120, 60, 40],
  seed = 42,
  colorA = '#ffd9e2',
  colorB = '#ffffff',
  size = 26,
  opacity = 0.85,
  fallSpeed = 1,
  sway = 1,
  softness = 1,
  blending = THREE.NormalBlending,
  position = [0, 0, 0],
}) {
  const matRef = useRef(null)
  const dpr = useThree((state) => state.viewport.dpr)

  const geometry = useMemo(() => {
    const rng = makeRng(seed)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (rng() - 0.5) * area[0]
      positions[i * 3 + 1] = rng() * area[1]
      positions[i * 3 + 2] = (rng() - 0.5) * area[2]
      seeds[i] = rng()
      // Bias small: a few large particles read as "near", many small as "far".
      scales[i] = 0.35 + rng() ** 2.4 * 1.15
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...area))
    return geo
  }, [count, area, seed])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    if (matRef.current) matRef.current.uTime = state.clock.elapsedTime
  })

  return (
    <points geometry={geometry} position={position} frustumCulled={false}>
      <driftMaterial
        ref={matRef}
        uColorA={new THREE.Color(colorA)}
        uColorB={new THREE.Color(colorB)}
        uSize={size}
        uOpacity={opacity}
        uArea={new THREE.Vector3(...area)}
        uFallSpeed={fallSpeed}
        uSwayAmount={sway}
        uSoftness={softness}
        uPixelRatio={dpr}
        transparent
        depthWrite={false}
        blending={blending}
        toneMapped={false}
      />
    </points>
  )
}

/* ==========================================================================
   ParallaxRig — the whole reason these scenes are 3D and not a stack of divs
   ========================================================================== */

export function ParallaxRig({
  children,
  strength = 1,
  rotation = 0.04,
  lambda = 3.2,
  enabled = true,
}) {
  const group = useRef(null)

  useEffect(() => attachPointer(), [])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 1 / 30)
    const tx = enabled ? pointerTarget.x * strength : 0
    const ty = enabled ? pointerTarget.y * strength : 0

    g.position.x = damp(g.position.x, tx, lambda, dt)
    g.position.y = damp(g.position.y, ty * 0.55, lambda, dt)
    g.rotation.y = damp(g.rotation.y, -tx * rotation, lambda, dt)
    g.rotation.x = damp(g.rotation.x, ty * rotation * 0.6, lambda, dt)
  })

  return <group ref={group}>{children}</group>
}

/**
 * Reframes a scene for narrow viewports.
 *
 * These compositions are authored for a wide canvas. On a phone the same
 * camera would push the subject clean off the side, so instead of cropping we
 * pull back and recentre — the responsive equivalent of choosing a different
 * lens rather than a different photo. The transition is continuous, so there
 * is no visible jump at any width.
 */
export function ResponsiveRig({
  children,
  portraitScale = 0.6,
  portraitOffset = [0, 0, 0],
  wideAspect = 1.5,
  narrowAspect = 0.7,
}) {
  const size = useThree((state) => state.size)
  const aspect = size.width / Math.max(size.height, 1)

  const t = clamp01((wideAspect - aspect) / (wideAspect - narrowAspect))
  const scale = lerp(1, portraitScale, t)
  const position = useMemo(
    () => portraitOffset.map((v) => v * t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, portraitOffset[0], portraitOffset[1], portraitOffset[2]],
  )

  return (
    <group scale={scale} position={position}>
      {children}
    </group>
  )
}

/**
 * Breathes a group with a slow sine — used on lanterns and floating frames so
 * nothing in the scene is ever perfectly still.
 */
export function Float({
  children,
  amplitude = 0.15,
  speed = 0.6,
  rotate = 0.02,
  offset = 0,
  ...rest
}) {
  const ref = useRef(null)

  useFrame((state) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime * speed + offset
    g.position.y = Math.sin(t) * amplitude
    g.rotation.z = Math.sin(t * 0.7) * rotate
  })

  return (
    <group ref={ref} {...rest}>
      {children}
    </group>
  )
}
