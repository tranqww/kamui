/**
 * Card artwork, drawn to an offscreen canvas and uploaded as a texture.
 *
 * The alternative was shipping bitmaps. Drawing the deck in code keeps the
 * whole site under a few hundred KB, lets a card's palette be a parameter
 * instead of a re-export, and means the art is as crisp as the device asks
 * for. Everything here is deterministic: same inputs, same pixels.
 */

export const CARD_W = 560
export const CARD_H = 812

const TAU = Math.PI * 2

/* ==========================================================================
   Small drawing helpers
   ========================================================================== */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Rectangle with the corners cut off — the deck's structural motif. */
function clippedRect(ctx, x, y, w, h, c) {
  ctx.beginPath()
  ctx.moveTo(x + c, y)
  ctx.lineTo(x + w - c, y)
  ctx.lineTo(x + w, y + c)
  ctx.lineTo(x + w, y + h - c)
  ctx.lineTo(x + w - c, y + h)
  ctx.lineTo(x + c, y + h)
  ctx.lineTo(x, y + h - c)
  ctx.lineTo(x, y + c)
  ctx.closePath()
}

function poly(ctx, points) {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

function linear(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}

function radial(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}

/** Greedy word wrap. Returns the y the caller should continue from. */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'center') {
  const words = text.split(' ')
  const lines = []
  let line = ''

  words.forEach((word) => {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = attempt
    }
  })
  if (line) lines.push(line)

  ctx.textAlign = align
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight))
  return y + lines.length * lineHeight
}

/* ==========================================================================
   Ornaments
   ========================================================================== */

/**
 * Repeating ornament is drawn once into a tile and stamped with a pattern
 * fill.
 *
 * Drawing these cell by cell into the full card cost several hundred Canvas2D
 * calls per texture, all of it synchronous on the main thread at the exact
 * moment the deck scrolls into view. One tile plus one fillRect is visually
 * identical and roughly two orders of magnitude fewer calls.
 */
function tiled(ctx, x, y, w, h, tileW, tileH, alpha, drawTile) {
  const tile = document.createElement('canvas')
  tile.width = Math.max(1, Math.ceil(tileW))
  tile.height = Math.max(1, Math.ceil(tileH))
  drawTile(tile.getContext('2d'), tile.width, tile.height)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = ctx.createPattern(tile, 'repeat')
  ctx.translate(x, y)
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

/** Quilted diamond lattice used on the card back. */
function diamondQuilt(ctx, x, y, w, h, step, stroke, alpha) {
  tiled(ctx, x, y, w, h, step, step, alpha, (t, tw, th) => {
    t.strokeStyle = stroke
    t.lineWidth = 1.5
    // Both diagonals of the cell, drawn past the edges so the seams close.
    t.beginPath()
    t.moveTo(-tw, 0)
    t.lineTo(tw * 2, th * 3)
    t.moveTo(-tw, th)
    t.lineTo(tw * 2, -th * 2)
    t.moveTo(-tw, th * 2)
    t.lineTo(tw * 2, -th)
    t.stroke()
  })
}

/** Honeycomb band — the reference's lower-panel texture. */
function honeycomb(ctx, x, y, w, h, r, fill, alpha) {
  const dx = r * 1.74
  const dy = r * 3
  tiled(ctx, x, y, w, h, dx, dy, alpha, (t) => {
    t.fillStyle = fill
    // Two rows per tile: the offset row is what makes the lattice interlock.
    const hexes = [
      [dx / 2, 0],
      [dx / 2, dy],
      [0, dy / 2],
      [dx, dy / 2],
    ]
    hexes.forEach(([cx, cy]) => {
      t.beginPath()
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        const px = cx + Math.cos(a) * r * 0.82
        const py = cy + Math.sin(a) * r * 0.82
        if (i) t.lineTo(px, py)
        else t.moveTo(px, py)
      }
      t.closePath()
      t.fill()
    })
  })
}

