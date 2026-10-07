#!/usr/bin/env node
/**
 * Contract check for DSH-theme-display-2001SpaceOdyssey.
 *
 * Runs the real `lib/client.js` against a stub ModuleLoader, DOM, an
 * IndexedDB-free environment and stub theme/slot services, and asserts the
 * properties that make the plugin safe to stack: the module-loader identity,
 * a baseline-only module graph, the token-layer shape, the scope attribute,
 * a single stylesheet, the added settings page, and that unload leaves no
 * residue.
 *
 *   node tools/check.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const failures = []
const ok = (label, condition, detail) => {
  if (condition) console.log(`  ok   ${label}`)
  else {
    console.log(`  FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`)
    failures.push(label)
  }
}

/** The seven hues the caption bands and the viewport frame share. */
const FRAME_HUES = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#32d0e0', '#4d6bfe', '#af52de']

/** Baseline modules the web module table provides without a declaration. */
const BASELINE = new Set([  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-store',
])

const reactStub = {
  Fragment: Symbol('Fragment'),
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
  useRef: () => ({ current: null }),
}

const requested = []

// ── DOM stub ────────────────────────────────────────────────────────────────
function makeDom () {
  const nodes = []
  const makeElement = (tag) => ({
    tagName: tag,
    attributes: {},
    style: {
      properties: {},
      setProperty (key, value) { this.properties[key] = value },
      removeProperty (key) { delete this.properties[key] },
    },
    textContent: '',
    removed: false,
    setAttribute (key, value) { this.attributes[key] = value },
    getAttribute (key) { return this.attributes[key] ?? null },
    removeAttribute (key) { delete this.attributes[key] },
    remove () { this.removed = true },
  })
  const head = { appendChild: (el) => nodes.push(el) }
  const documentElement = makeElement('html')
  documentElement.lang = 'zh-CN'
  return {
    nodes,
    document: {
      documentElement,
      head,
      createElement: makeElement,
      querySelector: (selector) => {
        const key = selector.replace(/^style\[|\]$/g, '')
        return nodes.find((node) => node.attributes[key] !== undefined && !node.removed) ?? null
      },
    },
  }
}

const dom = makeDom()
const loaded = []
globalThis.window = {
  __ModuleLoader__: {
    load: (spec) => {
      loaded.push(spec)
      spec.exports = spec.factory((name) => {
        requested.push(name)
        if (name === 'react') return reactStub
        throw new Error(`bundle must only require baseline modules, but asked for "${name}"`)
      })
    },
  },
}
globalThis.document = dom.document
globalThis.URL = { createObjectURL: () => 'blob:stub', revokeObjectURL: () => {} }

const bundle = fs.readFileSync(path.join(ROOT, 'lib', 'client.js'), 'utf8')
// eslint-disable-next-line no-new-func
new Function('window', 'document', 'URL', 'indexedDB', bundle)(
  globalThis.window, dom.document, globalThis.URL, undefined,
)

console.log('module loader')
ok('exactly one __ModuleLoader__.load call', loaded.length === 1, `got ${loaded.length}`)
const spec = loaded[0]
ok('loader id equals the package name', spec?.id === PKG.name, `${spec?.id} !== ${PKG.name}`)
ok('package name is npm-safe (lowercase)', PKG.name === PKG.name.toLowerCase())

console.log('module graph')
ok('only baseline modules are required', requested.every((name) => BASELINE.has(name)), requested.join(', '))
ok('declared client platform is web', PKG.dsh?.client?.platform === 'web')
ok('client entry is exported', typeof PKG.exports?.['./client'] === 'string')

console.log('exports')
const plugin = spec?.exports
ok('exports apply()', typeof plugin?.apply === 'function')
ok('inject is ["theme","slots"]', Array.isArray(plugin?.inject)
  && plugin.inject.length === 2
  && plugin.inject.includes('theme')
  && plugin.inject.includes('slots'))

