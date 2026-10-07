// Generates the "2001: A Space Odyssey" centrifuge-corridor background used by the theme
// plugin, plus a rasterized PNG preview so the composition can be eyeballed without a browser.
//
//   node gen-corridor.mjs
//
// Outputs: corridor.svg, preview.png, corridor.b64.txt
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))

const W = 1920
const H = 1080
const CX = 960
const CY = 500          // vanishing point
const NEAR_HW = 2450    // half width of the nearest rib (overshoots the canvas on purpose)
const NEAR_HH = 1420
const RINGS = 26
const STEP = 0.62       // depth increment between ribs -> true 1/depth perspective
const FLOOR_LINE = 0.24 // fraction of the cross-section below the axis that reads as floor
const ROUND = 0.34      // 0 = square cross-section, 1 = circular
const FIGURE_K = 5      // rib index the walking figure stands at

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

const scaleOf = (k) => 1 / (1 + k * STEP)
const ringGeom = (k) => {
  const s = scaleOf(k)
  return { s, hw: s * NEAR_HW, hh: s * NEAR_HH }
}

// Far ribs fade into the haze; the tunnel mouth stays the brightest thing in frame.
const dim = (k) => 0.34 + 0.66 * Math.pow(scaleOf(k), 0.55)

const wallA = hex('#eef3f9')
const wallB = hex('#d5dde8')
const ceilA = hex('#c2cbd8')
const floorA = hex('#aab5c3')
const floorB = hex('#98a4b3')
const seam = hex('#39434f')

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
const hexOf = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

function bandColors (k) {
  const even = k % 2 === 0
  const f = dim(k)
  return {
    wall: mix([9, 13, 20], even ? wallA : wallB, f),
    ceil: mix([9, 13, 20], ceilA, f),
    floor: mix([9, 13, 20], even ? floorA : floorB, f * 0.96),
    seam: mix([9, 13, 20], seam, 0.25 + 0.75 * f),
  }
}

// ---------------------------------------------------------------------------
// SVG
// ---------------------------------------------------------------------------
function buildSvg () {
  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">`)
  parts.push(`<defs>
    <radialGradient id="mouth" cx="50%" cy="46%" r="46%">
      <stop offset="0%" stop-color="#eaf4ff" stop-opacity="0.50"/>
      <stop offset="42%" stop-color="#9dc4ff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0a1526" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="haze" cx="50%" cy="46%" r="74%">
      <stop offset="0%" stop-color="#0a1220" stop-opacity="0"/>
      <stop offset="46%" stop-color="#070c15" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#03060b" stop-opacity="0.84"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="46%" r="80%">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="55%" stop-color="#000" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.90"/>
    </radialGradient>
    <linearGradient id="grade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b2a55" stop-opacity="0.34"/>
      <stop offset="52%" stop-color="#04101f" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#010409" stop-opacity="0.66"/>
    </linearGradient>
    <linearGradient id="lightBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="46%" stop-color="#f2f8ff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>`)
  parts.push(`<rect width="${W}" height="${H}" fill="#03060b"/>`)

  // Nearest rib first, each following rib painted on top: the visible band of a rib is the
  // strip between it and the next smaller one, which is exactly what a receding tunnel is.
  for (let k = 0; k < RINGS; k++) {
    const { hw, hh } = ringGeom(k)
    const c = bandColors(k)
    const x = CX - hw
    const y = CY - hh
    const r = Math.min(hw, hh) * ROUND
    const stroke = Math.max(0.8, hh * 0.006)
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(hw * 2).toFixed(1)}" height="${(hh * 2).toFixed(1)}" rx="${r.toFixed(1)}" fill="${hexOf(c.wall)}"/>`)
    // ceiling band
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(hw * 2).toFixed(1)}" height="${(hh * 0.30).toFixed(1)}" rx="${(r * 0.8).toFixed(1)}" fill="${hexOf(c.ceil)}"/>`)
    // floor band
    const fy = CY + hh * FLOOR_LINE
    parts.push(`<rect x="${x.toFixed(1)}" y="${fy.toFixed(1)}" width="${(hw * 2).toFixed(1)}" height="${(hh * (1 - FLOOR_LINE)).toFixed(1)}" rx="${(r * 0.7).toFixed(1)}" fill="${hexOf(c.floor)}"/>`)
    // floor centre seam
    parts.push(`<rect x="${(CX - hw * 0.010).toFixed(1)}" y="${fy.toFixed(1)}" width="${(hw * 0.020).toFixed(1)}" height="${(hh * (1 - FLOOR_LINE)).toFixed(1)}" fill="${hexOf(c.seam)}" opacity="0.55"/>`)
    // rib seam
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(hw * 2).toFixed(1)}" height="${(hh * 2).toFixed(1)}" rx="${r.toFixed(1)}" fill="none" stroke="${hexOf(c.seam)}" stroke-opacity="${(0.35 + 0.5 * dim(k)).toFixed(3)}" stroke-width="${stroke.toFixed(1)}"/>`)
    // wall panel seams: the ribbed padding of the centrifuge ring
    for (const off of [-0.42, 0.14]) {
      const ly = CY + hh * off
      parts.push(`<rect x="${x.toFixed(1)}" y="${ly.toFixed(1)}" width="${(hw * 2).toFixed(1)}" height="${Math.max(0.8, hh * 0.009).toFixed(1)}" fill="${hexOf(c.seam)}" opacity="${(0.18 + 0.26 * dim(k)).toFixed(3)}"/>`)
    }
    // ceiling light strip
    const lw = hw * 0.46
    const lh = Math.max(1.6, hh * 0.022)
    parts.push(`<rect x="${(CX - lw / 2).toFixed(1)}" y="${(CY - hh * 0.94).toFixed(1)}" width="${lw.toFixed(1)}" height="${lh.toFixed(1)}" rx="${(lh / 2).toFixed(1)}" fill="url(#lightBar)" opacity="${(0.30 + 0.62 * dim(k)).toFixed(3)}"/>`)

    if (k === FIGURE_K) parts.push(figure(k))
  }

  parts.push(`<rect width="${W}" height="${H}" fill="url(#mouth)"/>`)
  parts.push(`<rect width="${W}" height="${H}" fill="url(#haze)"/>`)
  parts.push(`<rect width="${W}" height="${H}" fill="url(#grade)"/>`)
  parts.push(`<rect width="${W}" height="${H}" fill="#03060b" opacity="0.14"/>`)
  parts.push(`<rect width="${W}" height="${H}" fill="url(#vig)"/>`)
  parts.push('</svg>')
  return parts.join('\n')
}