/** Seigaiha — the overlapping-wave pattern, used on section backdrops. */
export function drawSeigaiha(ctx, w, h, r, stroke, alpha) {
  const dy = r * 0.62
  tiled(ctx, 0, 0, w, h, r, dy * 2, alpha, (t) => {
    t.strokeStyle = stroke
    t.lineWidth = 2
    const fans = [
      [0, 0],
      [r, 0],
      [r / 2, dy],
      [0, dy * 2],
      [r, dy * 2],
    ]
    fans.forEach(([cx, cy]) => {
      for (let k = 1; k <= 3; k += 1) {
        t.beginPath()
        t.arc(cx, cy, (r / 2) * (k / 3), Math.PI, TAU)
        t.stroke()
      }
    })
  })
}

/** A cut gem: hexagon, facets, highlight. */
function gem(ctx, cx, cy, rw, rh, hot, cool) {
  const points = [
    [cx, cy - rh],
    [cx + rw, cy - rh * 0.45],
    [cx + rw, cy + rh * 0.45],
    [cx, cy + rh],
    [cx - rw, cy + rh * 0.45],
    [cx - rw, cy - rh * 0.45],
  ]

  poly(ctx, points)
  ctx.fillStyle = linear(ctx, cx - rw, cy - rh, cx + rw, cy + rh, [
    [0, hot],
    [0.5, cool],
    [1, '#7a1f3a'],
  ])
  ctx.fill()

  // Facet split down the middle plus a lit left plane
  poly(ctx, [points[0], points[5], points[4], points[3]])
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,220,190,0.45)'
  ctx.lineWidth = 2
  poly(ctx, points)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx, cy - rh)
  ctx.lineTo(cx, cy + rh)
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'
  ctx.stroke()
}

/** One blade of the crossed pair on the card back. */
function blade(ctx, cx, cy, len, angle, edge, spine) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  // Blade
  poly(ctx, [
    [-len, -9],
    [len * 0.72, -13],
    [len, 0],
    [len * 0.72, 13],
    [-len, 9],
  ])
  ctx.fillStyle = linear(ctx, 0, -13, 0, 13, [
    [0, edge],
    [0.5, spine],
    [1, '#3d2a5c'],
  ])
  ctx.fill()

  // Grip and pommel at the near end
  roundRect(ctx, -len - 62, -8, 62, 16, 6)
  ctx.fillStyle = '#8f4a63'
  ctx.fill()

  roundRect(ctx, -len - 10, -20, 12, 40, 5)
  ctx.fillStyle = '#c98a4e'
  ctx.fill()

  ctx.restore()
}

/* ==========================================================================
   Card back
   ========================================================================== */

