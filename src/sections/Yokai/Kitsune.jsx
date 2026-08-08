import { useMemo } from 'react'
import * as THREE from 'three'
import { Glow, Silhouette } from '../../components/three/Primitives.jsx'

/**
 * A fox spirit and her familiar, framed as a portrait.
 *
 * Same discipline as the swordswoman: read the figure as shape, not as
 * anatomy. Everything that identifies her — the mask's ears, the sleeve line
 * of a furisode, the lit eyes — sits on the silhouette's edge, where a viewer
 * actually looks first.
 */

function closed(build) {
  const shape = new THREE.Shape()
  build(shape)
  shape.closePath()
  return shape
}

export default function Kitsune({ position = [0, 0, 0], scale = 1 }) {
  // Kimono: narrow at the shoulders, flaring into a pooled hem.
  const robe = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.05, 6.5)
        s.quadraticCurveTo(-1.95, 6.1, -2.3, 5.1)
        // Left sleeve hanging low
        s.quadraticCurveTo(-3.1, 4.5, -3.35, 2.6)
        s.quadraticCurveTo(-3.5, 1.6, -3.1, 1.5)
        s.quadraticCurveTo(-2.75, 2.5, -2.45, 3.2)
        // Body flaring to the hem
        s.quadraticCurveTo(-2.7, 1.4, -3.2, -1.6)
        s.quadraticCurveTo(-3.5, -3.2, -3.15, -3.5)
        s.lineTo(3.15, -3.5)
        s.quadraticCurveTo(3.5, -3.2, 3.2, -1.6)
        s.quadraticCurveTo(2.7, 1.4, 2.45, 3.2)
        // Right sleeve
        s.quadraticCurveTo(2.75, 2.5, 3.1, 1.5)
        s.quadraticCurveTo(3.5, 1.6, 3.35, 2.6)
        s.quadraticCurveTo(3.1, 4.5, 2.3, 5.1)
        s.quadraticCurveTo(1.95, 6.1, 1.05, 6.5)
      }),
    [],
  )

  const collar = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.15, 6.45)
        s.quadraticCurveTo(0, 5.6, 1.15, 6.45)
        s.quadraticCurveTo(0, 4.5, -1.15, 6.45)
      }),
    [],
  )

  // Masked head with fox ears.
  const head = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.0, 7.0)
        // Left ear
        s.lineTo(-1.15, 8.9)
        s.lineTo(-0.35, 8.15)
        // Crown
        s.quadraticCurveTo(0, 8.3, 0.35, 8.15)
        // Right ear
        s.lineTo(1.15, 8.9)
        s.lineTo(1.0, 7.0)
        // Muzzle tapering to a point
        s.quadraticCurveTo(0.85, 6.1, 0, 5.75)
        s.quadraticCurveTo(-0.85, 6.1, -1.0, 7.0)
      }),
    [],
  )

  const eye = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-0.42, 0.12)
        s.lineTo(-0.06, -0.02)
        s.lineTo(-0.08, -0.2)
        s.lineTo(-0.44, -0.08)
      }),
    [],
  )

  const brow = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-0.62, 0.08)
        s.quadraticCurveTo(0, -0.22, 0.62, 0.08)
        s.quadraticCurveTo(0, -0.02, -0.62, 0.08)
      }),
    [],
  )

  // The familiar: a small fox looking back over its shoulder.
  const fox = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.5, 0)
        // Tail curling up behind
        s.quadraticCurveTo(-2.4, 0.4, -2.15, 1.5)
        s.quadraticCurveTo(-1.95, 2.1, -1.4, 1.8)
        s.quadraticCurveTo(-1.7, 1.3, -1.35, 0.85)
        // Back to the shoulders
        s.quadraticCurveTo(-0.5, 1.15, 0.35, 1.35)
        // Head with two ears
        s.lineTo(0.3, 2.2)
        s.lineTo(0.75, 1.6)
        s.lineTo(1.2, 2.25)
        s.lineTo(1.28, 1.4)
        s.quadraticCurveTo(1.75, 1.15, 1.55, 0.75)
        s.quadraticCurveTo(1.0, 0.5, 0.5, 0.55)
        s.quadraticCurveTo(-0.4, 0.15, -1.5, 0)
      }),
    [],
  )

  return (
    <group position={position} scale={scale}>
      {/* The lantern she carries lights her from below */}
      <Glow position={[0, 1.6, -0.4]} size={16} color="#ff9c4a" intensity={0.5} falloff={2.6} core={0} />

      <Silhouette shape={robe} top="#b04a72" bottom="#3f1c46" curveSegments={30} rim={0.35} rimColor="#ffb2a0" rimWidth={0.16} />
      <Silhouette shape={collar} position={[0, 0, 0.05]} top="#f4dcd0" bottom="#c08fa0" curveSegments={20} />
      {/* Bone-white mask: the one high-value shape in an otherwise dark
          figure, so the eye lands on the face first. */}
      <Silhouette shape={head} position={[0, 0, 0.1]} top="#f6ece4" bottom="#b49bc0" curveSegments={22} />

      {/* Lit eyes — the detail that makes the mask a face */}
      <Silhouette shape={eye} position={[-0.16, 7.28, 0.16]} top="#ff9a4a" bottom="#e2482f" grain={0} />
      <Silhouette shape={eye} position={[0.16, 7.28, 0.16]} scale={[-1, 1, 1]} top="#ff9a4a" bottom="#e2482f" grain={0} />

      {/* Mask markings — the red brush strokes an inari mask always carries */}
      <Silhouette shape={brow} position={[0, 7.95, 0.16]} top="#e2482f" bottom="#a82f2c" grain={0} />

      {/* Familiar at her left, clear of the lantern */}
      <group position={[-3.1, -2.5, 0.2]} scale={0.92}>
        <Silhouette shape={fox} top="#efe4ea" bottom="#7a6aa6" curveSegments={24} rim={0.35} rimColor="#ffe4c6" rimWidth={0.2} />
      </group>
    </group>
  )
}
