import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import '../../lib/materials.jsx'
import { attachPointer, pointerTarget } from '../../lib/pointer.js'
import { clamp01, damp, lerp, makeRng } from '../../lib/rng.js'
import { useReducedMotion } from '../../hooks/useEnvironment.js'

/* ==========================================================================
   Silhouette — a generated THREE.Shape filled with a vertical gradient
   ========================================================================== */

/** Colours are cached by string, so a constant colour never re-uploads. */
const colorCache = new Map()
export function color(hex) {
  let c = colorCache.get(hex)
  if (!c) {
    c = new THREE.Color(hex)
    colorCache.set(hex, c)
  }
  return c
}

export function Silhouette({
  shape,
  position,
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

  // The ramp runs across the shape's own extent, in the shape's own space.
  // `gradientFrom`/`gradientHeight` override it in those same local units.
  const [y0, y1] = useMemo(() => {
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    const lo = gradientFrom ?? box.min.y
    const hi = gradientHeight != null ? lo + gradientHeight : box.max.y
    return [lo, hi]
  }, [geometry, gradientFrom, gradientHeight])

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
        uTop={color(top)}
        uBottom={color(bottom)}
        uY0={y0}
        uY1={y1}
        uOpacity={opacity}
        uGrain={grain}
        uRim={rim}
        uRimColor={color(rimColor)}
        uRimWidth={rimWidth}
        transparent={opacity < 1}
        depthWrite={opacity >= 1}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * The same silhouette repeated at many transforms, baked into one geometry.
 *
 * Tree trunks, stair treads, bridge posts and shrine balusters are all one
 * shape stamped N times with only a translate and a scale between them, and
 * none of them animate individually. Submitting them as N meshes costs N draw
 * calls for no expressive gain; merged, a treeline is one. The gradient then
 * ramps across the whole merged band rather than resetting per item, which is
 * how a treeline should shade anyway.
 */
export function MergedSilhouette({
  shape,
  instances,
  curveSegments = 12,
  top = '#ffffff',
  bottom = '#000000',
  opacity = 1,
  grain = 0.012,
  rim = 0,
  rimColor = '#ffd9c2',
  rimWidth = 0.06,
  position,
  renderOrder,
}) {
  const geometry = useMemo(() => {
    const base = new THREE.ShapeGeometry(shape, curveSegments)
    const matrix = new THREE.Matrix4()
    const quat = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()

    const parts = instances.map((instance) => {
      const [x = 0, y = 0, z = 0] = instance.position ?? [0, 0, 0]
      const s = instance.scale ?? 1
      const [sx, sy, sz] = Array.isArray(s) ? s : [s, s, s]
      const clone = base.clone()
      euler.set(0, 0, instance.rotation ?? 0)
      quat.setFromEuler(euler)
      matrix.compose(pos.set(x, y, z), quat, scl.set(sx, sy, sz))
      clone.applyMatrix4(matrix)
      return clone
    })

    const merged = mergeGeometries(parts, false)
    parts.forEach((part) => part.dispose())
    base.dispose()
    merged.computeBoundingBox()
    return merged
  }, [shape, curveSegments, instances])

  useEffect(() => () => geometry.dispose(), [geometry])

  const box = geometry.boundingBox

  return (
    <mesh geometry={geometry} position={position} renderOrder={renderOrder}>
      <gradientMaterial
        uTop={color(top)}
        uBottom={color(bottom)}
        uY0={box.min.y}
        uY1={box.max.y}
        uOpacity={opacity}
        uGrain={grain}
        uRim={rim}
        uRimColor={color(rimColor)}
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
   Time
   ========================================================================== */

/**
 * Feeds `uTime` to a material from an accumulator we own.
 *
 * `state.clock.elapsedTime` is not usable here: R3F resets the clock to zero
 * every time `frameloop` flips, which this project does on every scroll in and
 * out of a section and on every tab blur. Reading it would teleport every
 * particle field and reset every flame the moment a section came back. An
 * accumulator with a clamped delta survives all of that, and also survives the
 * long first frame after a tab regains focus.
 */
export function TimeDriver({ target, speed = 1 }) {
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += Math.min(delta, 1 / 30) * speed
    if (target.current) target.current.uTime = t.current
  })

  return null
}

/* ==========================================================================
   Glow — additive halo billboard for every light source in the scenes
   ========================================================================== */

export function Glow({
  position,
  size = 6,
  color: colorHex = '#ffb547',
  intensity = 1,
  falloff = 2.6,
  core = 0.12,
  flicker = 0,
  renderOrder = 10,
}) {
  const ref = useRef(null)

  return (
    <mesh position={position} renderOrder={renderOrder}>
      <planeGeometry args={[size, size]} />
      <glowMaterial
        ref={ref}
        uColor={color(colorHex)}
        uIntensity={intensity}
        uFalloff={falloff}
        uCore={core}
        uFlicker={flicker}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
      {/* Only flames need a clock; the other ~15 halos are static and should
          not each be paying for a per-frame callback. */}
      {flicker > 0 && <TimeDriver target={ref} />}
    </mesh>
  )
}

/* ==========================================================================
   Haze — the atmospheric veil that separates one depth layer from the next
   ========================================================================== */

export function Haze({
  position,
  rotation,
  width = 200,
  height = 60,
  color: colorHex = '#d68cbb',
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
        uColor={color(colorHex)}
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
  position,
}) {
  const matRef = useRef(null)
  const dpr = useThree((state) => state.viewport.dpr)
  // Call sites pass `area` as a literal, so depending on the array itself
  // would rebuild a thousand particles on every render of the parent scene.
  const [areaX, areaY, areaZ] = area

  const geometry = useMemo(() => {
    const rng = makeRng(seed)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (rng() - 0.5) * areaX
      positions[i * 3 + 1] = rng() * areaY
      positions[i * 3 + 2] = (rng() - 0.5) * areaZ
      seeds[i] = rng()
      // Bias small: a few large particles read as "near", many small as "far".
      scales[i] = 0.35 + rng() ** 2.4 * 1.15
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(),
      Math.max(areaX, areaY, areaZ),
    )
    return geo
  }, [count, areaX, areaY, areaZ, seed])

  useEffect(() => () => geometry.dispose(), [geometry])

  const areaVec = useMemo(() => new THREE.Vector3(areaX, areaY, areaZ), [areaX, areaY, areaZ])

  return (
    <points geometry={geometry} position={position} frustumCulled={false}>
      <driftMaterial
        ref={matRef}
        uColorA={color(colorA)}
        uColorB={color(colorB)}
        uSize={size}
        uOpacity={opacity}
        uArea={areaVec}
        uFallSpeed={fallSpeed}
        uSwayAmount={sway}
        uSoftness={softness}
        uPixelRatio={dpr}
        transparent
        depthWrite={false}
        blending={blending}
        toneMapped={false}
      />
      <TimeDriver target={matRef} />
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
  const elapsed = useRef(0)
  // Ambient drift (petals, embers, flame flicker) is atmosphere and stays;
  // whole objects bobbing in place is transport and does not.
  const reduced = useReducedMotion()

  useFrame((_, delta) => {
    const g = ref.current
    if (!g) return
    if (reduced) {
      g.position.y = 0
      g.rotation.z = 0
      return
    }
    elapsed.current += Math.min(delta, 1 / 30)
    const t = elapsed.current * speed + offset
    g.position.y = Math.sin(t) * amplitude
    g.rotation.z = Math.sin(t * 0.7) * rotate
  })

  return (
    <group ref={ref} {...rest}>
      {children}
    </group>
  )
}
