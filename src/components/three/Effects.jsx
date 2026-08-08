import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/**
 * Post pass.
 *
 * Bloom does the heavy lifting — every lantern, candle and rune in the scenes
 * is an additive quad already above 1.0, so a low luminance threshold lets
 * them bleed the way they do in the painted reference. Low-tier devices skip
 * the composer entirely rather than render it at reduced quality.
 */
export default function Effects({
  tier = 'high',
  bloom = 0.55,
  threshold = 0.62,
  smoothing = 0.4,
  vignette = 0.42,
  grain = 0.025,
}) {
  if (tier === 'low') return null

  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 0} enableNormalPass={false}>
      {/* With mipmapBlur on, `kernelSize` is ignored and the cost is set by
          the number of mip levels, so that is what tiers down here. Eight
          levels is postprocessing's default; five is visibly the same bloom
          at a third of the render targets. */}
      <Bloom
        intensity={bloom}
        luminanceThreshold={threshold}
        luminanceSmoothing={smoothing}
        levels={tier === 'high' ? 7 : 5}
        mipmapBlur
      />
      <Vignette offset={0.28} darkness={vignette} blendFunction={BlendFunction.NORMAL} />
      {tier === 'high' && grain > 0 ? (
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={grain} />
      ) : (
        <></>
      )}
    </EffectComposer>
  )
}
