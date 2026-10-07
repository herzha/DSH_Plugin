#!/usr/bin/env node
/**
 * Draw the bundled opening frame and inline it into the client bundle.
 *
 *   node tools/gen-art.mjs
 *
 * Writes assets/open-display.svg and rewrites POSTER_RENDITION in lib/client.js
 * with the same drawing as a base64 data URI. The plugin therefore ships as one
 * self-contained file: the host serves no plugin assets, so anything the splash
 * has to show must live inside the bundle.
 *
 * The scene is deterministic (a seeded LCG drives the star placement), so
 * re-running this produces byte-identical output unless the code changes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WIDTH = 1920
const HEIGHT = 1080
/** Where the ground plane meets the sky; also the grid's vanishing point. */
const HORIZON = 640
const VANISH = WIDTH / 2

/** Small deterministic PRNG so the starfield never reshuffles between runs. */
function seeded (seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}
const round = (value) => Math.round(value * 10) / 10

const random = seeded(0x57414c4b) // "WALK"
const rng = (min, max) => min + random() * (max - min)

const stars = []
for (let index = 0; index < 9; index += 1) {
  stars.push(`<circle cx="${round(rng(0, 240))}" cy="${round(rng(0, 240))}" r="${round(rng(0.5, 1.3))}"/>`)
}
const bright = []
for (let index = 0; index < 4; index += 1) {
  bright.push(`<circle cx="${round(rng(0, 420))}" cy="${round(rng(0, 420))}" r="${round(rng(0.9, 1.7))}"/>`)
}

/* Perspective ground grid: rays from the vanishing point, plus rungs whose
   spacing tightens toward the horizon. */
const rays = []
for (let index = -11; index <= 11; index += 1) {
  const x = VANISH + index * 165
  rays.push(`<line x1="${VANISH}" y1="${HORIZON}" x2="${round(x * 2.6 - VANISH * 1.6)}" y2="${HEIGHT}"/>`)
}
const rungs = []
let rung = HORIZON + 6
let step = 5
while (rung < HEIGHT) {
  rungs.push(`<line x1="0" y1="${round(rung)}" x2="${WIDTH}" y2="${round(rung)}"/>`)
  rung += step
  step *= 1.34
}

/* Three relay masts on the ridge, each a tapering lattice with a beacon. */
const masts = [
  { x: 470, h: 250, w: 26, beacon: '#8ef0ff' },
  { x: 1290, h: 340, w: 32, beacon: '#b6ffe0' },
  { x: 1620, h: 180, w: 18, beacon: '#8ef0ff' },
].map(({ x, h, w, beacon }) => {
  const top = HORIZON - h
  const braces = []
  for (let level = 1; level <= 6; level += 1) {
    const t = level / 7
    const y = HORIZON - h * t
    const spread = (w / 2) * (1 - t) + 2
    braces.push(`<path d="M${round(x - spread)} ${round(y)}L${round(x + spread)} ${round(y)}"/>`)
    if (level < 6) {
      const nextY = HORIZON - h * ((level + 1) / 7)
      const nextSpread = (w / 2) * (1 - (level + 1) / 7) + 2
      braces.push(`<path d="M${round(x - spread)} ${round(y)}L${round(x + nextSpread)} ${round(nextY)}"/>`)
    }
  }
  return `<g stroke="#0a1520" stroke-width="1.6" fill="none" opacity="0.92">
    <path d="M${round(x - w / 2)} ${HORIZON}L${x} ${round(top)}L${round(x + w / 2)} ${HORIZON}"/>
    ${braces.join('')}
    <line x1="${x}" y1="${round(top)}" x2="${x}" y2="${round(top - 46)}" stroke-width="1.2"/>
  </g>
  <circle cx="${x}" cy="${round(top - 50)}" r="3.2" fill="${beacon}" opacity="0.9"/>`
}).join('\n  ')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#04060b"/>
      <stop offset="0.55" stop-color="#0a1420"/>
      <stop offset="1" stop-color="#12303a"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#10242c"/>
      <stop offset="0.45" stop-color="#08131a"/>
      <stop offset="1" stop-color="#04080d"/>
    </linearGradient>
    <radialGradient id="anomaly" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#8ff3ff" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#31b6d8" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0a1a22" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.72">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.72"/>
    </radialGradient>
    <pattern id="dust" width="240" height="240" patternUnits="userSpaceOnUse" fill="#dff2ff">
      ${stars.join('')}
    </pattern>
    <pattern id="dust2" width="420" height="420" patternUnits="userSpaceOnUse" fill="#ffffff">
      ${bright.join('')}
    </pattern>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#7fe6ff" opacity="0.05"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
  <rect width="${WIDTH}" height="${HORIZON}" fill="url(#dust)" opacity="0.5"/>
  <rect width="${WIDTH}" height="${HORIZON}" fill="url(#dust2)" opacity="0.75"/>

  <!-- the anomaly: the only warm-cool light source in the frame -->
  <ellipse cx="${VANISH}" cy="${HORIZON - 40}" rx="620" ry="300" fill="url(#anomaly)"/>
  <ellipse cx="${VANISH}" cy="${HORIZON - 20}" rx="150" ry="60" fill="#c9f7ff" opacity="0.10"/>

  <!-- ridge line, then the ground plane -->
  <path d="M0 ${HORIZON} L180 ${HORIZON - 26} L420 ${HORIZON - 8} L700 ${HORIZON - 30}
           L960 ${HORIZON - 12} L1180 ${HORIZON - 34} L1420 ${HORIZON - 14}
           L1700 ${HORIZON - 28} L${WIDTH} ${HORIZON - 6} L${WIDTH} ${HORIZON + 40} L0 ${HORIZON + 40} Z"
        fill="#060d13" opacity="0.95"/>
  <rect y="${HORIZON}" width="${WIDTH}" height="${HEIGHT - HORIZON}" fill="url(#ground)"/>
  <g stroke="#2f7f96" stroke-width="1" opacity="0.30">${rays.join('')}</g>
  <g stroke="#2f7f96" stroke-width="1" opacity="0.22">${rungs.join('')}</g>

  ${masts}

  <!-- scanlines and vignette keep the frame reading as a screen, not a photo -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scan)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)"/>
</svg>
`

const svgPath = path.join(ROOT, 'assets', 'open-display.svg')
fs.mkdirSync(path.dirname(svgPath), { recursive: true })
fs.writeFileSync(svgPath, svg)

const clientPath = path.join(ROOT, 'lib', 'client.js')
const source = fs.readFileSync(clientPath, 'utf8')
const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
const pattern = /const POSTER_RENDITION = "[^"]*";/
if (!pattern.test(source)) {
  console.error('could not find the POSTER_RENDITION declaration in lib/client.js')
  process.exit(1)
}
fs.writeFileSync(clientPath, source.replace(pattern, `const POSTER_RENDITION = "${dataUri}";`))

console.log(`${path.relative(ROOT, svgPath)}  ${(svg.length / 1024).toFixed(1)} KiB`)
console.log(`POSTER_RENDITION inlined  ${(dataUri.length / 1024).toFixed(1)} KiB`)
