/**
 * Deterministic randomness.
 *
 * Every silhouette in this project is generated, not authored by hand, so the
 * scene must look identical on every load and on every machine. A seeded PRNG
 * plus value noise gives us mountains and treelines that read as drawn rather
 * than as `Math.random()` static.
 */

/** Mulberry32 — small, fast, good enough distribution for silhouettes. */
export function makeRng(seed = 1) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10)

/**
 * 1D value noise over a fixed lattice.
 * Returns a function of x in roughly [-1, 1].
 */
export function makeNoise1D(seed = 1, lattice = 512) {
  const rng = makeRng(seed)
  const table = new Float32Array(lattice)
  for (let i = 0; i < lattice; i += 1) table[i] = rng() * 2 - 1

  return function noise(x) {
    const i = Math.floor(x)
    const f = x - i
    const a = table[((i % lattice) + lattice) % lattice]
    const b = table[(((i + 1) % lattice) + lattice) % lattice]
    return a + (b - a) * smootherstep(f)
  }
}

/** Fractal brownian motion built on the 1D noise above. */
export function makeFbm1D(seed = 1, octaves = 4, lacunarity = 2.05, gain = 0.5) {
  const noise = makeNoise1D(seed)
  return function fbm(x) {
    let sum = 0
    let amp = 1
    let freq = 1
    let norm = 0
    for (let o = 0; o < octaves; o += 1) {
      sum += noise(x * freq) * amp
      norm += amp
      amp *= gain
      freq *= lacunarity
    }
    return sum / norm
  }
}

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
export const clamp01 = (v) => clamp(v, 0, 1)

/** Maps v from [inMin,inMax] to [outMin,outMax], clamped. */
export function mapRange(v, inMin, inMax, outMin, outMax) {
  const t = clamp01((v - inMin) / (inMax - inMin || 1))
  return outMin + (outMax - outMin) * t
}

/** Frame-rate independent damping — the correct way to "lerp toward" a target. */
export function damp(current, target, lambda, dt) {
  return lerp(target, current, Math.exp(-lambda * dt))
}