// ── apply against stub services ─────────────────────────────────────────────
const layers = []
const disposers = []
const registrations = []
const injectedSlots = []
const ctx = {
  effect: (callback, label) => {
    const dispose = callback()
    ok(`effect "${label}" returned a disposer`, typeof dispose === 'function')
    if (typeof dispose === 'function') disposers.push(dispose)
  },
  theme: {
    overrideTokens: (source, tokens) => {
      layers.push({ source, tokens })
      return () => { layers.pop() }
    },
  },
  slots: {
    inject: (key, callback) => {
      injectedSlots.push(key)
      const dispose = callback()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    register: (declaration, component) => {
      registrations.push({ slot: declaration.name, declaration, component })
      return () => { registrations.pop() }
    },
  },
}

console.log('apply()')
plugin.apply(ctx)

ok('injects only its own two seats',
  injectedSlots.length === 2 && injectedSlots.includes('settings.section') && injectedSlots.includes('shell.overlay'),
  injectedSlots.join(', '))
ok('every registration lands in a list slot it declared',
  registrations.length === injectedSlots.length
  && registrations.every((entry) => injectedSlots.includes(entry.slot)),
  registrations.map((entry) => entry.slot).join(', '))

ok('stacked exactly one token layer', layers.length === 1, `got ${layers.length}`)
ok('layer source is the package name', layers[0]?.source === PKG.name)
const tokens = layers[0]?.tokens ?? {}
ok('token layer is non-empty', Object.keys(tokens).length > 0)
ok('every token declares light and dark', Object.values(tokens).every(
  (value) => value !== null && typeof value === 'object'
    && typeof value.light === 'string' && typeof value.dark === 'string',
))
ok('no bare-string token values', Object.values(tokens).every((value) => typeof value !== 'string'))
ok('every token name is a --dsw custom property', Object.keys(tokens).every((name) => name.startsWith('--dsw-')))
ok('brand accent present', typeof tokens['--dsw-alias-brand-primary']?.dark === 'string')

console.log('settings page')
const settingsPages = registrations.filter((entry) => entry.slot === 'settings.section')
const overlays = registrations.filter((entry) => entry.slot === 'shell.overlay')
const page = settingsPages[0]
ok('registered exactly one settings page', settingsPages.length === 1, `got ${settingsPages.length}`)
console.log('settings page')
ok('page declares its own id', page?.declaration?.id === 'dsh-2001-space-odyssey', page?.declaration?.id)
ok('page id shadows no shipped section',
  !['account', 'general', 'models', 'plugins', 'agent-presets'].includes(page?.declaration?.id))
ok('page label is a thunk (locale-aware)', typeof page?.declaration?.label === 'function')
ok('page renders a component', typeof page?.component === 'function')

console.log('viewport frame')
const frame = overlays[0]
ok('registered exactly one overlay entry', overlays.length === 1, `got ${overlays.length}`)
ok('overlay uses its own id', frame?.declaration?.id === 'dsh-2001-rainbow-frame', frame?.declaration?.id)
ok('overlay renders a component', typeof frame?.component === 'function')
// Render it for real against the element stub, so a typo in a className or a
// missing edge is caught here rather than in the browser.
const collectTree = (node, out = []) => {
  if (node === null || node === undefined || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const child of node) collectTree(child, out)
    return out
  }
  if (node.props !== undefined) out.push(node)
  for (const child of node.children ?? []) collectTree(child, out)
  return out
}
// Only host elements become DOM nodes; the Fragment wrapper is not one.
const frameNodes = frame === undefined
  ? []
  : collectTree(frame.component()).filter((node) => typeof node.type === 'string')
const edgeNodes = frameNodes.filter((node) => node.props.className === 'dsh2001FrameEdge')
ok('frame renders exactly four edge strips',
  frameNodes.length === 4 && edgeNodes.length === 4
  && ['top', 'bottom', 'left', 'right'].every((edge) => edgeNodes.some((node) => node.props['data-edge'] === edge)),
  `${frameNodes.length} DOM nodes, ${edgeNodes.length} edges — nothing else may ride the overlay`)
console.log('display layer')
// hydrate() settles on a microtask; the opacity is published from there.
await new Promise((resolve) => setTimeout(resolve, 0))
const rootStyle = dom.document.documentElement.style.properties
ok('scope attribute published', dom.document.documentElement.getAttribute('data-dsh-2001') === 'on')
ok('background opacity is published for the bundled plate too',
  rootStyle['--dsh-2001-plate-opacity'] === '1', `got ${rootStyle['--dsh-2001-plate-opacity']}`)