// Geometry for the lone crew member walking away down the corridor. Shared by the SVG
// renderer and the rasterizer so the preview shows exactly what ships.
function figureShape (k) {
  const { hw, hh } = ringGeom(k)
  const floorY = CY + hh * 0.14
  const height = hh * 0.50
  const w = height * 0.27
  const cx = CX - hw * 0.14
  const top = floorY - height
  const y = (v) => top + v * height
  const x = (v) => cx + v * w
  return {
    cx,
    floorY,
    height,
    head: { cx: cx - w * 0.04, cy: y(0.105), r: height * 0.072 },
    // torso + legs as one silhouette outline, with a slight stride in the legs
    poly: [
      [x(-0.52), y(1.00)], [x(-0.40), y(0.44)], [x(-0.30), y(0.30)], [x(-0.20), y(0.19)],
      [x(0.20), y(0.19)], [x(0.30), y(0.30)], [x(0.40), y(0.44)], [x(0.52), y(1.00)],
      [x(0.18), y(1.00)], [x(0.07), y(0.58)], [x(-0.13), y(0.58)], [x(-0.20), y(1.00)],
    ],
  }
}

function figure (k) {
  const f = figureShape(k)
  const s = f.height / 100
  const d = f.poly.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ') + ' Z'
  const rim = Math.max(0.8, s * 1.5).toFixed(2)
  return `<g>
    <ellipse cx="${f.cx.toFixed(1)}" cy="${(f.floorY + f.height * 0.012).toFixed(1)}" rx="${(f.height * 0.17).toFixed(1)}" ry="${(f.height * 0.020).toFixed(1)}" fill="#05080c" opacity="0.45"/>
    <path d="${d}" fill="#04070b"/>
    <circle cx="${f.head.cx.toFixed(1)}" cy="${f.head.cy.toFixed(1)}" r="${f.head.r.toFixed(1)}" fill="#04070b"/>
    <path d="${d}" fill="none" stroke="#8fc0ff" stroke-opacity="0.40" stroke-width="${rim}"/>
    <circle cx="${(f.head.cx - f.head.r * 0.42).toFixed(1)}" cy="${(f.head.cy - f.head.r * 0.12).toFixed(1)}" r="${(f.head.r * 0.86).toFixed(1)}" fill="#8fc0ff" opacity="0.22"/>
  </g>`
}

function pointInPoly (poly, px, py) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// ---------------------------------------------------------------------------
// Rasterizer (inverse-mapped, 2x supersampled) -> PNG preview
// ---------------------------------------------------------------------------
function normalizedRadius (px, py) {
  const dx = Math.abs(px - CX) / NEAR_HW
  const dy = Math.abs(py - CY) / NEAR_HH
  return Math.max(dx, dy) * (1 - ROUND) + Math.hypot(dx, dy) * ROUND
}

