import * as THREE from 'three'
import { makeFbm1D, makeRng, lerp } from './rng.js'

/**
 * Silhouette generators.
 *
 * The reference is a flat illustration, so the scene is built from filled
 * vector silhouettes placed at real depths rather than from lit, textured
 * meshes. Real Z positions give us honest parallax and fog; flat shapes keep
 * the painted look.
 *
 * Every builder returns a THREE.Shape in local units with y = 0 as its base
 * line, so shapes can be dropped onto a layer without bookkeeping.
 */

/** Angular, faceted mountain range — the far ridges behind the pagoda. */
export function mountainShape({
  width = 100,
  height = 26,
  peaks = 5,
  seed = 1,
  jitter = 0.55,
  skirt = 20,
} = {}) {
  const rng = makeRng(seed)
  const shape = new THREE.Shape()
  const half = width / 2

  // Build a peak/valley alternation across the width, then connect linearly so
  // the ridge stays crisp and geometric instead of rolling.
  const nodes = []
  const steps = peaks * 2
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const x = lerp(-half, half, t)
    const isPeak = i % 2 === 1
    // Taper the range toward its edges so it settles into the horizon.
    const envelope = Math.sin(Math.PI * t) ** 0.55
    const base = isPeak ? height : height * 0.34
    const y = base * envelope * lerp(1 - jitter * 0.5, 1 + jitter * 0.5, rng())
    nodes.push([x, Math.max(y, 0.6)])
  }

  shape.moveTo(-half, -skirt)
  shape.lineTo(-half, nodes[0][1])
  for (let i = 1; i < nodes.length; i += 1) shape.lineTo(nodes[i][0], nodes[i][1])
  shape.lineTo(half, -skirt)
  shape.closePath()
  return shape
}

/** Smooth rolling landmass — hills, riverbanks, cloud banks. */
export function hillShape({
  width = 100,
  amplitude = 6,
  base = 0,
  seed = 7,
  frequency = 0.06,
  segments = 160,
  skirt = 20,
  crest = 0,
  crestAt = 0,
  crestWidth = 0.22,
} = {}) {
  const fbm = makeFbm1D(seed, 4)
  const shape = new THREE.Shape()
  const half = width / 2

  shape.moveTo(-half, -skirt)
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const x = lerp(-half, half, t)
    let y = base + fbm(x * frequency) * amplitude
    if (crest > 0) {
      // A single dominant swell — the hill the shrine sits on.
      const d = (t - crestAt) / crestWidth
      y += crest * Math.exp(-d * d)
    }
    shape.lineTo(x, y)
  }
  shape.lineTo(half, -skirt)
  shape.closePath()
  return shape
}

/** A band of conifers — reads as the dark treeline hugging the mountains. */
export function treelineShape({
  width = 100,
  height = 7,
  count = 60,
  seed = 3,
  base = 0,
  skirt = 12,
  spread = 0.42,
} = {}) {
  const rng = makeRng(seed)
  const shape = new THREE.Shape()
  const half = width / 2
  const step = width / count

  shape.moveTo(-half, -skirt)
  shape.lineTo(-half, base)

  for (let i = 0; i < count; i += 1) {
    const x = -half + step * i
    const h = height * lerp(0.42, 1, rng() ** 1.6)
    const w = step * lerp(0.85, 1.5, rng())
    // Zig-zag conifer: up the left flank, apex, down the right flank.
    shape.lineTo(x + w * spread * 0.5, base + h * 0.34)
    shape.lineTo(x + w * 0.5, base + h)
    shape.lineTo(x + w * (1 - spread * 0.5), base + h * 0.3)
    shape.lineTo(x + w, base + lerp(0, h * 0.14, rng()))
  }

  shape.lineTo(half, base)
  shape.lineTo(half, -skirt)
  shape.closePath()
  return shape
}

/**
 * Weathered boulder — foreground rock clusters.
 *
 * The profile is a flattened arch, not a bell: `roundness` pushes the shoulder
 * outward so the silhouette reads as a squat, rounded mass. Facet jitter is
 * deliberately narrow — widen it and the rock turns into a row of spikes.
 */
export function rockShape({
  width = 8,
  height = 5,
  facets = 9,
  seed = 11,
  lean = 0,
  roughness = 0.09,
  roundness = 0.7,
} = {}) {
  const rng = makeRng(seed)
  const shape = new THREE.Shape()
  const half = width / 2

  const pts = []
  for (let i = 0; i <= facets; i += 1) {
    const t = i / facets
    const x = lerp(-half, half, t) + lean * Math.sin(Math.PI * t) * width * 0.18
    const arch = Math.sin(Math.PI * t) ** roundness
    const y = height * arch * lerp(1 - roughness, 1 + roughness, rng())
    pts.push([x, Math.max(y, 0.05)])
  }

  shape.moveTo(-half, 0)
  pts.forEach(([x, y]) => shape.lineTo(x, y))
  shape.lineTo(half, 0)
  shape.closePath()
  return shape
}

