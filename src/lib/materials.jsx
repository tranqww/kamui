import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

/**
 * Flat, unlit shader materials.
 *
 * The reference art is painted, not rendered — no specular, no shadows, just
 * layered gradients separated by atmosphere. So every material here is unlit
 * and drives its colour from world-space Y (or UV), which is what makes a
 * generated silhouette read as a brush-filled shape.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

/** Cheap hash + 2D value noise, shared by the sky and the water. */
const NOISE = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`

/* ==========================================================================
   Gradient — the workhorse for every silhouette layer
   ========================================================================== */

const GradientMaterial = shaderMaterial(
  {
    uTop: new THREE.Color('#ffffff'),
    uBottom: new THREE.Color('#000000'),
    uY0: -10,
    uY1: 10,
    uOpacity: 1,
    uGrain: 0.012,
    uRim: 0,
    uRimColor: new THREE.Color('#ffffff'),
    uRimWidth: 0.06,
  },
  VERT,
  /* glsl */ `
    uniform vec3 uTop;
    uniform vec3 uBottom;
    uniform vec3 uRimColor;
    uniform float uY0;
    uniform float uY1;
    uniform float uOpacity;
    uniform float uGrain;
    uniform float uRim;
    uniform float uRimWidth;

    varying vec2 vUv;
    varying vec3 vWorldPos;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      float t = clamp((vWorldPos.y - uY0) / max(uY1 - uY0, 0.0001), 0.0, 1.0);
      t = t * t * (3.0 - 2.0 * t);
      vec3 col = mix(uBottom, uTop, t);

      // A lit top edge sells the "sun is behind the ridge" read.
      if (uRim > 0.0) {
        float edge = smoothstep(1.0 - uRimWidth, 1.0, t);
        col = mix(col, uRimColor, edge * uRim);
      }

      // Fine dither keeps wide gradients from banding on 8-bit displays.
      col += (hash21(gl_FragCoord.xy) - 0.5) * uGrain;

      gl_FragColor = vec4(col, uOpacity);
      #include <colorspace_fragment>
    }
  `,
)

/* ==========================================================================
   Sky — five-stop dusk ramp, sun bloom, drifting cloud banks
   ========================================================================== */

const SkyMaterial = shaderMaterial(
  {
    uC1: new THREE.Color('#f9c9c4'),
    uC2: new THREE.Color('#f2a9be'),
    uC3: new THREE.Color('#d68cbb'),
    uC4: new THREE.Color('#9b6fa8'),
    uC5: new THREE.Color('#6b4c86'),
    uSun: new THREE.Vector2(0.62, 0.72),
    uSunColor: new THREE.Color('#ffe6d2'),
    uSunStrength: 0.55,
    uCloud: 0.34,
    uTime: 0,
  },
  VERT,
  /* glsl */ `
    uniform vec3 uC1, uC2, uC3, uC4, uC5, uSunColor;
    uniform vec2 uSun;
    uniform float uSunStrength;
    uniform float uCloud;
    uniform float uTime;

    varying vec2 vUv;

    ${NOISE}

    void main() {
      float t = vUv.y;

      // Ramp runs bottom (deep purple) to top (warm peach).
      vec3 col = mix(uC5, uC4, smoothstep(0.00, 0.30, t));
      col = mix(col, uC3, smoothstep(0.24, 0.55, t));
      col = mix(col, uC2, smoothstep(0.50, 0.80, t));
      col = mix(col, uC1, smoothstep(0.76, 1.00, t));

      // Sun glow low on the horizon, behind the mountains.
      float d = distance(vUv * vec2(1.7, 1.0), uSun * vec2(1.7, 1.0));
      col += uSunColor * uSunStrength * exp(-d * 3.4) * 0.9;
      col += uSunColor * uSunStrength * exp(-d * 9.0) * 0.55;

      // Soft cloud banks, stretched horizontally and drifting slowly.
      vec2 cp = vec2(vUv.x * 2.6 + uTime * 0.012, vUv.y * 5.2);
      float clouds = fbm(cp);
      clouds = smoothstep(0.46, 0.86, clouds);
      float cloudBand = smoothstep(0.30, 0.62, vUv.y) * (1.0 - smoothstep(0.78, 1.0, vUv.y));
      col = mix(col, col + vec3(0.10, 0.05, 0.06), clouds * cloudBand * uCloud);

      col += (hash21(gl_FragCoord.xy) - 0.5) * 0.014;

      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }
  `,
)

/* ==========================================================================
   Glow — additive radial falloff for lanterns, fires and candle halos
   ========================================================================== */

const GlowMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#ffb547'),
    uIntensity: 1,
    uFalloff: 2.6,
    uCore: 0.12,
    uTime: 0,
    uFlicker: 0,
  },
  VERT,
  /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uFalloff;
    uniform float uCore;
    uniform float uTime;
    uniform float uFlicker;

    varying vec2 vUv;

    void main() {
      float d = distance(vUv, vec2(0.5)) * 2.0;
      float halo = pow(clamp(1.0 - d, 0.0, 1.0), uFalloff);
      float core = smoothstep(uCore + 0.16, uCore, d);

      // Candle-flame wobble: two detuned sines never repeat visibly.
      float flick = 1.0 + uFlicker * (sin(uTime * 7.3) * 0.5 + sin(uTime * 11.7) * 0.5) * 0.5;

      float a = clamp((halo + core * 0.85) * uIntensity * flick, 0.0, 1.0);
      gl_FragColor = vec4(uColor * (0.6 + core * 0.9), a);
      #include <colorspace_fragment>
    }
  `,
)

