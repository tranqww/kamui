import { useMemo } from 'react'
import * as THREE from 'three'
import {
  Drift,
  Float,
  Glow,
  Haze,
  MergedSilhouette,
  ParallaxRig,
  ResponsiveRig,
  Silhouette,
} from '../../components/three/Primitives.jsx'
import Effects from '../../components/three/Effects.jsx'
import Kitsune from './Kitsune.jsx'
import {
  hillShape,
  mountainShape,
  ornateFrameShape,
  reedShape,
  rockShape,
  roundedRectShape,
  treelineShape,
} from '../../lib/shapes.js'

const FRAME_W = 15.4
const FRAME_H = 23.4
const WIN_W = FRAME_W - 3.0
const WIN_H = FRAME_H - 3.0
const FRAME_X = 12.6

const Z = {
  sky: -60,
  trunksFar: -46,
  mistFar: -40,
  trunksNear: -30,
  portrait: -6,
  frame: 0,
  foliage: 8,
}

/** Misty trunks receding into the forest. */
function Trunks({ z, count, spread, width, height, top, bottom, seed = 1, opacity = 1 }) {
  const trunk = useMemo(() => roundedRectShape({ width: 1, height: 1, radius: 0.1 }), [])
  const items = useMemo(() => {
    const out = []
    for (let i = 0; i < count; i += 1) {
      // Deterministic spacing with a hash-ish jitter — no RNG import needed
      // for a layer this simple.
      const t = (i + 0.5) / count
      const jitter = Math.sin((i + seed) * 12.9898) * 0.5
      const w = width * (0.7 + Math.abs(Math.sin((i + seed) * 4.13)) * 0.7)
      const h = height * (0.75 + Math.abs(Math.cos((i + seed) * 7.71)) * 0.5)
      out.push({
        position: [(t - 0.5) * spread + jitter * (spread / count), -24 + h / 2, 0],
        scale: [w, h, 1],
      })
    }
    return out
  }, [count, spread, width, height, seed])

  return (
    <MergedSilhouette
      shape={trunk}
      instances={items}
      position={[0, 0, z]}
      top={top}
      bottom={bottom}
      opacity={opacity}
      grain={0.006}
    />
  )
}

/** What is visible through the frame's aperture. */
function Portrait() {
  const sky = useMemo(() => roundedRectShape({ width: WIN_W, height: WIN_H, radius: 0.6 }), [])
  const peaks = useMemo(
    () => mountainShape({ width: WIN_W * 1.1, height: 4.4, peaks: 4, seed: 31, jitter: 0.5, skirt: 14 }),
    [],
  )
  const grove = useMemo(
    () => treelineShape({ width: WIN_W * 1.1, height: 3.2, count: 22, seed: 52, skirt: 12 }),
    [],
  )
  const bank = useMemo(
    () => hillShape({ width: WIN_W * 1.2, amplitude: 0.8, seed: 12, frequency: 0.4, skirt: 12, crest: 2.2, crestAt: 0.3, crestWidth: 0.25 }),
    [],
  )
  const boulder = useMemo(() => rockShape({ width: 7, height: 2.6, facets: 8, seed: 61 }), [])
  const grass = useMemo(() => reedShape({ blades: 9, height: 1.5, width: 4, seed: 44 }), [])
  const lantern = useMemo(() => roundedRectShape({ width: 1.9, height: 2.5, radius: 0.85 }), [])

  return (
    <group position={[FRAME_X, 0, Z.portrait]}>
      <Silhouette shape={sky} position={[0, 0, 0]} top="#3b2a63" bottom="#150d2a" />

      {/* Moon haze behind the peaks */}
      <Glow position={[3.2, 5.4, 0.1]} size={13} color="#6f7fc4" intensity={0.28} falloff={2.8} core={0} />

      <Silhouette shape={peaks} position={[0.8, 1.2, 0.2]} top="#40316f" bottom="#241a48" />
      <Silhouette shape={grove} position={[-1, 0.2, 0.4]} top="#2e2255" bottom="#181140" />
      <Silhouette shape={bank} position={[0, -8.4, 0.6]} top="#2a2050" bottom="#120c26" />

      <Kitsune position={[-0.6, -6.4, 1.0]} scale={0.98} />

      {/* Paper lantern resting on the boulder */}
      <Silhouette shape={boulder} position={[2.6, -8.8, 1.4]} top="#2b2152" bottom="#130d28" />
      <Float amplitude={0.08} speed={0.7} rotate={0.02}>
        <Silhouette shape={lantern} position={[2.6, -6.9, 1.5]} top="#ffd08a" bottom="#f0813a" grain={0} />
        <Glow position={[2.6, -6.9, 1.6]} size={9} color="#ffa245" intensity={0.85} falloff={2.3} core={0.14} flicker={0.2} />
      </Float>

      <Silhouette shape={grass} position={[-4.2, -9.4, 1.6]} top="#3f6b74" bottom="#1a2440" />
      <Silhouette shape={grass} position={[4.6, -9.6, 1.6]} scale={0.8} top="#3a6069" bottom="#18213c" />

      {/* Sparks inside the portrait, denser near the lantern */}
      <Drift
        count={70}
        area={[WIN_W, WIN_H, 3]}
        position={[0, 0, 1.8]}
        seed={5}
        colorA="#ffd27a"
        colorB="#fff0c0"
        size={30}
        opacity={0.85}
        fallSpeed={-0.35}
        sway={0.5}
        softness={1.6}
        blending={THREE.AdditiveBlending}
      />
    </group>
  )
}