/**
 * Japanese roof slab: concave sweep from the ridge with eaves that lift at the
 * tips. Drawn as a closed band so it can be filled as one flat silhouette.
 */
export function pagodaRoofShape({ width = 10, rise = 2.2, eaveLift = 0.55, thickness = 0.42 } = {}) {
  const shape = new THREE.Shape()
  const half = width / 2

  shape.moveTo(-half, eaveLift)
  shape.quadraticCurveTo(-half * 0.42, -rise * 0.1, 0, rise)
  shape.quadraticCurveTo(half * 0.42, -rise * 0.1, half, eaveLift)
  shape.lineTo(half * 0.94, eaveLift - thickness)
  shape.quadraticCurveTo(half * 0.4, -rise * 0.1 - thickness, 0, rise - thickness * 1.15)
  shape.quadraticCurveTo(-half * 0.4, -rise * 0.1 - thickness, -half * 0.94, eaveLift - thickness)
  shape.closePath()
  return shape
}

/** Arched footbridge: a curved deck on a matching arch, hollow underneath. */
export function archBridgeShape({ span = 24, rise = 4.4, deck = 0.9 } = {}) {
  const shape = new THREE.Shape()
  const half = span / 2

  shape.moveTo(-half, 0)
  shape.quadraticCurveTo(0, rise * 2 - deck * 0.4, half, 0)
  shape.lineTo(half, -deck * 0.55)
  shape.quadraticCurveTo(0, rise * 2 - deck * 1.9, -half, -deck * 0.55)
  shape.closePath()
  return shape
}

/**
 * Standing heron: tapered body, thin S-neck, dagger beak.
 *
 * The neck is the whole silhouette. Draw it thick and the bird reads as a
 * swan, so the two neck curves are kept close together and the head stays
 * small relative to the body.
 */
export function craneShape({ scale = 1 } = {}) {
  const s = scale
  const shape = new THREE.Shape()

  // Tail, swept back and slightly up
  shape.moveTo(-1.32 * s, 0.5 * s)
  shape.quadraticCurveTo(-1.05 * s, 0.86 * s, -0.6 * s, 0.94 * s)
  // Back rising to the shoulder
  shape.quadraticCurveTo(-0.08 * s, 1.06 * s, 0.2 * s, 0.98 * s)
  // Back of the neck — a long, narrow S
  shape.bezierCurveTo(0.1 * s, 1.6 * s, 0.28 * s, 2.1 * s, 0.62 * s, 2.34 * s)
  shape.quadraticCurveTo(0.78 * s, 2.46 * s, 0.9 * s, 2.42 * s)
  // Head and beak
  shape.lineTo(1.62 * s, 2.3 * s)
  shape.lineTo(0.88 * s, 2.18 * s)
  // Front of the neck, tracking the back curve closely
  shape.quadraticCurveTo(0.62 * s, 2.1 * s, 0.5 * s, 1.86 * s)
  shape.bezierCurveTo(0.32 * s, 1.5 * s, 0.36 * s, 1.16 * s, 0.28 * s, 0.78 * s)
  // Breast and belly back to the tail
  shape.quadraticCurveTo(0.06 * s, 0.24 * s, -0.5 * s, 0.28 * s)
  shape.quadraticCurveTo(-1.0 * s, 0.32 * s, -1.32 * s, 0.5 * s)
  shape.closePath()
  return shape
}

/** Single conifer for hero-scale foreground planting. */
export function pineTreeShape({ height = 6, width = 2.2, tiers = 4, seed = 5 } = {}) {
  const rng = makeRng(seed)
  const shape = new THREE.Shape()
  const half = width / 2
  const trunk = width * 0.09

  shape.moveTo(-trunk, 0)
  for (let i = 0; i < tiers; i += 1) {
    const t = i / tiers
    const tierBase = height * (0.16 + t * 0.78)
    const tierW = half * (1 - t * 0.72) * lerp(0.88, 1.12, rng())
    shape.lineTo(-tierW, tierBase)
    shape.lineTo(-tierW * 0.34, tierBase + height * 0.06)
  }
  shape.lineTo(0, height)
  for (let i = tiers - 1; i >= 0; i -= 1) {
    const t = i / tiers
    const tierBase = height * (0.16 + t * 0.78)
    const tierW = half * (1 - t * 0.72) * lerp(0.88, 1.12, rng())
    shape.lineTo(tierW * 0.34, tierBase + height * 0.06)
    shape.lineTo(tierW, tierBase)
  }
  shape.lineTo(trunk, 0)
  shape.closePath()
  return shape
}

