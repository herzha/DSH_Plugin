#!/usr/bin/env node
/**
 * Point DSH-theme-display-2001SpaceOdyssey at a different backdrop.
 *
 *   node tools/set-background.mjs --reset
 *       Use the bundled SVG rendition of the Discovery One centrifuge corridor.
 *
 *   node tools/set-background.mjs "https://host/still.jpg"
 *       Use a remote still. A local file server or any absolute https URL works.
 *
 *   node tools/set-background.mjs "D:\stills\centrifuge.jpg"
 *       Embed a local image straight into the bundle as a data: URI. Keeps the
 *       plugin offline and self-contained; expect the bundle to grow by ~1.37x
 *       the file size.
 *
 * Every run also refreshes the bundled rendition from assets/corridor.svg, so
 * editing (or regenerating) that file is enough to change the default artwork.
 * Reload the page afterwards; a plugin content change needs the host to
 * re-serve the client bundle.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLIENT = path.join(ROOT, 'lib', 'client.js')
const SVG = path.join(ROOT, 'assets', 'corridor.svg')

const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

const arg = process.argv[2]

if (!fs.existsSync(SVG)) {
  console.error(`missing bundled artwork: ${SVG}`)
  process.exit(1)
}

const rendition = 'data:image/svg+xml;base64,' + fs.readFileSync(SVG).toString('base64')

let source = ''
if (arg !== undefined && arg !== '--reset') {
  if (/^(https?:|data:)/i.test(arg)) {
    source = arg
  } else {
    const file = path.resolve(arg)
    if (!fs.existsSync(file)) {
      console.error(`no such file: ${file}`)
      process.exit(1)
    }
    const mime = MIME[path.extname(file).toLowerCase()]
    if (mime === undefined) {
      console.error(`unsupported image extension: ${path.extname(file)}`)
      process.exit(1)
    }
    source = `data:${mime};base64,` + fs.readFileSync(file).toString('base64')
    console.log(`embedded ${file} (${(fs.statSync(file).size / 1024).toFixed(0)} KiB -> ${(source.length / 1024).toFixed(0)} KiB)`)
  }
}

let text = fs.readFileSync(CLIENT, 'utf8')
const before = text

text = text.replace(/(const BACKGROUND_RENDITION = ")[^"]*(";)/, (_m, a, b) => a + rendition + b)
text = text.replace(/(const BACKGROUND_URL = ")[^"]*(";)/, (_m, a, b) => a + source + b)

if (text === before) {
  console.error('nothing replaced — lib/client.js no longer has the expected BACKGROUND_* lines')
  process.exit(1)
}
if (text.includes('__CORRIDOR_DATA_URI__')) {
  console.error('placeholder left behind; refusing to write a half-built bundle')
  process.exit(1)
}

fs.writeFileSync(CLIENT, text)
console.log(source === '' ? 'background: bundled corridor rendition' : 'background: custom source')
console.log(`bundle: ${(fs.statSync(CLIENT).size / 1024).toFixed(1)} KiB`)
