#!/usr/bin/env node
/**
 * Draw the lock screen's backdrop and inline it into the client bundle.
 *
 *   node tools/gen-art.mjs
 *
 * Writes assets/lock-screen.svg and rewrites LOCK_RENDITION in lib/client.js
 * with the same drawing as a base64 data URI. The plugin ships as one
 * self-contained file: the host serves no plugin assets, so anything the lock
 * screen has to show must live inside the bundle.
 *
 * The robot itself is NOT here on purpose. It is drawn as inline SVG elements in
 * lib/client.js so CSS can animate its parts and the pet can change its own eye
 * colour; a picture in an <img> could do neither.
 *
 * The scene is deterministic (a seeded LCG drives the dust and debris), so
 * re-running this produces byte-identical output unless the code changes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WIDTH = 1920
const HEIGHT = 1080
/** Sky/ground split, and the vanishing point of the ground grid. */
const HORIZON = 660
const VANISH = WIDTH / 2

/** Small deterministic PRNG so the debris never reshuffles between runs. */
function seeded (seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}
const round = (value) => Math.round(value * 10) / 10

const random = seeded(0x52555354) // "RUST"
const rng = (min, max) => min + random() * (max - min)

const dust = []
for (let index = 0; index < 10; index += 1) {
  dust.push(`<circle cx="${round(rng(0, 260))}" cy="${round(rng(0, 260))}" r="${round(rng(0.4, 1.1))}"/>`)
}

/* Ground grid: rays from the vanishing point plus rungs that tighten toward it. */
const rays = []
for (let index = -10; index <= 10; index += 1) {
  const x = VANISH + index * 190
  rays.push(`<line x1="${VANISH}" y1="${HORIZON}" x2="${round(x * 2.6 - VANISH * 1.6)}" y2="${HEIGHT}"/>`)
}
const rungs = []
let rung = HORIZON + 8
let step = 6
while (rung < HEIGHT) {
  rungs.push(`<line x1="0" y1="${round(rung)}" x2="${WIDTH}" y2="${round(rung)}"/>`)
  rung += step
  step *= 1.32
}

/* A dead pylon line and a toppled hulk: the wasteland read. */
const pylons = [330, 1520].map((x, index) => {
  const height = index === 0 ? 300 : 230
  const top = HORIZON - height
  return `<g stroke="#0b141a" stroke-width="2" fill="none" opacity="0.9">
    <path d="M${x - 40} ${HORIZON}L${x} ${round(top)}L${x + 40} ${HORIZON}"/>
    <path d="M${x - 26} ${round(HORIZON - height * 0.35)}L${x + 26} ${round(HORIZON - height * 0.35)}"/>
    <path d="M${x - 16} ${round(HORIZON - height * 0.65)}L${x + 16} ${round(HORIZON - height * 0.65)}"/>
    <path d="M${x} ${round(top)}L${x - 88} ${round(top + 44)}"/>
    <path d="M${x} ${round(top + 10)}L${x + 96} ${round(top + 58)}"/>
  </g>`
}).join('\n  ')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05070c"/>
      <stop offset="0.5" stop-color="#12161c"/>
      <stop offset="1" stop-color="#3a2a1c"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a2118"/>
      <stop offset="0.4" stop-color="#140f0b"/>
      <stop offset="1" stop-color="#080605"/>
    </linearGradient>
    <radialGradient id="haze" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffb765" stop-opacity="0.42"/>
      <stop offset="0.4" stop-color="#c9762c" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#1a120c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.74">
      <stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.8"/>
    </radialGradient>
    <pattern id="dust" width="260" height="260" patternUnits="userSpaceOnUse" fill="#ffe6c4">
      ${dust.join('')}
    </pattern>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ffd8a0" opacity="0.045"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
  <rect width="${WIDTH}" height="${HORIZON}" fill="url(#dust)" opacity="0.4"/>
  <ellipse cx="${VANISH}" cy="${HORIZON - 30}" rx="700" ry="330" fill="url(#haze)"/>

  <path d="M0 ${HORIZON} L240 ${HORIZON - 34} L520 ${HORIZON - 12} L820 ${HORIZON - 40}
           L1120 ${HORIZON - 16} L1400 ${HORIZON - 44} L1700 ${HORIZON - 18} L${WIDTH} ${HORIZON - 30}
           L${WIDTH} ${HORIZON + 46} L0 ${HORIZON + 46} Z"
        fill="#0a0806" opacity="0.95"/>
  <rect y="${HORIZON}" width="${WIDTH}" height="${HEIGHT - HORIZON}" fill="url(#ground)"/>
  <g stroke="#8a5a2a" stroke-width="1" opacity="0.26">${rays.join('')}</g>
  <g stroke="#8a5a2a" stroke-width="1" opacity="0.18">${rungs.join('')}</g>

  ${pylons}

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scan)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)"/>
</svg>
`

const svgPath = path.join(ROOT, 'assets', 'lock-screen.svg')
fs.mkdirSync(path.dirname(svgPath), { recursive: true })
fs.writeFileSync(svgPath, svg)

const clientPath = path.join(ROOT, 'lib', 'client.js')
const source = fs.readFileSync(clientPath, 'utf8')
const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
const pattern = /const LOCK_RENDITION = "[^"]*";/
if (!pattern.test(source)) {
  console.error('could not find the LOCK_RENDITION declaration in lib/client.js')
  process.exit(1)
}
fs.writeFileSync(clientPath, source.replace(pattern, `const LOCK_RENDITION = "${dataUri}";`))

console.log(`${path.relative(ROOT, svgPath)}  ${(svg.length / 1024).toFixed(1)} KiB`)
console.log(`LOCK_RENDITION inlined  ${(dataUri.length / 1024).toFixed(1)} KiB`)