/**
 * Half-profile of a stone lantern (ishidoro), fed to LatheGeometry.
 * Returns Vector2 points from the ground up: base, pedestal, fire box, cap,
 * finial. This one really is a solid of revolution — genuine 3D geometry.
 */
export function lanternProfile({ scale = 1 } = {}) {
  const p = [
    [0.0, 0.0],
    [0.62, 0.0],
    [0.58, 0.16],
    [0.3, 0.24],
    [0.26, 0.86],
    [0.44, 0.94],
    [0.36, 1.04],
    [0.52, 1.16],
    [0.5, 1.34],
    [0.62, 1.42],
    [0.6, 1.86],
    [0.5, 1.94],
    [0.78, 2.02],
    [0.86, 2.16],
    [0.2, 2.52],
    [0.24, 2.62],
    [0.12, 2.72],
    [0.16, 2.86],
    [0.0, 3.0],
  ]
  return p.map(([x, y]) => new THREE.Vector2(x * scale, y * scale))
}

/** Grass and reed tufts along the waterline. */
export function reedShape({ blades = 7, height = 1.6, width = 1.1, seed = 21 } = {}) {
  const rng = makeRng(seed)
  const shape = new THREE.Shape()
  const half = width / 2

  shape.moveTo(-half, 0)
  for (let i = 0; i < blades; i += 1) {
    const t = i / (blades - 1)
    const x = lerp(-half, half, t)
    const h = height * lerp(0.45, 1, rng())
    const bend = lerp(-0.3, 0.3, rng()) * height * 0.4
    shape.quadraticCurveTo(x - 0.04, h * 0.6, x + bend, h)
    shape.quadraticCurveTo(x + 0.06, h * 0.55, x + width / blades / 2, 0)
  }
  shape.lineTo(half, 0)
  shape.closePath()
  return shape
}

/**
 * Ornate card frame outline used by the Yokai portrait: a rectangle with
 * clipped corners and a crowned top, matching the reference's carved border.
 */
export function cardFrameShape({ width = 6, height = 9, notch = 0.9, crown = 0.7 } = {}) {
  const w = width / 2
  const h = height / 2
  const shape = new THREE.Shape()

  shape.moveTo(-w + notch, h)
  shape.lineTo(-crown * 0.9, h)
  shape.lineTo(0, h + crown)
  shape.lineTo(crown * 0.9, h)
  shape.lineTo(w - notch, h)
  shape.lineTo(w, h - notch)
  shape.lineTo(w, -h + notch)
  shape.lineTo(w - notch, -h)
  shape.lineTo(-w + notch, -h)
  shape.lineTo(-w, -h + notch)
  shape.lineTo(-w, h - notch)
  shape.closePath()
  return shape
}

/**
 * The same carved border, but hollow — a Shape with a hole, so the portrait
 * behind it shows through a real aperture instead of being layered on top.
 */
export function ornateFrameShape({ width = 16, height = 24, notch = 2, crown = 1.6, thickness = 1.5 } = {}) {
  const outer = cardFrameShape({ width, height, notch, crown })
  const inner = cardFrameShape({
    width: width - thickness * 2,
    height: height - thickness * 2,
    notch: Math.max(notch - thickness * 0.6, 0.3),
    crown: Math.max(crown - thickness * 0.5, 0.2),
  })
  // Holes must wind opposite to the outer path; reversing the point list is
  // the reliable way to guarantee that for generated shapes.
  const hole = new THREE.Path(inner.getPoints(64).reverse())
  outer.holes.push(hole)
  return outer
}

/** Rounded rectangle used for card bodies and UI-ish plates in 3D. */
export function roundedRectShape({ width = 4, height = 6, radius = 0.22 } = {}) {
  const w = width / 2
  const h = height / 2
  const r = Math.min(radius, w, h)
  const shape = new THREE.Shape()

  shape.moveTo(-w + r, -h)
  shape.lineTo(w - r, -h)
  shape.quadraticCurveTo(w, -h, w, -h + r)
  shape.lineTo(w, h - r)
  shape.quadraticCurveTo(w, h, w - r, h)
  shape.lineTo(-w + r, h)
  shape.quadraticCurveTo(-w, h, -w, h - r)
  shape.lineTo(-w, -h + r)
  shape.quadraticCurveTo(-w, -h, -w + r, -h)
  shape.closePath()
  return shape
}