/* ==========================================================================
   Water — mirrored dusk with slow horizontal ripple bands
   ========================================================================== */

const WaterMaterial = shaderMaterial(
  {
    uTop: new THREE.Color('#c98fb8'),
    uBottom: new THREE.Color('#4b2f63'),
    uHighlight: new THREE.Color('#ffd2c8'),
    uTime: 0,
    uOpacity: 1,
  },
  VERT,
  /* glsl */ `
    uniform vec3 uTop;
    uniform vec3 uBottom;
    uniform vec3 uHighlight;
    uniform float uTime;
    uniform float uOpacity;

    varying vec2 vUv;

    ${NOISE}

    void main() {
      vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));

      // Broken ripple lines. The noise term is what keeps these from reading
      // as CRT scanlines: each band wanders and breaks up along its length.
      float warp = fbm(vUv * vec2(3.2, 9.0) + uTime * 0.03) * 5.0;
      float bands = sin(vUv.y * 30.0 - uTime * 0.4 + warp);
      bands = smoothstep(0.82, 1.0, bands);
      bands *= smoothstep(0.25, 0.75, fbm(vUv * vec2(5.0, 2.0) - uTime * 0.02));
      float depth = smoothstep(0.0, 0.7, vUv.y);
      col = mix(col, uHighlight, bands * depth * 0.3);

      gl_FragColor = vec4(col, uOpacity);
      #include <colorspace_fragment>
    }
  `,
)

/* ==========================================================================
   Drifting particles — sakura petals and fireflies, one GPU pass
   ========================================================================== */

const DriftMaterial = shaderMaterial(
  {
    uColorA: new THREE.Color('#ffd9e2'),
    uColorB: new THREE.Color('#ffffff'),
    uTime: 0,
    uSize: 26,
    uOpacity: 0.85,
    uArea: new THREE.Vector3(120, 60, 40),
    uFallSpeed: 1.0,
    uSwayAmount: 1.0,
    uSoftness: 1.0,
    uPixelRatio: 1,
  },
  /* glsl */ `
    uniform float uTime;
    uniform float uSize;
    uniform vec3 uArea;
    uniform float uFallSpeed;
    uniform float uSwayAmount;
    uniform float uPixelRatio;

    attribute float aSeed;
    attribute float aScale;

    varying float vSeed;
    varying float vFade;

    void main() {
      vSeed = aSeed;

      vec3 p = position;
      float t = uTime * uFallSpeed * (0.4 + aSeed * 0.9);

      // Wrap vertically so the field never empties.
      p.y = mod(p.y - t, uArea.y) - uArea.y * 0.5;

      // Two detuned sways per axis read as air resistance, not a sine wave.
      p.x += sin(t * 0.7 + aSeed * 34.0) * uSwayAmount * (0.6 + aSeed);
      p.x += sin(t * 1.9 + aSeed * 11.0) * uSwayAmount * 0.35;
      p.z += cos(t * 0.9 + aSeed * 21.0) * uSwayAmount * 0.5;

      vec4 mv = modelViewMatrix * vec4(p, 1.0);

      // Fade at the top and bottom edges of the band so nothing pops.
      float edge = 1.0 - smoothstep(uArea.y * 0.32, uArea.y * 0.5, abs(p.y));
      vFade = edge;

      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * aScale * uPixelRatio * (14.0 / max(-mv.z, 1.0));
    }
  `,
  /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uOpacity;
    uniform float uSoftness;

    varying float vSeed;
    varying float vFade;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv) * 2.0;
      float a = pow(clamp(1.0 - d, 0.0, 1.0), uSoftness * 2.2);
      if (a < 0.01) discard;

      vec3 col = mix(uColorA, uColorB, vSeed);
      gl_FragColor = vec4(col, a * uOpacity * vFade);
      #include <colorspace_fragment>
    }
  `,
)

/* ==========================================================================
   Vertical veil — the atmospheric haze that separates depth layers
   ========================================================================== */

const HazeMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#d68cbb'),
    uOpacity: 0.5,
    uPower: 1.6,
    uFlip: 0,
  },
  VERT,
  /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uPower;
    uniform float uFlip;

    varying vec2 vUv;

    void main() {
      float t = uFlip > 0.5 ? vUv.y : 1.0 - vUv.y;
      float a = pow(clamp(t, 0.0, 1.0), uPower) * uOpacity;
      gl_FragColor = vec4(uColor, a);
      #include <colorspace_fragment>
    }
  `,
)

extend({
  GradientMaterial,
  SkyMaterial,
  GlowMaterial,
  WaterMaterial,
  DriftMaterial,
  HazeMaterial,
})

export { GradientMaterial, SkyMaterial, GlowMaterial, WaterMaterial, DriftMaterial, HazeMaterial }
