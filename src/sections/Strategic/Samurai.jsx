import { useMemo } from 'react'
import * as THREE from 'three'
import { Glow, Silhouette } from '../../components/three/Primitives.jsx'

/**
 * A swordswoman kneeling over the hand she has just dealt.
 *
 * Drawn as a backlit silhouette rather than a shaded figure. Modelling a
 * convincing lit human out of bezier patches is a losing game at this scale;
 * a clean profile against the lantern reads instantly, survives any screen
 * size, and is how the reference's darkest frames actually resolve. The warm
 * halo sits *behind* the figure, so the light wraps the contour instead of
 * painting it.
 *
 * Origin is the floor line, centred under the hips. She faces -X, toward the
 * copy, so the composition closes inward.
 */

const BODY_TOP = '#3b2447'
const BODY_BOTTOM = '#150b1e'
const ARMOR_TOP = '#2f5459'
const ARMOR_BOTTOM = '#152a33'

function closed(build) {
  const shape = new THREE.Shape()
  build(shape)
  shape.closePath()
  return shape
}

export default function Samurai({ position = [0, 0, 0], scale = 1 }) {
  // Torso, head, topknot and folded legs as one continuous contour.
  const body = useMemo(
    () =>
      closed((s) => {
        s.moveTo(2.4, 0.12)
        // Back: heel, hip, spine, out to the shoulder
        s.quadraticCurveTo(2.78, 1.7, 2.36, 3.2)
        s.quadraticCurveTo(2.06, 4.5, 1.86, 5.5)
        // Neck — pinched in hard so the head reads as a separate mass
        s.quadraticCurveTo(1.5, 6.0, 0.84, 6.24)
        // Back of the skull
        s.quadraticCurveTo(1.02, 6.7, 0.94, 7.06)
        // Topknot
        s.quadraticCurveTo(0.86, 7.42, 1.14, 7.86)
        s.quadraticCurveTo(1.2, 8.36, 0.6, 8.3)
        s.quadraticCurveTo(0.2, 8.2, 0.28, 7.86)
        // Crown, brow, nose, chin
        s.quadraticCurveTo(-0.16, 7.62, -0.72, 7.24)
        s.quadraticCurveTo(-1.0, 7.06, -1.02, 6.9)
        s.quadraticCurveTo(-0.8, 6.78, -0.66, 6.6)
        // Throat down into the chest
        s.quadraticCurveTo(-0.5, 6.24, -0.58, 6.1)
        s.quadraticCurveTo(-1.2, 5.82, -1.62, 5.34)
        s.quadraticCurveTo(-1.95, 4.5, -1.92, 3.3)
        // Lap, thigh folded forward, knee on the floor
        s.quadraticCurveTo(-2.1, 2.3, -2.72, 1.76)
        s.quadraticCurveTo(-3.5, 1.1, -4.15, 0.62)
        s.quadraticCurveTo(-4.55, 0.34, -4.4, 0.12)
        s.lineTo(2.4, 0.1)
      }),
    [],
  )

  // Near arm, braced on the floor in front of her.
  const arm = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.05, 5.5)
        // Outer edge: shoulder → elbow → wrist, planted well past the knee
        s.quadraticCurveTo(-2.9, 4.5, -4.3, 3.0)
        s.quadraticCurveTo(-5.5, 1.7, -6.15, 0.42)
        s.quadraticCurveTo(-6.35, 0.06, -5.8, 0.06)
        // Inner edge back up to the armpit
        s.quadraticCurveTo(-5.4, 0.5, -5.1, 1.0)
        s.quadraticCurveTo(-4.3, 2.3, -3.3, 3.4)
        s.quadraticCurveTo(-2.3, 4.4, -0.6, 5.0)
      }),
    [],
  )

  // Lamellar shoulder plate — the one piece that catches enough light to read
  // as a separate material.
  // Sheathed katana laid on the floor beside her. A prop the eye can name
  // instantly does more for "samurai" than any amount of armour detailing on
  // a silhouette this small.
  const saya = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.2, 0.52)
        s.quadraticCurveTo(2.6, 0.16, 5.6, 0.32)
        s.quadraticCurveTo(6.0, 0.4, 5.6, 0.62)
        s.quadraticCurveTo(2.6, 0.76, -1.2, 0.9)
      }),
    [],
  )

  const tsuka = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.15, 0.44)
        s.lineTo(-3.3, 0.66)
        s.quadraticCurveTo(-3.7, 0.72, -3.68, 0.9)
        s.lineTo(-1.15, 0.98)
      }),
    [],
  )

  const tsuba = useMemo(
    () =>
      closed((s) => {
        s.moveTo(-1.05, 0.28)
        s.lineTo(-0.72, 0.26)
        s.lineTo(-0.66, 1.14)
        s.lineTo(-1.02, 1.16)
      }),
    [],
  )

  return (
    <group position={position} scale={scale}>
      {/* Backlight: the lantern wrapping her contour */}
      <Glow position={[1.2, 4.4, -1.2]} size={26} color="#ff9c46" intensity={0.5} falloff={2.4} core={0} />
      <Glow position={[2.2, 5.6, -0.8]} size={11} color="#ffc878" intensity={0.5} falloff={2.2} core={0} />

      {/* Katana on the floor, in front of the figure */}
      {/* Set down on her right, clear of the dealt hand — a prop the eye can
          name only helps if nothing is lying across it. */}
      <group position={[2.6, 0.15, -0.5]} rotation={[0, 0, 0.05]}>
        <Silhouette shape={saya} top={ARMOR_TOP} bottom={ARMOR_BOTTOM} curveSegments={22} rim={0.5} rimColor="#7fc4bd" rimWidth={0.5} />
        <Silhouette shape={tsuka} position={[0, 0, 0.02]} top="#4a3a52" bottom="#1e1626" />
        <Silhouette shape={tsuba} position={[0, 0, 0.04]} top="#b98b3e" bottom="#6b4a1e" />
      </group>

      <Silhouette shape={body} top={BODY_TOP} bottom={BODY_BOTTOM} curveSegments={30} rim={0.3} rimColor="#7d5a86" rimWidth={0.18} />
      <Silhouette shape={arm} position={[0, 0, 0.1]} top="#33203f" bottom="#120a1a" curveSegments={26} />
    </group>
  )
}
