import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  color,
  Float,
  Glow,
  Haze,
  ParallaxRig,
  ResponsiveRig,
  Silhouette,
} from '../../components/three/Primitives.jsx'
import Effects from '../../components/three/Effects.jsx'
import { CARD_H, CARD_W, drawCardBack, drawCardFront, drawSeigaiha, makeCanvas } from '../../lib/cardArt.js'
import { roundedRectShape } from '../../lib/shapes.js'
import { damp } from '../../lib/rng.js'

const CARD_ASPECT = CARD_W / CARD_H
const CENTER_H = 18
const SIDE_H = 14.6

function useCanvasTexture(factory, deps) {
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(factory())
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.needsUpdate = true
    return tex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/**
 * One card as an actual box.
 *
 * A textured plane would flip to nothing at 90°. Giving the card real
 * thickness means the edge-on moment reads as a card turning in space, which
 * is the whole point of doing this in WebGL instead of with a CSS transform.
 */
function Card({ height, frontMap, backMap, position, rotationY = 0, dim = 0 }) {
  const width = height * CARD_ASPECT
  const edge = useMemo(() => new THREE.Color('#3c2560').lerp(new THREE.Color('#000'), dim), [dim])
  const tint = useMemo(() => new THREE.Color(1 - dim * 0.45, 1 - dim * 0.45, 1 - dim * 0.4), [dim])

  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[width, height, 0.34]} />
      <meshBasicMaterial attach="material-0" color={edge} toneMapped={false} />
      <meshBasicMaterial attach="material-1" color={edge} toneMapped={false} />
      <meshBasicMaterial attach="material-2" color={edge} toneMapped={false} />
      <meshBasicMaterial attach="material-3" color={edge} toneMapped={false} />
      {/* +Z shows the back at rest; +180° brings the face around */}
      <meshBasicMaterial attach="material-4" map={backMap} color={tint} toneMapped={false} />
      <meshBasicMaterial attach="material-5" map={frontMap} color={tint} toneMapped={false} />
    </mesh>
  )
}

export default function CardsScene({ tier = 'high', reduced = false, cards, index, revealed }) {
  const backMap = useCanvasTexture(() => makeCanvas(drawCardBack), [])

  const frontMaps = useMemo(
    () =>
      cards.map((card) => {
        const tex = new THREE.CanvasTexture(
          makeCanvas((ctx, w, h) => drawCardFront(ctx, card, w, h)),
        )
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        return tex
      }),
    [cards],
  )

  useEffect(() => () => frontMaps.forEach((t) => t.dispose()), [frontMaps])

  const waveMap = useCanvasTexture(
    () =>
      makeCanvas(
        (ctx, w, h) => {
          ctx.fillStyle = '#3a2050'
          ctx.fillRect(0, 0, w, h)
          drawSeigaiha(ctx, w, h, 96, '#5c3a78', 0.55)
        },
        1024,
        512,
      ),
    [],
  )

  const spin = useRef(null)
  const glowRef = useRef(null)

  useFrame((state, delta) => {
    const g = spin.current
    if (!g) return
    const dt = Math.min(delta, 1 / 30)
    const target = revealed ? Math.PI : 0
    g.rotation.y = reduced ? target : damp(g.rotation.y, target, 5.2, dt)

    if (glowRef.current) {
      // Brightest edge-on: that is when the card is catching the most light.
      const edgeOn = Math.abs(Math.sin(g.rotation.y))
      glowRef.current.uIntensity = 0.18 + edgeOn * 0.5
    }
  })

  const panel = useMemo(() => roundedRectShape({ width: 62, height: 30, radius: 1.4 }), [])

  const prevIndex = (index + cards.length - 1) % cards.length
  const nextIndex = (index + 1) % cards.length

  return (
    <>
      <ParallaxRig strength={0.7} rotation={0.02} enabled={!reduced}>
        {/* Backdrop */}
        <mesh position={[0, 0, -40]}>
          <planeGeometry args={[220, 130]} />
          <gradientMaterial
            uTop={color('#4a2a63')}
            uBottom={color('#2c1740')}
            uY0={-40}
            uY1={40}
            uGrain={0.02}
            toneMapped={false}
          />
        </mesh>

        {/* Wave-patterned plate the cards sit against */}
        <mesh position={[0, 0.5, -18]}>
          <planeGeometry args={[74, 37]} />
          <meshBasicMaterial map={waveMap} toneMapped={false} transparent opacity={0.55} />
        </mesh>
        <Silhouette shape={panel} position={[0, 0.5, -16]} top="#40245a" bottom="#301a46" opacity={0.72} />

        <Glow position={[0, 0, -12]} size={72} color="#7a4f9e" intensity={0.34} falloff={2.6} core={0} />

        <ResponsiveRig portraitScale={0.74} portraitOffset={[0, 1.6, 0]}>
        {/* Flanking cards */}
        <Float amplitude={0.16} speed={0.42} rotate={0.008} offset={0.8}>
          <Card
            height={SIDE_H}
            frontMap={frontMaps[prevIndex]}
            backMap={backMap}
            position={[-15.2, -0.6, -4]}
            dim={0.55}
          />
        </Float>
        <Float amplitude={0.16} speed={0.44} rotate={0.008} offset={2.4}>
          <Card
            height={SIDE_H}
            frontMap={frontMaps[nextIndex]}
            backMap={backMap}
            position={[15.2, -0.6, -4]}
            dim={0.55}
          />
        </Float>

        {/* Hero card */}
        <Float amplitude={0.22} speed={0.5} rotate={0}>
          <group ref={spin} position={[0, 0, 3]}>
            <Card height={CENTER_H} frontMap={frontMaps[index]} backMap={backMap} position={[0, 0, 0]} />
          </group>
          <mesh position={[0, 0, 0.6]} renderOrder={20}>
            <planeGeometry args={[34, 34]} />
            <glowMaterial
              ref={glowRef}
              uColor={color('#ffb0d0')}
              uIntensity={0.2}
              uFalloff={3.2}
              uCore={0}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </Float>
        </ResponsiveRig>

        <Haze position={[0, -13.5, 14]} width={110} height={10} color="#2c1740" opacity={0.8} power={2} />
        <Haze position={[0, 13.5, 14]} width={110} height={10} color="#2c1740" opacity={0.7} power={2} flip />
      </ParallaxRig>

      <Effects tier={tier} bloom={0.46} threshold={0.66} vignette={0.5} grain={0.02} />
    </>
  )
}
