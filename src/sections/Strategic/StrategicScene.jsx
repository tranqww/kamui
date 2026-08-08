import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  Drift,
  Float,
  Glow,
  Haze,
  ParallaxRig,
  ResponsiveRig,
  Silhouette,
} from '../../components/three/Primitives.jsx'
import Effects from '../../components/three/Effects.jsx'
import Samurai from './Samurai.jsx'
import { roundedRectShape } from '../../lib/shapes.js'
import { makeRng } from '../../lib/rng.js'

const Z = {
  wall: -58,
  slats: -50,
  beam: -44,
  lantern: -22,
  figure: -14,
  floor: -10,
  cards: -4,
  candles: 1,
  foreground: 10,
}

/** A single tatami-room wall panel run. */
function Wall() {
  const slat = useMemo(() => roundedRectShape({ width: 6, height: 90, radius: 0.1 }), [])
  const slats = useMemo(
    () => Array.from({ length: 15 }, (_, i) => ({ key: `slat-${i}`, x: -70 + i * 10 })),
    [],
  )

  return (
    <group>
      <mesh position={[0, 0, Z.wall]}>
        <planeGeometry args={[260, 150]} />
        <gradientMaterial
          uTop={new THREE.Color('#4a2137')}
          uBottom={new THREE.Color('#1a0d1e')}
          uY0={-60}
          uY1={40}
          uGrain={0.02}
          toneMapped={false}
        />
      </mesh>

      {slats.map(({ key, x }) => (
        <Silhouette
          key={key}
          shape={slat}
          position={[x, 0, Z.slats]}
          top="#3d1b2e"
          bottom="#150a19"
          opacity={0.55}
        />
      ))}

      {/* Horizontal beam separating wall from ceiling */}
      <Silhouette
        shape={roundedRectShape({ width: 240, height: 3.2, radius: 0.4 })}
        position={[0, 14, Z.beam]}
        top="#4d2337"
        bottom="#26101f"
      />
    </group>
  )
}

/** Hanging paper lantern with its cage and warm spill. */
function HangingLantern({ position = [0, 0, 0], scale = 1 }) {
  const cage = useMemo(() => roundedRectShape({ width: 3.4, height: 4.2, radius: 0.35 }), [])
  const paper = useMemo(() => roundedRectShape({ width: 2.4, height: 3.1, radius: 0.25 }), [])
  const cord = useMemo(() => roundedRectShape({ width: 0.16, height: 9, radius: 0.06 }), [])
  const cap = useMemo(() => roundedRectShape({ width: 3.9, height: 0.5, radius: 0.14 }), [])

  return (
    <group position={position} scale={scale}>
      <Silhouette shape={cord} position={[0, 6.6, 0]} top="#3a2030" bottom="#1d1020" />
      <Float amplitude={0.09} speed={0.5} rotate={0.012}>
        <Silhouette shape={cap} position={[0, 2.3, 0.05]} top="#5b3327" bottom="#2b1518" />
        <Silhouette shape={cage} position={[0, 0, 0]} top="#4a2a22" bottom="#231213" />
        <Silhouette shape={paper} position={[0, 0, 0.08]} top="#ffd48a" bottom="#e07a2a" grain={0} />
        <Glow position={[0, 0, 0.2]} size={4.5} color="#ffc45e" intensity={0.85} falloff={1.9} core={0.3} flicker={0.16} />
        <Glow position={[0, 0, 0.15]} size={22} color="#ff8f3a" intensity={0.28} falloff={3.2} core={0} flicker={0.1} />
      </Float>
    </group>
  )
}

/** Candle with a live flame. */
function Candle({ position = [0, 0, 0], scale = 1, seed = 0 }) {
  const body = useMemo(() => roundedRectShape({ width: 1.15, height: 2.6, radius: 0.16 }), [])
  const flameRef = useRef(null)

  const flame = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.24, 0)
    s.quadraticCurveTo(-0.34, 0.5, -0.06, 0.92)
    s.quadraticCurveTo(0.05, 0.55, 0.12, 0.4)
    s.quadraticCurveTo(0.34, 0.5, 0.24, 0)
    s.closePath()
    return s
  }, [])

  useFrame((state) => {
    const g = flameRef.current
    if (!g) return
    const t = state.clock.elapsedTime * 6 + seed * 3.1
    // Flames lean and pulse; a fixed scale reads as a decal.
    g.scale.set(1 + Math.sin(t * 0.9) * 0.06, 1 + Math.sin(t) * 0.14, 1)
    g.rotation.z = Math.sin(t * 0.6 + seed) * 0.09
  })

  return (
    <group position={position} scale={scale}>
      <Silhouette shape={body} position={[0, 1.3, 0]} top="#f2d5cf" bottom="#a05a62" />
      <group ref={flameRef} position={[0, 2.6, 0.1]}>
        <Silhouette shape={flame} position={[0, 0, 0]} top="#fff4c8" bottom="#ff8a2e" grain={0} />
      </group>
      <Glow position={[0, 2.8, 0.12]} size={3.4} color="#ffb04a" intensity={0.8} falloff={2.2} core={0.16} flicker={0.4} />
      <Glow position={[0, 2.4, 0.05]} size={14} color="#ff7a34" intensity={0.22} falloff={3.4} core={0} flicker={0.22} />
    </group>
  )
}

/**
 * A card lying face-up on the floor.
 *
 * These are real planes tipped almost flat, so the fan reads with genuine
 * perspective — the far cards foreshorten, the near ones do not.
 */
