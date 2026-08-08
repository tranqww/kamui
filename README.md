# KAMUI

A landing page for a blockchain card game set in a mythologised feudal Japan — rebuilt as a real-time WebGL experience.

**Live:** https://tranqww.github.io/kamui/

Every scene on the page is a three.js render: a dusk valley with a hilltop shrine, a candlelit room, a deck of cards that turns in real 3D space, and a fox spirit inside a carved frame. There are no images in this repository. The artwork is generated in code.

---

## The reference

The design is a faithful rebuild of the **KAMUI** concept by [Zak Steele-Eklund](https://dribbble.com/shots/11180781-K-A-M-U-I) for Studio VØR — a Dribbble concept, never shipped as a live site. This project reconstructs its layout, typography, palette and motion from the animation, and is not affiliated with the original.

The original's illustrations are the designer's own work and are not public, so **none of them are reproduced here.** Every visual in this repo — mountains, shrine, bridge, herons, figures, card faces — is generated from scratch.

## How the art is made

There are no textures, no models, no stock photography. Two techniques carry the whole page:

**Generated silhouettes.** Mountains, treelines, boulders, reeds and roofs come out of `src/lib/shapes.js` as `THREE.Shape` paths — seeded noise for the ranges, hand-tuned Bézier curves for anything that has to read as a specific object. Each is filled with an unlit vertical-gradient shader (`src/lib/materials.jsx`) and placed at a real Z depth. Real positions give honest parallax; flat fills keep the painted look.

**Canvas-drawn card art.** The deck in `src/lib/cardArt.js` is drawn with the Canvas 2D API and uploaded as a texture — quilted diamonds, honeycomb, crossed blades, a cut gem, and a horned mask on every face. A card's palette is a parameter, not a re-export.

The trade is deliberate: the entire site is a few hundred KB, the art is resolution-independent, and there is no licence ambiguity anywhere in the bundle.

## Stack

| | |
|---|---|
| Build | Vite 6 |
| UI | React 19 |
| 3D | three.js, @react-three/fiber, @react-three/drei |
| Post | @react-three/postprocessing — bloom, vignette, grain |
| Scroll | Lenis |
| Type | Cinzel · Jost · Share Tech Mono |

## Structure

```
src/
├─ lib/
│  ├─ shapes.js        generated silhouettes (THREE.Shape builders)
│  ├─ materials.jsx    unlit shaders: gradient, sky, glow, water, drift, haze
│  ├─ cardArt.js       Canvas 2D deck artwork
│  ├─ rng.js           seeded PRNG, value noise, fbm, frame-rate-independent damping
│  └─ pointer.js       one shared pointer listener for every canvas
├─ components/three/
│  ├─ Stage.jsx        per-section canvas; parks its render loop when off-screen
│  ├─ Primitives.jsx   Silhouette, Glow, Haze, Drift, LightShafts, rigs
│  └─ Effects.jsx      post-processing chain
└─ sections/
   ├─ Hero/            dusk valley, shrine, arched bridge, sakura
   ├─ Strategic/       candlelit room, backlit swordswoman
   ├─ Cards/           three-card carousel, real 3D flip
   └─ Yokai/           night grove, fox spirit in a carved frame
```

## Performance

Four WebGL scenes on one page is a real cost, so:

- **Each canvas parks, then leaves.** `Stage` watches its own section on two rings. The inner one sets `frameloop="never"` as the section passes out of view (and whenever the tab is hidden), so at most one scene is drawing. The outer one unmounts the canvas entirely once the section is more than 1.5 viewports away, after a 4-second dwell. Parking stops CPU work but never returns the context's render targets, and four bloom composers' worth of full-resolution half-float buffers is real VRAM to be holding for scenes nobody can see.
- **Device tiering.** Low-core and small coarse-pointer devices drop DPR to 1, skip post-processing entirely, and cut particle counts by roughly two-thirds. Bloom drops from 7 mip levels to 5 below the top tier.
- **Repeated geometry is merged.** Tree trunks, stair treads, bridge posts, shrine balusters and wall slats are one shape stamped many times and never animated individually, so they are baked into a single geometry each — roughly 60 draw calls saved across the page.
- **Particles are one draw call.** Sakura, embers and fireflies are a single `Points` buffer each, animated entirely in the vertex shader.
- **Gradients ramp in object space.** A world-space ramp slides through its own shape whenever an ancestor group moves — which is exactly what the scroll rig and the portrait reframing do every frame.
- **Time comes from an accumulator, not the clock.** R3F zeroes `clock.elapsedTime` every time `frameloop` flips, which here is every scroll in and out of a section. Reading it would teleport every particle field on re-entry.

three.js is ~179 KB gzipped and dominates the bundle; the rest of the site is about 50 KB gzipped.

## Accessibility

- `prefers-reduced-motion` disables Lenis, freezes parallax and float, stops carousel autoplay, and resolves the card flip instantly rather than animating it.
- The card carousel is fully operable from the keyboard (arrow keys, focusable controls) and its content is mirrored into an `aria-live` region, so the deck is readable even though it is rendered in WebGL.
- Canvases are `aria-hidden`; nothing meaningful lives only in a shader.
- Skip link, visible focus rings, labelled controls, and text that survives with JavaScript disabled.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/kamui/
npm run build
npm run preview
```

The Vite `base` is `/kamui/` to match GitHub Pages. Override with `VITE_BASE=/ npm run build` for a root deploy.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.

## A note on the form

The waitlist form has no backend. It validates the address, then tells you plainly that nothing was sent. It is a concept build, and a fake confirmation is still a lie.

## Licence

Source code: MIT. The KAMUI name and the original concept design belong to their author.
