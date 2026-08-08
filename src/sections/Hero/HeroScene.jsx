import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  Drift,
  Glow,
  Haze,
  LightShafts,
  ParallaxRig,
  ResponsiveRig,
  Silhouette,
  TimeDriver,
} from '../../components/three/Primitives.jsx'
import Effects from '../../components/three/Effects.jsx'
import Pagoda from './Pagoda.jsx'
import { Bridge, Crane, Stairway, StoneLantern } from './Props.jsx'
import {
  hillShape,
  mountainShape,
  pineTreeShape,
  reedShape,
  rockShape,
  treelineShape,
} from '../../lib/shapes.js'
import { clamp01, damp } from '../../lib/rng.js'

/* --------------------------------------------------------------------------
   Depth ladder.

   Tuned against a 40° camera at z = 36, which puts the horizon a little above
   centre and leaves the bottom quarter to foreground rock. Layers sit close
   enough that parallax stays believable, far enough that the haze between them
   actually separates.
   -------------------------------------------------------------------------- */
const Z = {
  sky: -86,
  peaksFar: -70,
  peaksMid: -58,
  hazeA: -52,
  peaksNear: -44,
  treeline: -36,
  hazeB: -32,
  forest: -26,
  hill: -20,
  stairs: -19.5,
  pagoda: -19,
  bankFar: -15,
  water: -13,
  bridge: -9,
  cranes: -7,
  reeds: -5,
  rocksMid: 2,
  lantern: 6,
  rocksNear: 10,
}

function Sky() {
  const ref = useRef(null)

  return (
    // Sized so the visible slice spans most of the ramp — an over-tall plane
    // would compress all five colour stops into a sliver of flat pink.
    <mesh position={[0, 6, Z.sky]}>
      <planeGeometry args={[330, 122]} />
      <skyMaterial
        ref={ref}
        uC1={new THREE.Color('#f9c6c3')}
        uC2={new THREE.Color('#f0a2bb')}
        uC3={new THREE.Color('#cf85b6')}
        uC4={new THREE.Color('#92659f')}
        uC5={new THREE.Color('#5e4179')}
        uSun={new THREE.Vector2(0.69, 0.66)}
        uSunColor={new THREE.Color('#fff0dd')}
        uSunStrength={0.42}
        uCloud={0.44}
        toneMapped={false}
      />
      <TimeDriver target={ref} />
    </mesh>
  )
}

function River() {
  const ref = useRef(null)

  return (
    <mesh position={[0, -16, Z.water]}>
      <planeGeometry args={[140, 13]} />
      <waterMaterial
        ref={ref}
        uTop={new THREE.Color('#b382ae')}
        uBottom={new THREE.Color('#452a5d')}
        uHighlight={new THREE.Color('#ffd6c9')}
        toneMapped={false}
      />
      <TimeDriver target={ref} />
    </mesh>
  )
}

