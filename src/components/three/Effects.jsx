import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'

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
      <Bloom
        intensity={bloom}
        luminanceThreshold={threshold}
        luminanceSmoothing={smoothing}
        kernelSize={tier === 'high' ? KernelSize.LARGE : KernelSize.MEDIUM}
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