/** The carved border itself, plus its corner gems. */
function Frame() {
  const frame = useMemo(
    () => ornateFrameShape({ width: FRAME_W, height: FRAME_H, notch: 2.1, crown: 1.5, thickness: 1.5 }),
    [],
  )
  const bevel = useMemo(
    () => ornateFrameShape({ width: FRAME_W - 0.9, height: FRAME_H - 0.9, notch: 1.8, crown: 1.2, thickness: 0.34 }),
    [],
  )
  const gem = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 1)
    s.lineTo(0.62, 0.32)
    s.lineTo(0.62, -0.32)
    s.lineTo(0, -1)
    s.lineTo(-0.62, -0.32)
    s.lineTo(-0.62, 0.32)
    s.closePath()
    return s
  }, [])

  const gems = [
    { key: 'g0', x: 0, y: FRAME_H / 2 - 0.2, s: 0.9 },
    { key: 'g1', x: 0, y: -FRAME_H / 2 + 0.9, s: 0.8 },
    { key: 'g2', x: FRAME_W / 2 - 0.75, y: 0, s: 1.05 },
    { key: 'g3', x: -FRAME_W / 2 + 0.75, y: 0, s: 1.05 },
  ]

  return (
    <group position={[FRAME_X, 0, Z.frame]}>
      <Silhouette shape={frame} top="#8f6fb8" bottom="#4a3070" curveSegments={12} />
      <Silhouette shape={bevel} position={[0, 0, 0.06]} top="#c3a6e0" bottom="#6a4d92" curveSegments={12} opacity={0.85} />
      {gems.map(({ key, x, y, s }) => (
        <group key={key} position={[x, y, 0.12]} scale={s}>
          <Silhouette shape={gem} top="#ff9d6a" bottom="#c8384f" />
          <Glow position={[0, 0, 0.1]} size={4} color="#ff7a5c" intensity={0.4} falloff={2.6} core={0} />
        </group>
      ))}
    </group>
  )
}

export default function YokaiScene({ tier = 'high', reduced = false }) {
  const fireflyCount = tier === 'low' ? 60 : tier === 'mid' ? 130 : 240

  return (
    <>
      <ParallaxRig strength={1.1} rotation={0.014} enabled={!reduced}>
        {/* Night sky */}
        <mesh position={[0, 0, Z.sky]}>
          <planeGeometry args={[260, 150]} />
          <gradientMaterial
            uTop={new THREE.Color('#33245c')}
            uBottom={new THREE.Color('#120b22')}
            uY0={-50}
            uY1={45}
            uGrain={0.02}
            toneMapped={false}
          />
        </mesh>

        <Trunks z={Z.trunksFar} count={16} spread={170} width={4.5} height={70} top="#2a1f4e" bottom="#160f30" seed={2} opacity={0.7} />
        <Haze position={[0, -4, Z.mistFar]} width={220} height={70} color="#2b2054" opacity={0.55} power={1.5} />
        <Trunks z={Z.trunksNear} count={9} spread={140} width={6} height={80} top="#1d1540" bottom="#0e0922" seed={7} />

        <ResponsiveRig portraitScale={0.56} portraitOffset={[-7, 3.5, 0]}>
          <Float amplitude={0.28} speed={0.34} rotate={0.005}>
            <Portrait />
            <Frame />
          </Float>
        </ResponsiveRig>

        {/* Fireflies across the full depth of the grove */}
        <Drift
          count={Math.round(fireflyCount * 0.45)}
          area={[130, 70, 40]}
          position={[0, 0, -24]}
          seed={13}
          colorA="#ffc861"
          colorB="#fff3c8"
          size={16}
          opacity={0.55}
          fallSpeed={-0.3}
          sway={1.1}
          softness={1.5}
          blending={THREE.AdditiveBlending}
        />
        <Drift
          count={Math.round(fireflyCount * 0.55)}
          area={[80, 46, 22]}
          position={[6, -2, Z.foliage - 2]}
          seed={29}
          colorA="#ffd27a"
          colorB="#fff6d8"
          size={38}
          opacity={0.75}
          fallSpeed={-0.45}
          sway={1.5}
          softness={1.7}
          blending={THREE.AdditiveBlending}
        />

        <Haze position={[0, -13, Z.foliage + 4]} width={120} height={12} color="#0e0922" opacity={0.85} power={2} />
        <Haze position={[0, 13.5, Z.foliage + 4]} width={120} height={10} color="#0e0922" opacity={0.75} power={2} flip />
      </ParallaxRig>

      <Effects tier={tier} bloom={0.72} threshold={0.48} vignette={0.6} grain={0.026} />
    </>
  )
}