export default function HeroScene({ tier = 'high', reduced = false }) {
  const rig = useRef(null)

  /* ---- Generated silhouettes, built once ------------------------------- */
  const peaksFar = useMemo(
    () => mountainShape({ width: 200, height: 30, peaks: 6, seed: 12, jitter: 0.5, skirt: 70 }),
    [],
  )
  const peaksMid = useMemo(
    () => mountainShape({ width: 190, height: 22, peaks: 8, seed: 27, jitter: 0.6, skirt: 70 }),
    [],
  )
  const peaksNear = useMemo(
    () => mountainShape({ width: 180, height: 15, peaks: 11, seed: 44, jitter: 0.66, skirt: 70 }),
    [],
  )
  const treeline = useMemo(
    () => treelineShape({ width: 180, height: 7, count: 90, seed: 61, skirt: 50 }),
    [],
  )
  const forest = useMemo(
    () => treelineShape({ width: 160, height: 10, count: 55, seed: 88, skirt: 50, spread: 0.48 }),
    [],
  )
  const hill = useMemo(
    () =>
      hillShape({
        width: 150,
        amplitude: 2.2,
        seed: 5,
        frequency: 0.06,
        skirt: 44,
        crest: 14,
        crestAt: 0.383,
        crestWidth: 0.14,
      }),
    [],
  )
  const bankFar = useMemo(
    () =>
      hillShape({
        width: 140,
        amplitude: 1.8,
        seed: 91,
        frequency: 0.08,
        skirt: 40,
        crest: 5.5,
        crestAt: 0.6,
        crestWidth: 0.2,
      }),
    [],
  )
  const hillScrub = useMemo(
    () => treelineShape({ width: 30, height: 2.4, count: 22, seed: 121, skirt: 8, spread: 0.6 }),
    [],
  )
  const reeds = useMemo(() => reedShape({ blades: 13, height: 3.2, width: 8, seed: 33 }), [])
  const reedsB = useMemo(() => reedShape({ blades: 9, height: 2.4, width: 5.5, seed: 77 }), [])
  const tuft = useMemo(() => reedShape({ blades: 7, height: 1.2, width: 2.2, seed: 44 }), [])

  const rocksMid = useMemo(
    () => [
      { key: 'rm0', shape: rockShape({ width: 26, height: 9, facets: 9, seed: 101, lean: 0.3 }), x: -25, y: -15.2 },
      { key: 'rm1', shape: rockShape({ width: 16, height: 5.5, facets: 8, seed: 133 }), x: -4, y: -15.8 },
      { key: 'rm2', shape: rockShape({ width: 21, height: 7.5, facets: 9, seed: 155, lean: -0.25 }), x: 22, y: -15.2 },
    ],
    [],
  )

  const rocksNear = useMemo(
    () => [
      { key: 'rn0', shape: rockShape({ width: 21, height: 11, facets: 11, seed: 201, lean: 0.4 }), x: -15, y: -13.6 },
      { key: 'rn1', shape: rockShape({ width: 15, height: 7.5, facets: 9, seed: 233 }), x: 5, y: -14.2 },
      { key: 'rn2', shape: rockShape({ width: 18, height: 9.5, facets: 10, seed: 277, lean: -0.3 }), x: 23, y: -13.6 },
    ],
    [],
  )

  const lanternRock = useMemo(
    () => rockShape({ width: 14, height: 6, facets: 8, seed: 311, lean: -0.2 }),
    [],
  )

  const pines = useMemo(
    () =>
      [
        { x: -38, y: -14, h: 10, s: 3 },
        { x: -31, y: -15, h: 7.5, s: 9 },
        { x: 31, y: -14, h: 9, s: 15 },
        { x: 39, y: -15, h: 7, s: 21 },
      ].map(({ x, y, h, s }, i) => ({
        key: `pine-${i}`,
        x,
        y,
        shape: pineTreeShape({ height: h, width: h * 0.38, tiers: 5, seed: s }),
      })),
    [],
  )

  /* ---- Scroll-linked camera drift -------------------------------------- */
  useFrame((state, delta) => {
    const g = rig.current
    if (!g) return
    const dt = Math.min(delta, 1 / 30)
    const progress = reduced ? 0 : clamp01(window.scrollY / Math.max(window.innerHeight, 1))
    g.position.y = damp(g.position.y, progress * 8, 4, dt)
    g.position.z = damp(g.position.z, progress * -7, 4, dt)
  })

  const petalCount = tier === 'low' ? 110 : tier === 'mid' ? 220 : 420

  return (
    <>
      <group ref={rig}>
        <ParallaxRig strength={1.4} rotation={0.016} enabled={!reduced}>
          <ResponsiveRig portraitScale={0.55} portraitOffset={[7.5, 3, 0]}>
          <Sky />

          {/* Sized to the visible falloff, not to the frustum: at size 185
              this quad blew past both frustum axes and shaded a full screen of
              fragments that were already at zero alpha. */}
          <Glow position={[22, 10, Z.sky + 8]} size={96} color="#ffe2c8" intensity={0.17} falloff={2.6} core={0} />
          <LightShafts
            position={[20, 14, Z.peaksMid + 5]}
            count={5}
            length={120}
            width={6}
            spread={0.34}
            tilt={-0.34}
            color="#ffe6d0"
            opacity={0.035}
          />

          {/* Ranges: palest and tallest at the back, each catching the sun */}
          <Silhouette
            shape={peaksFar}
            position={[12, -9, Z.peaksFar]}
            top="#f9dfd7"
            bottom="#e3a8c2"
            rim={0.55}
            rimColor="#fff4e8"
            rimWidth={0.1}
          />
          <Silhouette
            shape={peaksMid}
            position={[-14, -11, Z.peaksMid]}
            top="#dda9c6"
            bottom="#ac79b0"
            rim={0.36}
            rimColor="#ffd7c6"
            rimWidth={0.09}
          />
          <Haze position={[0, -7, Z.hazeA]} width={300} height={60} color="#e3a0bf" opacity={0.28} power={1.6} />

          <Silhouette
            shape={peaksNear}
            position={[18, -13, Z.peaksNear]}
            top="#a97cb0"
            bottom="#71508b"
            rim={0.32}
            rimColor="#ffc7b2"
            rimWidth={0.08}
          />
          <Silhouette shape={treeline} position={[-8, -14, Z.treeline]} top="#684a89" bottom="#453172" />
          <Haze position={[0, -11, Z.hazeB]} width={280} height={44} color="#b06fa4" opacity={0.24} power={1.8} />

          <Silhouette shape={forest} position={[8, -16, Z.forest]} top="#43306a" bottom="#261d4a" />
          {pines.map(({ key, x, y, shape }) => (
            <Silhouette key={key} shape={shape} position={[x, y, Z.forest + 2]} top="#392b60" bottom="#1e1839" />
          ))}

          {/* The shrine hill, its stairway, and the shrine itself */}
          <Silhouette
            shape={hill}
            position={[0, -18, Z.hill]}
            top="#2f4453"
            bottom="#1b1f3a"
            rim={0.3}
            rimColor="#6e9a86"
            rimWidth={0.05}
          />
          <Silhouette
            shape={hillScrub}
            position={[-13, -6.8, Z.hill + 0.4]}
            top="#23413f"
            bottom="#141f31"
          />
          <Stairway
            position={[-15.6, -9.2, Z.stairs]}
            rotation={[0, 0, 0.16]}
            steps={17}
            bottomWidth={3.8}
            topWidth={1.9}
            height={8.4}
          />
          <Pagoda position={[-17.5, 1.2, Z.pagoda]} scale={0.86} />

          {/* Near bank, then the river */}
          <Silhouette shape={bankFar} position={[10, -17.5, Z.bankFar]} top="#3d3163" bottom="#211b3e" />
          <River />

          <Bridge position={[6, -11.6, Z.bridge]} span={20} rise={2.4} />

          <Crane position={[-0.8, -12.9, Z.cranes]} scale={1.35} legHeight={1.7} />
          <Crane position={[3.6, -13.3, Z.cranes]} scale={1.1} legHeight={1.4} flip />

          <Silhouette shape={reeds} position={[-13, -14.4, Z.reeds]} top="#3d6759" bottom="#1e2a48" />
          <Silhouette shape={reedsB} position={[16, -14.8, Z.reeds]} top="#365d50" bottom="#1c2542" />

          {/* Foreground rock shelves */}
          {rocksMid.map(({ key, shape, x, y }) => (
            <Silhouette
              key={key}
              shape={shape}
              position={[x, y, Z.rocksMid]}
              top="#34244a"
              bottom="#180f28"
              rim={0.24}
              rimColor="#7c5c98"
              rimWidth={0.09}
            />
          ))}

          {/* Lantern on its own boulder, cropped by the right edge */}
          <Silhouette
            shape={lanternRock}
            position={[15.5, -13, Z.lantern - 0.4]}
            top="#33234c"
            bottom="#1a1130"
            rim={0.18}
            rimColor="#7a5a95"
            rimWidth={0.1}
          />
          <StoneLantern position={[15.5, -7.8, Z.lantern]} scale={1.6} />

          {rocksNear.map(({ key, shape, x, y }) => (
            <Silhouette
              key={key}
              shape={shape}
              position={[x, y, Z.rocksNear]}
              top="#1f1433"
              bottom="#0c0716"
              rim={0.2}
              rimColor="#6d4f88"
              rimWidth={0.07}
            />
          ))}

          {/* Magenta flower tufts catching the last of the light */}
          {[
            { key: 't0', x: -19, y: -4.6, s: 1.0 },
            { key: 't1', x: 2, y: -8.2, s: 0.75 },
            { key: 't2', x: 14, y: -6.4, s: 0.9 },
          ].map(({ key, x, y, s }) => (
            <Silhouette
              key={key}
              shape={tuft}
              position={[x, y, Z.rocksNear + 0.3]}
              scale={s}
              top="#b4569a"
              bottom="#3f2352"
            />
          ))}

          {/* Sakura drifting through three depth bands */}
          <Drift
            count={Math.round(petalCount * 0.36)}
            area={[150, 86, 40]}
            position={[0, 8, Z.forest + 6]}
            seed={7}
            colorA="#ffd2e0"
            colorB="#f7b9cf"
            size={13}
            opacity={0.48}
            fallSpeed={0.7}
            sway={1.6}
          />
          <Drift
            count={Math.round(petalCount * 0.4)}
            area={[105, 64, 26]}
            position={[0, 4, Z.bridge]}
            seed={19}
            colorA="#ffe2ea"
            colorB="#ffc2d5"
            size={26}
            opacity={0.82}
            fallSpeed={1.05}
            sway={1.9}
          />
          <Drift
            count={Math.round(petalCount * 0.24)}
            area={[62, 42, 16]}
            position={[0, 2, Z.rocksNear - 2]}
            seed={31}
            colorA="#fff2f5"
            colorB="#ffcedc"
            size={54}
            opacity={0.72}
            fallSpeed={1.5}
            sway={2.4}
          />
          </ResponsiveRig>
        </ParallaxRig>
      </group>

      {/* Bottom falloff that hands the page over to the next section */}
      <Haze position={[0, -11.4, 18]} width={90} height={8} color="#2a1435" opacity={0.9} power={2.4} />

      <Effects tier={tier} bloom={0.42} threshold={0.72} vignette={0.34} grain={0.018} />
    </>
  )
}