function FloorCard({ position, rotation, glow = 1, seed = 0 }) {
  const card = useMemo(() => roundedRectShape({ width: 2.3, height: 3.3, radius: 0.13 }), [])
  const inner = useMemo(() => roundedRectShape({ width: 1.85, height: 2.85, radius: 0.1 }), [])
  const glowRef = useRef(null)

  const rune = useMemo(() => {
    // A blocky sigil: two bars and a hooked stem.
    const s = new THREE.Shape()
    s.moveTo(-0.7, 0.9)
    s.lineTo(0.75, 0.9)
    s.lineTo(0.75, 0.55)
    s.lineTo(0.16, 0.55)
    s.lineTo(0.16, -0.15)
    s.lineTo(0.85, -0.15)
    s.lineTo(0.85, -0.52)
    s.lineTo(0.16, -0.52)
    s.lineTo(0.16, -1.0)
    s.lineTo(-0.2, -1.0)
    s.lineTo(-0.2, -0.52)
    s.lineTo(-0.86, -0.52)
    s.lineTo(-0.86, -0.15)
    s.lineTo(-0.2, -0.15)
    s.lineTo(-0.2, 0.55)
    s.lineTo(-0.7, 0.55)
    s.closePath()
    return s
  }, [])

  useFrame((state) => {
    if (!glowRef.current) return
    // Slow, offset pulse so the fan never breathes in unison.
    const t = state.clock.elapsedTime * 1.4 + seed * 2.3
    glowRef.current.uIntensity = glow * (0.62 + Math.sin(t) * 0.22)
  })

  return (
    <group position={position} rotation={rotation}>
      <Silhouette shape={card} position={[0, 0, 0]} top="#b8492f" bottom="#6d1f24" />
      <Silhouette shape={inner} position={[0, 0, 0.02]} top="#4a1424" bottom="#2a0c18" />
      <Silhouette shape={rune} position={[0, 0, 0.04]} scale={0.85} top="#ffd24a" bottom="#ff8a1f" grain={0} />
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[5.5, 5.5]} />
        <glowMaterial
          ref={glowRef}
          uColor={new THREE.Color('#ffab30')}
          uIntensity={glow * 0.7}
          uFalloff={2.8}
          uCore={0}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export default function StrategicScene({ tier = 'high', reduced = false }) {
  const floorCards = useMemo(() => {
    const rng = makeRng(9)
    return [
      { key: 'c0', x: -1.6, y: -9.4, z: Z.cards - 3, rot: -0.34 },
      { key: 'c1', x: 1.8, y: -9.9, z: Z.cards - 1, rot: -0.12 },
      { key: 'c2', x: 5.2, y: -10.3, z: Z.cards + 1, rot: 0.06 },
      { key: 'c3', x: 8.6, y: -9.9, z: Z.cards - 1, rot: 0.26 },
      { key: 'c4', x: 11.8, y: -9.4, z: Z.cards - 3, rot: 0.42 },
    ].map((c, i) => ({ ...c, seed: rng() * 6, glow: 0.75 + (i % 2) * 0.35 }))
  }, [])

  const floorBoard = useMemo(() => roundedRectShape({ width: 190, height: 40, radius: 0 }), [])

  const emberCount = tier === 'low' ? 40 : tier === 'mid' ? 90 : 160

  return (
    <>
      <ParallaxRig strength={0.9} rotation={0.012} enabled={!reduced}>
        <Wall />
        <ResponsiveRig portraitScale={0.62} portraitOffset={[-5.5, 2.5, 0]}>

        {/* Floor, tipped away from the camera */}
        <Silhouette
          shape={floorBoard}
          position={[0, -18, Z.floor]}
          rotation={[-1.24, 0, 0]}
          top="#4a2a24"
          bottom="#1c0e17"
          gradientFrom={-32}
          gradientHeight={26}
        />

        <HangingLantern position={[19, 6, Z.lantern]} scale={1.15} />

        <Samurai position={[13.5, -13.2, Z.figure]} scale={1.78} />

        {floorCards.map(({ key, x, y, z, rot, glow, seed }) => (
          <FloorCard
            key={key}
            position={[x, y, z]}
            rotation={[-1.15, 0, rot]}
            glow={glow}
            seed={seed}
          />
        ))}

        <Candle position={[-11.5, -15.4, Z.candles]} scale={1.15} seed={0.4} />
        <Candle position={[-5.4, -16.4, Z.candles + 3]} scale={0.92} seed={1.7} />
        <Candle position={[13.6, -16.0, Z.candles + 2]} scale={1.25} seed={2.9} />
        <Candle position={[18.4, -15.2, Z.candles - 2]} scale={1.0} seed={3.6} />

        {/* Embers lifting off the candles */}
        <Drift
          count={emberCount}
          area={[54, 40, 20]}
          position={[4, -4, Z.cards]}
          seed={77}
          colorA="#ffc061"
          colorB="#ff8a3a"
          size={16}
          opacity={0.55}
          fallSpeed={-0.45}
          sway={0.9}
          softness={1.4}
          blending={THREE.AdditiveBlending}
        />
        </ResponsiveRig>

        {/* Depth fog toward the corners of the room */}
        <Haze position={[0, -14, Z.foreground]} width={110} height={16} color="#150a19" opacity={0.82} power={2} />
        <Haze position={[0, 16, Z.foreground]} width={110} height={20} color="#150a19" opacity={0.85} power={2} flip />
      </ParallaxRig>

      <Effects tier={tier} bloom={0.72} threshold={0.5} vignette={0.62} grain={0.03} />
    </>
  )
}
