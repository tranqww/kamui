import { useMemo } from 'react'
import * as THREE from 'three'
import { Glow, Silhouette } from '../../components/three/Primitives.jsx'
import { pagodaRoofShape, roundedRectShape } from '../../lib/shapes.js'

const ROOF_TOP = '#3b5f66'
const ROOF_BOTTOM = '#1f3b45'
const WOOD_TOP = '#a2724f'
const WOOD_BOTTOM = '#5d3f33'
const POST_TOP = '#6d4a3a'
const POST_BOTTOM = '#33212c'
const FIRE = '#ffb547'

/** A thin vertical member — post, baluster, stilt. */
function Beam({ x, y, w, h, top = POST_TOP, bottom = POST_BOTTOM, z = 0 }) {
  const shape = useMemo(() => roundedRectShape({ width: w, height: h, radius: w * 0.22 }), [w, h])
  return <Silhouette shape={shape} position={[x, y, z]} top={top} bottom={bottom} grain={0.008} />
}

/**
 * The hilltop shrine.
 *
 * Built as a stack of generated silhouettes rather than a model: the swept
 * roofs come from `pagodaRoofShape`, everything else is rounded plates. That
 * keeps the whole structure under a dozen draw calls and lets the roof curve
 * be tuned as a number instead of re-exported from a DCC tool.
 */
export default function Pagoda({ position = [0, 0, 0], scale = 1 }) {
  const lowerRoof = useMemo(
    () => pagodaRoofShape({ width: 13.4, rise: 2.9, eaveLift: 0.85, thickness: 0.62 }),
    [],
  )
  const upperRoof = useMemo(
    () => pagodaRoofShape({ width: 9.2, rise: 2.3, eaveLift: 0.6, thickness: 0.5 }),
    [],
  )

  const deck = useMemo(() => roundedRectShape({ width: 11.6, height: 0.62, radius: 0.18 }), [])
  const body = useMemo(() => roundedRectShape({ width: 7.6, height: 3.5, radius: 0.22 }), [])
  const doorway = useMemo(() => roundedRectShape({ width: 4.4, height: 2.7, radius: 0.16 }), [])
  const rail = useMemo(() => roundedRectShape({ width: 11.2, height: 0.24, radius: 0.12 }), [])
  const lintel = useMemo(() => roundedRectShape({ width: 9.6, height: 0.4, radius: 0.14 }), [])

  // A tapering needle: the finial that reads as the shrine's spire.
  const spire = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.34, 0)
    s.lineTo(-0.16, 3.6)
    s.lineTo(0, 6.4)
    s.lineTo(0.16, 3.6)
    s.lineTo(0.34, 0)
    s.closePath()
    return s
  }, [])

  const flame = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.5, 0)
    s.quadraticCurveTo(-0.62, 0.9, -0.12, 1.5)
    s.quadraticCurveTo(-0.2, 0.85, 0.16, 0.62)
    s.quadraticCurveTo(0.62, 1.0, 0.5, 0)
    s.closePath()
    return s
  }, [])

  const eaveLamp = useMemo(() => roundedRectShape({ width: 0.95, height: 1.25, radius: 0.3 }), [])

  const balusters = useMemo(
    () => [-5.0, -3.6, -2.2, -0.8, 0.6, 2.0, 3.4, 4.8].map((x, i) => ({ x, key: `${x}-${i}` })),
    [],
  )

  return (
    <group position={position} scale={scale}>
      {/* Stilts carrying the deck out over the slope */}
      <Beam x={-4.4} y={-4.4} w={0.55} h={5.2} />
      <Beam x={-1.6} y={-4.9} w={0.5} h={6.2} />
      <Beam x={1.6} y={-5.2} w={0.5} h={6.8} />
      <Beam x={4.4} y={-4.7} w={0.55} h={5.8} />

      {/* Deck and railing */}
      <Silhouette shape={deck} position={[0, -1.9, 0.1]} top={WOOD_TOP} bottom="#4a3128" />
      {balusters.map(({ x, key }) => (
        <Beam key={key} x={x} y={-1.1} w={0.2} h={1.5} z={0.14} top="#8a5f45" bottom="#4a3128" />
      ))}
      <Silhouette shape={rail} position={[0, -0.4, 0.18]} top="#a2724f" bottom="#6b4736" />

      {/* Body with a lit interior */}
      <Silhouette shape={body} position={[0, 1.2, 0.05]} top={WOOD_TOP} bottom={WOOD_BOTTOM} />
      <Silhouette shape={doorway} position={[0, 1.0, 0.12]} top="#2a1626" bottom="#150c18" />
      <Glow position={[0, 0.55, 0.2]} size={5.4} color={FIRE} intensity={0.72} falloff={2.4} flicker={0.34} />
      <Silhouette
        shape={flame}
        position={[0, 0.1, 0.26]}
        scale={1.05}
        top="#fff0c2"
        bottom="#ff8c3a"
        grain={0}
      />

      {/* Lower roof + its supporting lintel */}
      <Silhouette shape={lintel} position={[0, 3.05, 0.14]} top="#8a5f45" bottom="#4a3128" />
      <Silhouette
        shape={lowerRoof}
        position={[0, 3.25, 0.2]}
        top={ROOF_TOP}
        bottom={ROOF_BOTTOM}
        rim={0.35}
        rimColor="#7fb0ad"
        rimWidth={0.14}
        curveSegments={28}
      />

      {/* Upper roof, set back and lifted */}
      <Silhouette
        shape={upperRoof}
        position={[0, 5.5, 0.16]}
        top={ROOF_TOP}
        bottom={ROOF_BOTTOM}
        rim={0.42}
        rimColor="#8fc2bd"
        rimWidth={0.16}
        curveSegments={28}
      />

      {/* Spire */}
      <Silhouette shape={spire} position={[0, 7.4, 0.1]} top="#4c7079" bottom="#22434c" />

      {/* Eave lanterns */}
      {[-6.1, 6.1].map((x) => (
        <group key={x} position={[x, 2.4, 0.3]}>
          <Beam x={0} y={0.75} w={0.12} h={1.1} top="#6d4a3a" bottom="#4a3128" />
          <Silhouette shape={eaveLamp} position={[0, -0.35, 0]} top="#ffd98a" bottom="#e08b2e" />
          <Glow position={[0, -0.35, 0.1]} size={4.2} color={FIRE} intensity={0.6} falloff={2.8} flicker={0.22} />
        </group>
      ))}
    </group>
  )
}