function shade (px, py) {
  const d = normalizedRadius(px, py)
  if (d >= 1) return [0, 0, 0]
  const k = Math.min(RINGS - 1, Math.max(0, Math.floor((1 / d - 1) / STEP)))
  const { s } = ringGeom(k)
  const c = bandColors(k)
  const dx = (px - CX) / NEAR_HW
  const dy = (py - CY) / NEAR_HH
  let col
  if (dy > s * FLOOR_LINE) col = c.floor
  else if (dy < -s * 0.70) col = c.ceil
  else col = c.wall
  // ceiling light strip
  if (Math.abs(dx) < s * 0.23 && dy < -0.94 * s) col = mix(col, [242, 248, 255], 0.92 * dim(k))
  // rib seam near each band boundary
  const edge = (1 / d - 1) / STEP - k
  if (edge < 0.07) col = mix(col, c.seam, 0.55 * dim(k))
  // wall panel seams
  for (const off of [-0.42, 0.14]) {
    if (Math.abs(dy - s * off) < s * 0.014) col = mix(col, c.seam, 0.42 * dim(k))
  }
  // tunnel mouth glow
  const g = Math.max(0, 1 - d / 0.42)
  col = mix(col, [214, 234, 255], Math.pow(g, 1.5) * 0.5)
  // haze + vignette
  const r = Math.hypot(px - CX, py - CY) / Math.hypot(W / 2, H / 2)
  const haze = Math.min(1, Math.max(0, (r - 0.12) / 0.88))
  col = mix(col, [7, 12, 21], haze * 0.42)
  col = mix(col, [0, 0, 0], Math.pow(haze, 1.25) * 0.72)
  col = mix(col, [11, 42, 85], (1 - Math.min(1, py / H)) * 0.20)
  col = mix(col, [3, 6, 11], 0.14) // global exposure pull, matches the shipped SVG
  // the walking figure, standing inside rib FIGURE_K
  if (k >= FIGURE_K) {
    const f = figureShape(FIGURE_K)
    if (Math.hypot(px - f.head.cx, py - f.head.cy) <= f.head.r) return [4, 7, 11]
    if (px > f.cx - f.height * 0.20 && px < f.cx + f.height * 0.20 &&
        py > f.poly[3][1] && py < f.poly[0][1] && pointInPoly(f.poly, px, py)) {
      // rim light on the left edge of the silhouette
      const rim = px < f.cx - f.height * 0.10
      return rim ? mix([4, 7, 11], [143, 192, 255], 0.40) : [4, 7, 11]
    }
  }
  return col
}

function crc32 (buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function chunk (type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png (width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function render (ow, oh) {
  const ss = 2
  const buf = Buffer.alloc(ow * oh * 4)
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let r = 0, g = 0, b = 0
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const col = shade((x + (sx + 0.5) / ss) * W / ow, (y + (sy + 0.5) / ss) * H / oh)
          r += col[0]; g += col[1]; b += col[2]
        }
      }
      const n = ss * ss
      const i = (y * ow + x) * 4
      buf[i] = Math.round(r / n); buf[i + 1] = Math.round(g / n); buf[i + 2] = Math.round(b / n); buf[i + 3] = 255
    }
  }
  return png(ow, oh, buf)
}

const svg = buildSvg()
fs.writeFileSync(path.join(OUT, 'corridor.svg'), svg)
fs.writeFileSync(path.join(OUT, 'corridor.b64.txt'), Buffer.from(svg, 'utf8').toString('base64'))
const preview = render(960, 540)
fs.writeFileSync(path.join(OUT, 'preview.png'), preview)

// Simulate what the app actually shows: the plate composited under the stacked
// translucent surfaces the theme's --dsw-alias-bg-base produces, then a sample
// of the label colour on top. Used to pick the surface alpha.
function composite (layers, alpha, base) {
  const w = 960, h = 540
  const raw = zlib.inflateSync(buildIdat(preview))
  const out = pngBuffer(w, h)
  const pass = 1 - Math.pow(1 - alpha, layers)
  for (let y = 0; y < h; y++) {
    const rowStart = y * (w * 4 + 1) + 1
    for (let x = 0; x < w; x++) {
      const s = rowStart + x * 4
      const d = (y * w + x) * 4
      for (let c = 0; c < 3; c++) out[d + c] = Math.round(raw[s + c] * (1 - pass) + base[c] * pass)
      out[d + 3] = 255
    }
  }
  return png(w, h, out)
}

// minimal helpers so the composite step can reuse the PNG pipeline above
function buildIdat (pngBuffer) {
  let off = 8
  const parts = []
  while (off < pngBuffer.length) {
    const len = pngBuffer.readUInt32BE(off)
    const type = pngBuffer.toString('ascii', off + 4, off + 8)
    if (type === 'IDAT') parts.push(pngBuffer.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  return Buffer.concat(parts)
}

function pngBuffer (w, h) { return Buffer.alloc(w * h * 4) }

fs.writeFileSync(path.join(OUT, 'preview-composited.png'), composite(3, 0.22, [4, 9, 17]))
fs.writeFileSync(path.join(OUT, 'preview-composited-light.png'), composite(3, 0.12, [232, 239, 249]))
console.log('svg bytes:', Buffer.byteLength(svg))
console.log('base64 chars:', fs.readFileSync(path.join(OUT, 'corridor.b64.txt'), 'utf8').length)
console.log('wrote corridor.svg, corridor.b64.txt, preview.png, preview-composited*.png')