export function drawCardBack(ctx, w = CARD_W, h = CARD_H) {
  ctx.clearRect(0, 0, w, h)

  // Body
  roundRect(ctx, 0, 0, w, h, 18)
  ctx.fillStyle = linear(ctx, 0, 0, w, h, [
    [0, '#6b4b8e'],
    [0.5, '#553a75'],
    [1, '#3a2557'],
  ])
  ctx.fill()

  // Outer bevel
  roundRect(ctx, 8, 8, w - 16, h - 16, 12)
  ctx.strokeStyle = 'rgba(190,160,220,0.5)'
  ctx.lineWidth = 3
  ctx.stroke()

  // Inner panel
  const pad = 34
  clippedRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 46)
  ctx.fillStyle = linear(ctx, 0, pad, 0, h - pad, [
    [0, '#5a3d7d'],
    [1, '#3b2559'],
  ])
  ctx.fill()
  ctx.strokeStyle = 'rgba(158,124,196,0.55)'
  ctx.lineWidth = 2
  ctx.stroke()

  diamondQuilt(ctx, pad, pad, w - pad * 2, h - pad * 2, 62, '#8f6fbb', 0.28)
  honeycomb(ctx, pad + 40, h * 0.62, w - pad * 2 - 80, h * 0.28, 17, '#7a5aa6', 0.3)

  // Corner gems
  const cs = 52
  const corners = [
    [pad, pad, 1, 1],
    [w - pad, pad, -1, 1],
    [w - pad, h - pad, -1, -1],
    [pad, h - pad, 1, -1],
  ]
  corners.forEach(([cx, cy, sx, sy]) => {
    poly(ctx, [
      [cx, cy],
      [cx + cs * sx, cy],
      [cx, cy + cs * sy],
    ])
    ctx.fillStyle = linear(ctx, cx, cy, cx + cs * sx, cy + cs * sy, [
      [0, '#ffb26b'],
      [1, '#d94f56'],
    ])
    ctx.fill()
  })

  // Crossed blades
  blade(ctx, w / 2, h * 0.46, 232, -0.6, '#d8ccef', '#a48fd0')
  blade(ctx, w / 2, h * 0.46, 232, 0.6 + Math.PI, '#d8ccef', '#a48fd0')

  // Central shield behind the gem
  poly(ctx, [
    [w / 2, h * 0.27],
    [w / 2 + 118, h * 0.35],
    [w / 2 + 118, h * 0.51],
    [w / 2, h * 0.63],
    [w / 2 - 118, h * 0.51],
    [w / 2 - 118, h * 0.35],
  ])
  ctx.fillStyle = linear(ctx, 0, h * 0.3, 0, h * 0.6, [
    [0, '#7a5ba6'],
    [1, '#432d66'],
  ])
  ctx.fill()
  ctx.strokeStyle = 'rgba(206,180,238,0.6)'
  ctx.lineWidth = 3
  ctx.stroke()

  gem(ctx, w / 2, h * 0.44, 62, 84, '#ffd08a', '#e2504f')

  // Fangs below the shield
  ;[-52, -18, 18, 52].forEach((dx, i) => {
    const len = i === 1 || i === 2 ? 64 : 44
    poly(ctx, [
      [w / 2 + dx - 10, h * 0.57],
      [w / 2 + dx + 10, h * 0.57],
      [w / 2 + dx, h * 0.57 + len],
    ])
    ctx.fillStyle = '#cbb6e6'
    ctx.fill()
  })

  // Side clasps
  ;[pad - 12, w - pad - 26].forEach((x) => {
    roundRect(ctx, x, h * 0.42, 38, 90, 8)
    ctx.fillStyle = linear(ctx, x, 0, x + 38, 0, [
      [0, '#8f6fbb'],
      [1, '#5a3d7d'],
    ])
    ctx.fill()
  })
}

/* ==========================================================================
   Card front
   ========================================================================== */

const VARIANTS = [
  { hot: '#ff6f93', cool: '#8e3f6d', moon: '#2f6f8f', sky: '#241a44' },
  { hot: '#ffb04a', cool: '#a04a3f', moon: '#2f7f6c', sky: '#1e1a3e' },
  { hot: '#7ad0ff', cool: '#3f5aa0', moon: '#6b3f8f', sky: '#1a1a3c' },
]