ok('no image variable while the bundled plate is showing',
  rootStyle['--dsh-2001-plate'] === undefined)
const styles = dom.nodes.filter((node) => node.attributes['data-dsh-2001-style'] !== undefined)
ok('exactly one stylesheet installed', styles.length === 1, `got ${styles.length}`)
const css = styles[0]?.textContent ?? ''
ok('stylesheet carries the bundled plate', css.includes('data:image/svg+xml;base64,'))
ok('plate is overridable by a custom variable', css.includes('var(--dsh-2001-plate,'))
ok('plate opacity is a variable', css.includes('--dsh-2001-plate-opacity'))
ok('background opacity applies to the bundled plate as well as a picked image',
  css.includes('--dsh-2001-plate-opacity')
  && css.includes('.dsh2001PlateThumbPlate')
  && !bundle.includes('if (state.kind !== "custom") return Promise.resolve(false)'),
  'the opacity slider is still gated to a custom plate')
ok('nav entries are a riveted scrap plate, not a flat amber fill',
  css.includes('_newSession') && css.includes('sidebar.panellist')
  && css.includes('background-color: var(--dsh-2001-scrap)')
  && css.includes('radial-gradient(circle at 7px 7px')
  && css.includes('repeating-linear-gradient(97deg,')
  && !css.includes('--dsh-2001-amber'))