/** Horned mask with a raised blade — the creature slot on every front. */
function oni(ctx, cx, cy, s, hot, cool) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(s, s)

  // Blade held across the body
  ctx.save()
  ctx.rotate(-0.42)
  poly(ctx, [
    [-14, -300],
    [14, -300],
    [22, 30],
    [-6, 44],
  ])
  ctx.fillStyle = linear(ctx, -20, -300, 20, 40, [
    [0, '#e8e0ff'],
    [1, '#7c6fae'],
  ])
  ctx.fill()
  roundRect(ctx, -16, 30, 32, 96, 8)
  ctx.fillStyle = '#4a3a6b'
  ctx.fill()
  ctx.restore()

  // Shoulders
  poly(ctx, [
    [-150, 210],
    [-96, 40],
    [96, 40],
    [150, 210],
  ])
  ctx.fillStyle = linear(ctx, 0, 40, 0, 210, [
    [0, cool],
    [1, '#2a1740'],
  ])
  ctx.fill()

  // Head
  poly(ctx, [
    [-84, -10],
    [-72, -120],
    [0, -156],
    [72, -120],
    [84, -10],
    [0, 62],
  ])
  ctx.fillStyle = linear(ctx, 0, -156, 0, 62, [
    [0, hot],
    [1, cool],
  ])
  ctx.fill()

  // Horns
  poly(ctx, [
    [-72, -116],
    [-128, -238],
    [-96, -228],
    [-44, -140],
  ])
  ctx.fillStyle = '#f2e6d8'
  ctx.fill()
  poly(ctx, [
    [72, -116],
    [128, -238],
    [96, -228],
    [44, -140],
  ])
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#fff3c4'
  poly(ctx, [
    [-58, -66],
    [-16, -50],
    [-18, -28],
    [-58, -40],
  ])
  ctx.fill()
  poly(ctx, [
    [58, -66],
    [16, -50],
    [18, -28],
    [58, -40],
  ])
  ctx.fill()

  // Grin
  ctx.fillStyle = '#1a0e26'
  poly(ctx, [
    [-46, 4],
    [46, 4],
    [30, 34],
    [-30, 34],
  ])
  ctx.fill()
  ctx.fillStyle = '#f2e6d8'
  for (let i = -3; i <= 3; i += 1) {
    poly(ctx, [
      [i * 13 - 5, 4],
      [i * 13 + 5, 4],
      [i * 13, 22],
    ])
    ctx.fill()
  }

  ctx.restore()
}