// The plate is one element with three PARALLEL lists (image / size / position).
// A length mismatch silently shifts every layer after it onto the wrong
// geometry, so the counts are checked against each other.
const splitTopLevel = (text) => {
  const parts = []
  let depth = 0
  let current = ''
  for (const char of text) {
    if (char === '(') depth += 1
    else if (char === ')') depth -= 1
    if (char === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue }
    current += char
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}
const plateRule = css.slice(
  css.indexOf('button[class*="_newSession"],'),
  css.indexOf('button[class*="_newSession"]:hover'),
)
const plateLayers = (property) => {
  const match = new RegExp(`${property}:[\\s\\S]*?;`).exec(plateRule)
  return match === null ? [] : splitTopLevel(match[0].replace(`${property}:`, '').replace(/;$/, ''))
}
const plateImages = plateLayers('background-image')
const plateSizes = plateLayers('background-size')
const platePositions = plateLayers('background-position')
ok('scrap plate background layers stay aligned',
  plateImages.length >= 9 && plateSizes.length === plateImages.length
  && platePositions.length === plateImages.length,
  `image ${plateImages.length}, size ${plateSizes.length}, position ${platePositions.length}`)
ok('scrap plate carries rivets, a hazard stripe and a panel seam',
  (plateRule.match(/radial-gradient\(circle at/g) ?? []).length === 4
  && plateRule.includes('repeating-linear-gradient(115deg,')
  && plateRule.includes('53%, rgba(0,0,0,0.5) 53% 55%'),
  'an ornament layer went missing')
ok('nav type is cold white with a dark outline, never the plate colour',
  css.includes('--dsh-2001-type: #ffffff')
  && /_newSession"\],[^}]*color: var\(--dsh-2001-type\)/.test(css)
  && css.includes('0 0 2px rgba(0,0,0,0.95)')
  && css.includes('0 0 16px var(--dsh-2001-type-rim)')
  && css.includes('font-weight: 800')
  && !css.includes('#f5e9d2'),
  'the label still shares the warm plate palette')
ok('nav glyphs are outlined too',
  /button:has\(\[data-slot="sidebar\.panellist"\]\) svg \{[\s\S]{0,160}?drop-shadow/.test(css))
ok('workspace heading is promoted to brass',
  /_sectionLabel"\] \{[\s\S]{0,320}?color: var\(--dsh-2001-brass\)/.test(css)
  && css.includes('_sectionHeader"]::before'))
ok('workspace region gets a border', css.includes('has(> [data-slot="sidebar.workspaces"])'))
ok('workspace rows get heavier type', css.includes('[data-row-key]') && css.includes('font-weight: 600'))
ok('caption strip scoped to the windows titlebar', css.includes('[data-windows-titlebar]'))
// Scoped to the bar rule itself: other rules legitimately use gradients.
const barRule = css.slice(
  css.indexOf('[data-windows-titlebar]::after'),
  css.indexOf('[data-windows-titlebar]::after') + 520,
)
ok('caption bar is one flat translucent fill',
  barRule.includes('background-image: none')
  && barRule.includes('border: 0')
  && !barRule.includes('repeating-linear-gradient')
  && !barRule.includes('border-bottom'),
  barRule.slice(0, 80).replace(/\n/g, ' '))
const railRule = css.slice(
  css.indexOf('[data-windows-titlebar] body::before'),
  css.indexOf('[data-windows-titlebar] body::before') + 700,
)
ok('collision bands cover the full caption bar',
  railRule.includes('width: 50vw')
  && railRule.includes('height: var(--dsh-windows-titlebar-height, 40px)')
  && railRule.includes('top: 0'))
ok('collision rails animate',
  css.includes('@keyframes dsh2001-rail-left') && css.includes('@keyframes dsh2001-rail-right'))
ok('rails ride above the caption menubar', /z-index: 1200/.test(css))
// Pull each keyframe body on its own, so the reduced-motion override further
// down the sheet cannot leak into the round list.
const keyframeBody = (name) => {
  const match = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css)
  return match === null ? '' : match[1]
}
const huesOf = (body) => [...body.matchAll(/background-color: rgba\(([\d,]+),/g)].map((m) => m[1])
const stopsOf = (body) => [...body.matchAll(/\t([\d.]+)% \{ transform: translateX\((-?[\d.]+%?)\); opacity: ([\d.]+);/g)]
  .map((m) => ({ offset: Number(m[1]), reach: Math.abs(parseFloat(m[2])), opacity: Number(m[3]) }))
const leftBody = keyframeBody('dsh2001-rail-left')
const rightBody = keyframeBody('dsh2001-rail-right')
const leftHues = huesOf(leftBody)
const rightHues = huesOf(rightBody)
const roundHues = leftHues.filter((hue, index) => leftHues.indexOf(hue) === index)
const roundSpan = 100 / roundHues.length
// Out-of-order stops are silently re-sorted by the engine and animate as
// nonsense; this is the guard for the round-length bug that produced it.
const ascends = (list) => list.every((value, index) => index === 0 || value > list[index - 1])
const leftStops = stopsOf(leftBody)
const rightStops = stopsOf(rightBody)
const offsets = leftStops.map((stop) => stop.offset)
ok('rail keyframe offsets ascend within the cycle',
  offsets.length > 6 && ascends(offsets) && offsets[offsets.length - 1] === 100,
  offsets.slice(0, 8).join(', '))
ok('every stop stays inside its own round',
  offsets.every((offset, index) => index === 0 || Math.floor(offset / roundSpan) >= Math.floor(offsets[index - 1] / roundSpan)),
  `round span ${roundSpan.toFixed(2)}%`)
// The band may only travel OUTWARDS while it is invisible — that is the reset
// between rounds, and it is what leaves the visible motion strictly inwards,
// which is the one thing this effect has to get right.
const outwardWhileVisible = (stops) => stops.filter((stop, index) => index > 0
  && stop.reach > stops[index - 1].reach
  && (stop.opacity > 0 || stops[index - 1].opacity > 0)).length
ok('visible motion is inwards only (both bands)',
  outwardWhileVisible(leftStops) === 0 && outwardWhileVisible(rightStops) === 0,
  `left ${outwardWhileVisible(leftStops)}, right ${outwardWhileVisible(rightStops)}`)
ok('one collision round every ~3s',
  roundHues.length > 0 && css.includes(`animation-duration: ${roundHues.length * 3}s`),
  `${roundHues.length} rounds, expected ${roundHues.length * 3}s`)
ok('rails are translucent washes',
  css.includes('rgba(255,59,48,0.3)') && css.includes('rgba(255,59,48,0.52)'))
ok('both bands always carry the same hue',
  leftHues.length === rightHues.length && leftHues.every((hue, index) => hue === rightHues[index]),
  `left ${leftHues.length} vs right ${rightHues.length}`)
ok('hues advance in spectrum order 红橙黄绿青蓝紫',
  (() => {
    const order = ['255,59,48', '255,149,0', '255,214,10', '52,199,89', '50,208,224', '77,107,254', '175,82,222']
    return roundHues.length === order.length && roundHues.every((hue, index) => hue === order[index])
  })(), roundHues.join(' | '))
ok('rail paint is declared, not derived from currentColor',
  css.includes('background-color: rgba(255,59,48,0.3)')
  && css.includes('box-shadow: 0 0 18px 2px rgba(255,59,48,0.35)')
  && !css.includes('currentColor 58%'))
ok('rail tails fade out through a mask',
  css.includes('mask-image: linear-gradient(90deg') && css.includes('mask-image: linear-gradient(270deg'))
ok('menubar tinted through inherited custom properties', css.includes('[data-windows-menu]'))
// ── viewport frame ──────────────────────────────────────────────────────────
// Each edge carries a slice of one continuous spectrum; the four ends must
// agree where the strips overlap, or a corner shows a colour seam.
const frameHues = {}
for (const edge of ['top', 'bottom', 'left', 'right']) {
  const at = css.indexOf(`[data-edge="${edge}"] {`)
  const rule = css.slice(at, css.indexOf('}', at))
  frameHues[edge] = rule.slice(rule.indexOf('linear-gradient('), rule.lastIndexOf(')')).match(/#[0-9a-f]{6}/g) ?? []
}
ok('four frame edges, each a full spectrum',
  ['top', 'bottom', 'left', 'right'].every((edge) => frameHues[edge].length === 7),
  Object.entries(frameHues).map(([edge, hues]) => `${edge}:${hues.length}`).join(' '))
ok('frame corners agree end to end',
  frameHues.top[0] === frameHues.left[0]
  && frameHues.top[6] === frameHues.right[0]
  && frameHues.bottom[0] === frameHues.left[6]
  && frameHues.bottom[6] === frameHues.right[6],
  `top ${frameHues.top[0]}..${frameHues.top[6]} left ${frameHues.left[0]}..${frameHues.left[6]} right ${frameHues.right[0]}..${frameHues.right[6]} bottom ${frameHues.bottom[0]}..${frameHues.bottom[6]}`)
ok('frame spectrum is the caption band palette',
  FRAME_HUES.every((hue) => css.includes(hue)))
ok('frame runs one turn every 5s',
  /dsh2001FrameEdge[\s\S]{0,600}?animation-duration: 5s/.test(css))
ok('frame is pointer-transparent and above the app',
  /dsh2001FrameEdge \{[\s\S]{0,300}?pointer-events: none/.test(css) && css.includes('z-index: 1300'))
// The glow was removed on request, not merely hidden: no bloom rule, no blur
// layer and no bloom keyframes may come back.
ok('frame has no glow layer at all',
  !css.includes('dsh2001FrameBloom') && !css.includes('dsh2001-frame-hue-bloom') && !css.includes('blur('))
ok('frame stops turning under reduced motion',
  /prefers-reduced-motion: reduce\)[\s\S]{0,900}?dsh2001FrameEdge[\s\S]{0,160}?animation: none/.test(css))

// ── conversation surface ────────────────────────────────────────────────────
const regionAt = css.indexOf('[data-conversation-region] {')
const regionRule = css.slice(regionAt, css.indexOf('}', regionAt))
ok('conversation text is enlarged',
  regionRule.includes('--dsh-content-font-size: 16px'),
  regionRule.slice(0, 80).replace(/\n/g, ' '))
// The shell derives these on <body>; if the region overrode only the size, the
// heading/table ladder would keep the old delta and outgrow the body text.
ok('conversation sizing re-derives the whole ladder',
  ['--dsh-content-font-delta:', '--dsh-content-font-size-secondary:', '--dsh-content-font-delta-secondary:']
    .every((property) => regionRule.includes(property)),
  'a derived font variable is missing, so the ladder would drift')
ok('conversation text is tinted and lit, not white and not the chip brass',
  regionRule.includes('--dsw-alias-label-primary: #c8e4ff')
  && regionRule.includes('--dsw-alias-label-secondary: rgba(178,214,255,0.88)')
  && regionRule.includes('text-shadow: 0 0 12px rgba(122,196,255,0.35)')
  && !regionRule.includes('#ffffff')
  && !regionRule.includes('226,183,95')
  && !regionRule.includes('--dsw-alias-label-tertiary'),
  'must not be white, must not reuse the chip colour, and tertiary must stay put')

// ── session-header mode chip ────────────────────────────────────────────────
const chipAt = css.indexOf('span[class*="_label"]:not(button *)')
const chipRule = css.slice(chipAt, css.indexOf('}', chipAt))
ok('mode chip is scoped to the header actions slot and the bare chip',
  chipAt > 0 && css.slice(0, chipAt).includes('[data-slot="conversation.session.header.actions"]'),
  'selector is missing its slot scope')
ok('mode chip is promoted to a brass chip',
  chipRule.includes('color: var(--dsh-2001-brass)')
  && chipRule.includes('font-size: 13px')
  && chipRule.includes('font-weight: 700')
  && chipRule.includes('height: 26px')
  && chipRule.includes('inset 0 0 0 1px rgba(226,183,95,0.45)'),
  chipRule.slice(0, 80).replace(/\n/g, ' '))
// display must stay untouched: the shell hides this chip on a narrow header.
ok('mode chip keeps the shell control over its own display',
  !chipRule.includes('display:'))

// ── session title chip ──────────────────────────────────────────────────────
const titleAt = css.indexOf('[class*="_crumbCurrent"]')
const titleRule = css.slice(titleAt, css.indexOf('}', titleAt))
ok('title chip is scoped through the conversation header',
  titleAt > 0 && /header:has\(\[data-slot="conversation\.session\.header\.actions"\]\)\s*\[class\*="_crumbCurrent"\]/.test(css.slice(0, titleAt + 120)),
  'selector lost its header scope')
ok('title chip matches the mode chip treatment in a distinct colour',
  titleRule.includes('color: #9fe8ff')
  && titleRule.includes('background-color: rgba(50,208,224,0.16)')
  && titleRule.includes('inset 0 0 0 1px rgba(50,208,224,0.55)')
  && titleRule.includes('font-weight: 700')
  && titleRule.includes('font-size: 15px')
  && !titleRule.includes('226,183,95'),
  'must not reuse the brass chip colour')
ok('title chip leaves the crumb layout to the shell',
  !titleRule.includes('display:'),
  'pinning display would break the crumb ellipsis')
// A single unterminated comment turns the rest of the sheet into a comment and
// silently kills every rule after it — the failure mode of an earlier revision.
const commentOpens = (css.match(/\/\*/g) ?? []).length
const commentCloses = (css.match(/\*\//g) ?? []).length
ok('every CSS comment is terminated', commentOpens === commentCloses,
  `${commentOpens} "/*" vs ${commentCloses} "*/"`)
// Every `{` in a stylesheet is preceded by either an at-rule, a keyframe step
// or a selector prelude — declarations never contain braces — so the preludes
// can be read straight out of the text once comments are stripped, without a
// CSS parser.
const preludes = ((css.replace(/\/\*[\s\S]*?\*\//g, '')).match(/[^{}]+\{/g) ?? [])
  .map((chunk) => chunk.slice(0, -1).trim())
  .filter((prelude) => prelude !== '' && !prelude.startsWith('@') && !/^[\d.]+%$/.test(prelude)
    && prelude !== 'from' && prelude !== 'to')
  .flatMap((prelude) => prelude.split(',').map((selector) => selector.trim()))
  .filter((selector) => selector !== '')
const unscoped = preludes.filter((selector) => !selector.includes('html[data-dsh-2001]')
  && !selector.startsWith('.dsh2001'))
ok('every selector is scoped or plugin-prefixed', unscoped.length === 0, unscoped.slice(0, 3).join(' | '))
ok('no !important escapes', !css.includes('!important'))
ok('reduced motion honoured', css.includes('prefers-reduced-motion'))

console.log('unload')
for (const dispose of disposers.slice().reverse()) dispose()
ok('token layer removed', layers.length === 0)
ok('settings page removed', registrations.length === 0)
ok('scope attribute removed', dom.document.documentElement.getAttribute('data-dsh-2001') === null)
ok('plate variables restored', dom.document.documentElement.style.properties['--dsh-2001-plate'] === undefined
  && dom.document.documentElement.style.properties['--dsh-2001-plate-opacity'] === undefined)
ok('stylesheet removed', dom.nodes.every((node) => node.removed))

console.log(failures.length === 0 ? '\nall checks passed' : `\n${failures.length} check(s) failed`)
process.exit(failures.length === 0 ? 0 : 1)