export function drawCardFront(ctx, card, w = CARD_W, h = CARD_H) {
  const v = VARIANTS[card.variant % VARIANTS.length]
  ctx.clearRect(0, 0, w, h)

  // Body and frame
  roundRect(ctx, 0, 0, w, h, 18)
  ctx.fillStyle = linear(ctx, 0, 0, w, h, [
    [0, '#7a5ba6'],
    [1, '#4a2f6e'],
  ])
  ctx.fill()

  const pad = 26
  clippedRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 40)
  ctx.fillStyle = '#3a2459'
  ctx.fill()
  ctx.strokeStyle = 'rgba(206,180,238,0.6)'
  ctx.lineWidth = 3
  ctx.stroke()

  // Rank plate
  const rankW = 150
  clippedRect(ctx, (w - rankW) / 2, pad + 10, rankW, 44, 14)
  ctx.fillStyle = '#241539'
  ctx.fill()
  ctx.strokeStyle = 'rgba(206,180,238,0.5)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#e5d6f2'
  ctx.font = '600 26px "Share Tech Mono", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(card.code, w / 2, pad + 34)

  // Art window
  const ax = pad + 30
  const ay = pad + 76
  const aw = w - (pad + 30) * 2
  const ah = h * 0.5
  ctx.save()
  clippedRect(ctx, ax, ay, aw, ah, 26)
  ctx.clip()

  ctx.fillStyle = linear(ctx, 0, ay, 0, ay + ah, [
    [0, v.sky],
    [1, '#120b22'],
  ])
  ctx.fillRect(ax, ay, aw, ah)

  // Moon
  ctx.beginPath()
  ctx.arc(ax + aw * 0.62, ay + ah * 0.3, aw * 0.2, 0, TAU)
  ctx.fillStyle = radial(ctx, ax + aw * 0.62, ay + ah * 0.3, 0, aw * 0.2, [
    [0, v.moon],
    [1, 'rgba(20,12,34,0)'],
  ])
  ctx.fill()

  // Ridgeline, so the figure has a horizon to stand against
  const hy = ay + ah * 0.62
  poly(ctx, [
    [ax, hy + 26],
    [ax + aw * 0.16, hy - 6],
    [ax + aw * 0.34, hy + 16],
    [ax + aw * 0.52, hy - 18],
    [ax + aw * 0.72, hy + 10],
    [ax + aw * 0.88, hy - 8],
    [ax + aw, hy + 20],
    [ax + aw, ay + ah],
    [ax, ay + ah],
  ])
  ctx.fillStyle = 'rgba(28,18,52,0.9)'
  ctx.fill()

  // Ground plane the mask actually stands on
  ctx.fillStyle = linear(ctx, 0, ay + ah * 0.8, 0, ay + ah, [
    [0, '#231640'],
    [1, '#100a22'],
  ])
  ctx.fillRect(ax, ay + ah * 0.8, aw, ah * 0.2)

  // Single key light, low and to the left — the same lantern logic every
  // other scene on the site uses.
  ctx.fillStyle = radial(ctx, ax + aw * 0.2, ay + ah * 0.86, 0, aw * 0.62, [
    [0, 'rgba(255,168,72,0.66)'],
    [0.5, 'rgba(255,124,60,0.2)'],
    [1, 'rgba(255,168,72,0)'],
  ])
  ctx.fillRect(ax, ay, aw, ah)

  oni(ctx, ax + aw * 0.52, ay + ah * 0.84, aw / 620, v.hot, v.cool)

  // Mist pooling at the figure's feet, tying it to the ground
  ctx.fillStyle = radial(ctx, ax + aw * 0.52, ay + ah * 0.88, 0, aw * 0.44, [
    [0, 'rgba(120,96,180,0.34)'],
    [1, 'rgba(120,96,180,0)'],
  ])
  ctx.fillRect(ax, ay + ah * 0.6, aw, ah * 0.4)
  ctx.restore()

  ctx.strokeStyle = 'rgba(226,206,248,0.55)'
  ctx.lineWidth = 3
  clippedRect(ctx, ax, ay, aw, ah, 26)
  ctx.stroke()

  // Corner gems on the frame
  const cs = 44
  ;[
    [pad, pad, 1, 1],
    [w - pad, pad, -1, 1],
    [w - pad, h - pad, -1, -1],
    [pad, h - pad, 1, -1],
  ].forEach(([cx, cy, sx, sy]) => {
    poly(ctx, [
      [cx, cy],
      [cx + cs * sx, cy],
      [cx, cy + cs * sy],
    ])
    ctx.fillStyle = linear(ctx, cx, cy, cx + cs * sx, cy + cs * sy, [
      [0, '#ffb26b'],
      [1, '#d94f56'],
    ])
    ctx.fill()
  })

  // Text plate
  const ty = ay + ah + 26
  const th = h - ty - pad - 22
  clippedRect(ctx, ax, ty, aw, th, 22)
  ctx.fillStyle = linear(ctx, 0, ty, 0, ty + th, [
    [0, '#6f52a0'],
    [1, '#4a3273'],
  ])
  ctx.fill()
  ctx.strokeStyle = 'rgba(226,206,248,0.5)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#fbf3ef'
  ctx.font = '700 40px Cinzel, Georgia, serif'
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'
  ctx.fillText(card.title.toUpperCase(), w / 2, ty + 54)

  // Rule under the title
  ctx.beginPath()
  ctx.moveTo(ax + 46, ty + 72)
  ctx.lineTo(ax + aw - 46, ty + 72)
  ctx.strokeStyle = 'rgba(251,243,239,0.32)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = 'rgba(251,243,239,0.82)'
  ctx.font = '400 21px Jost, system-ui, sans-serif'
  wrapText(ctx, card.body, w / 2, ty + 104, aw - 76, 28)
}

/* ==========================================================================
   Texture factory
   ========================================================================== */

/** Renders `draw` into a fresh canvas and hands it back for CanvasTexture. */
export function makeCanvas(draw, w = CARD_W, h = CARD_H) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  draw(ctx, w, h)
  return canvas
}
