#!/usr/bin/env node
/**
 * Contract check for DSH-Theme-OpenDisplay-Stalker.
 *
 * Runs the real `lib/client.js` against a stub ModuleLoader, DOM, an
 * IndexedDB-free environment and stub slot services, and asserts the properties
 * that make the plugin safe to ship:
 *
 *   - module-loader identity and a baseline-only module graph
 *   - it ADDS two seats under ids of its own and overrides no theme token
 *   - the cover is portalled onto document.body (it has to escape the
 *     z-index 20 overlay layer, or the caption menubar paints over it)
 *   - one character per glyph of the title, each with its own stagger
 *   - a single click finishes the sequence, and the finishing state snaps every
 *     layer to the last frame before the fade
 *   - the "once per window" guard is document state, never web storage
 *   - the opening frame is data (IndexedDB + a bundled fallback), not a path
 *   - unload leaves no residue
 *   - and it shares no name, attribute, id, storage or z-index band with the
 *     sibling display plugin, so the two can be installed side by side
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

/** Baseline modules the web module table provides without a declaration. */
const BASELINE = new Set([
  'react',
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
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useEffect: () => {},
  useRef: () => ({ current: null }),
  useCallback: (callback) => callback,
}

/** Portals are handed back as a plain marker so the target can be asserted. */
const reactDomStub = {
  createPortal: (node, container) => ({ portal: true, node, container }),
}

const requested = []

// ── DOM stub ────────────────────────────────────────────────────────────────
function makeDom () {
  const nodes = []
  const created = []
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
  const body = makeElement('body')
  // `[attr]` and `tag[attr]` are the only selector shapes this plugin uses.
  const matchAttribute = (selector) => selector.replace(/^.*\[|\]$/g, '')
  const document = {
    documentElement,
    body,
    head,
    createElement: (tag) => {
      const element = makeElement(tag)
      created.push(element)
      return element
    },
    querySelector: (selector) => {
      const key = matchAttribute(selector)
      return nodes.find((node) => node.attributes[key] !== undefined && !node.removed)
        ?? created.find((node) => node.attributes[key] !== undefined && !node.removed)
        ?? null
    },
    querySelectorAll: (selector) => {
      const key = matchAttribute(selector)
      return created.filter((node) => node.attributes[key] !== undefined && !node.removed)
    },
  }
  return { nodes, created, document }
}

const dom = makeDom()

/** Controllable timers, so the watchdog can be driven instead of waited on. */
const timers = { timeouts: new Map(), intervals: new Map(), next: 1 }
const loaded = []
globalThis.window = {
  setTimeout: (fn, ms) => {
    const id = timers.next++
    timers.timeouts.set(id, { fn, ms })
    return id
  },
  clearTimeout: (id) => { timers.timeouts.delete(id) },
  setInterval: (fn, ms) => {
    const id = timers.next++
    timers.intervals.set(id, { fn, ms })
    return id
  },
  clearInterval: (id) => { timers.intervals.delete(id) },
  __ModuleLoader__: {
    load: (spec) => {
      loaded.push(spec)
      spec.exports = spec.factory((name) => {
        requested.push(name)
        if (name === 'react') return reactStub
        if (name === 'react-dom') return reactDomStub
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
ok('react-dom is required for the portal', requested.includes('react-dom'))
ok('declared client platform is web', PKG.dsh?.client?.platform === 'web')
ok('client entry is exported', typeof PKG.exports?.['./client'] === 'string')

console.log('exports')
const plugin = spec?.exports
ok('exports apply()', typeof plugin?.apply === 'function')
ok('inject is ["slots"]', Array.isArray(plugin?.inject)
  && plugin.inject.length === 1
  && plugin.inject[0] === 'slots')

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
// The theme plugin owns the token layer; this one must not open a second.
ok('overrides no theme token', layers.length === 0, `${layers.length} token layer(s)`)

const settingsPages = registrations.filter((entry) => entry.slot === 'settings.section')
const overlays = registrations.filter((entry) => entry.slot === 'shell.overlay')
const page = settingsPages[0]
const seat = overlays[0]

console.log('seats')
ok('registered exactly one settings page', settingsPages.length === 1, `got ${settingsPages.length}`)
ok('registered exactly one overlay entry', overlays.length === 1, `got ${overlays.length}`)
ok('both seats use ids of their own',
  page?.declaration?.id === 'dsh-open-display-stalker' && seat?.declaration?.id === 'dsh-open-display-stalker',
  `${page?.declaration?.id} / ${seat?.declaration?.id}`)
ok('seat ids shadow no shipped section',
  !['account', 'general', 'models', 'plugins', 'agent-presets'].includes(page?.declaration?.id))
ok('page label is a thunk (locale-aware)', typeof page?.declaration?.label === 'function')
ok('both seats render a component',
  typeof page?.component === 'function' && typeof seat?.component === 'function')

// ── render the seat ─────────────────────────────────────────────────────────
/** What React would do: resolve function components and flatten arrays. */
const render = (node) => {
  if (node === null || node === undefined || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(render)
  if (typeof node.type === 'function') return render(node.type(node.props ?? {}))
  return { ...node, children: (node.children ?? []).map(render) }
}
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

console.log('the cover')
const portal = seat.component()
ok('the cover is portalled onto document.body',
  portal?.portal === true && portal?.container === dom.document.body,
  'the z-index 20 overlay layer would let the caption menubar paint over it')
const coverNodes = collectTree(render(portal?.node)).filter((node) => typeof node.type === 'string')
const scene = coverNodes.find((node) => node.props.className?.startsWith('dshStalkerScene'))
ok('a scene element is rendered', scene !== undefined)
ok('the scene is marked for inspection', scene?.props['data-dsh-stalker-scene'] === '')
ok('a single pointer press finishes the sequence', typeof scene?.props.onPointerDown === 'function')
ok('the timeline is measured in one variable',
  typeof scene?.props.style?.['--dsh-stalker-ms'] === 'string'
  && typeof scene?.props.style?.['--dsh-stalker-exit'] === 'string',
  JSON.stringify(scene?.props.style ?? {}))

const characters = coverNodes.filter((node) => node.props.className === 'dshStalkerChar')
/** The line the brief asks for; the count is derived, never assumed. */
const EXPECTED_TITLE = '欢迎来到未来'
ok('one element per glyph of the title', characters.length === EXPECTED_TITLE.length,
  `got ${characters.length}, expected ${EXPECTED_TITLE.length}`)
ok('the glyphs spell the title in order',
  characters.map((node) => node.children.join('')).join('') === EXPECTED_TITLE,
  characters.map((node) => node.children.join('')).join(''))
const staggers = characters.map((node) => Number(node.props.style?.['--dsh-stalker-char-at']))
ok('every glyph is staggered, strictly ascending',
  staggers.length === EXPECTED_TITLE.length
  && staggers.every((value) => Number.isFinite(value))
  && staggers.every((value, index) => index === 0 || value > staggers[index - 1]),
  staggers.join(', '))

const image = coverNodes.find((node) => node.props.className === 'dshStalkerArt')
ok('the opening frame is an image layer', image?.type === 'img')
ok('it falls back to the bundled rendition', String(image?.props.src ?? '').startsWith('data:image/svg+xml;base64,'),
  String(image?.props.src ?? '').slice(0, 40))
ok('the frame is not draggable or announced', image?.props.draggable === false && image?.props.alt === '')
ok('four HUD corners are drawn',
  coverNodes.filter((node) => node.props.className === 'dshStalkerHud').length === 4)
ok('the progress rule is drawn',
  coverNodes.some((node) => node.props.className === 'dshStalkerRule')
  && coverNodes.some((node) => node.props.className === 'dshStalkerRuleFill'))

// ── stylesheet ──────────────────────────────────────────────────────────────
const styles = dom.nodes[0]
const css = styles?.textContent ?? ''

console.log('stylesheet')
ok('exactly one stylesheet is injected', dom.nodes.length === 1, `got ${dom.nodes.length}`)
ok('the stylesheet is marked with this plugin id',
  styles?.attributes['data-dsh-stalker-style'] === PKG.name)

const opens = (css.match(/\/\*/g) ?? []).length
const closes = (css.match(/\*\//g) ?? []).length
ok('every CSS comment is terminated', opens === closes, `${opens} opened, ${closes} closed`)

// Every rule must be scoped, so an unloaded plugin cannot style anything.
const scoped = css.match(/^html\[data-dsh-stalker\][^,{]*[,{]/gm) ?? []
const ruleStarts = css.match(/^[^\s@/}][^{}]*\{/gm) ?? []
ok('every style rule is scoped to this plugin attribute',
  ruleStarts.every((rule) => rule.startsWith('html[data-dsh-stalker]') || rule.startsWith('@')),
  ruleStarts.filter((rule) => !rule.startsWith('html[data-dsh-stalker]')).join(' | '))
ok('the scope attribute selector is used', scoped.length > 10, `${scoped.length} scoped rules`)
ok('the cover sits above every shell layer', css.includes('z-index: 9999'))
ok('the cover takes pointer events back from the overlay layer',
  /\.dshStalkerScene\s*\{[\s\S]{0,900}?pointer-events: auto/.test(css))

ok('the ending fade is scheduled from the timeline',
  css.includes('animation-delay: calc(var(--dsh-stalker-ms) - var(--dsh-stalker-exit))'))
ok('each glyph is delayed by its own fraction',
  css.includes('animation-delay: calc(var(--dsh-stalker-ms) * var(--dsh-stalker-char-at))'))
ok('the finishing state snaps the image and the glyphs to the last frame',
  /\.dshStalkerScene\.is-finishing \.dshStalkerArt,[\s\S]{0,200}?\.dshStalkerChar \{[\s\S]{0,200}?animation: none;[\s\S]{0,200}?opacity: 1/.test(css))
ok('the finishing state restarts the fade instead of reusing the delayed one',
  /\.dshStalkerScene\.is-finishing \{[\s\S]{0,120}?animation-name: dshStalkerExitNow;[\s\S]{0,80}?animation-delay: 0ms/.test(css)
  && css.includes('@keyframes dshStalkerExitNow'))
ok('the finishing state completes the progress rule',
  /\.dshStalkerScene\.is-finishing \.dshStalkerRuleFill \{[\s\S]{0,120}?transform: scaleX\(1\)/.test(css))
ok('reduced motion shows the finished frame instead of a sequence',
  /prefers-reduced-motion: reduce\)[\s\S]{0,1600}?\.dshStalkerScene \{[\s\S]{0,120}?animation: none/.test(css)
  && /prefers-reduced-motion: reduce\)[\s\S]{0,1600}?\.dshStalkerChar[\s\S]{0,200}?animation: none/.test(css))
// A transparent glyph fill without a working clip is invisible text, so the
// gradient may only be applied where the browser confirms the property.
ok('the blue gradient is behind a clip support guard',
  /@supports \(\(background-clip: text\) or \(-webkit-background-clip: text\)\)/.test(css)
  && /@supports[\s\S]{0,220}?\.dshStalkerChar \{[\s\S]{0,400}?background-clip: text/.test(css))
ok('a plain blue fallback stays outside the guard',
  /\.dshStalkerChar \{[\s\S]{0,300}?color: #86d2ff/.test(css))

// ── once per window, not once per install ───────────────────────────────────
console.log('once per window')
ok('the guard is document state', bundle.includes('playedThisDocument'))
ok('no web storage is involved',
  !bundle.includes('sessionStorage') && !bundle.includes('localStorage'),
  'sessionStorage is copied into windows opened from a window, and localStorage would suppress the animation entirely')
ok('the seat starts from that flag', /useState\(\(\) => !playedThisDocument\)/.test(bundle))

// ── the cover cannot trap the user ──────────────────────────────────────────
console.log('safety net')
ok('the cover stamps itself when it mounts', /"data-born": String\(Date\.now\(\)\)/.test(bundle))
ok('a watchdog removes a cover that outlives its timeline',
  bundle.includes('installWatchdog') && bundle.includes('setInterval') && bundle.includes('clearInterval'),
  'a full-screen cover that never finishes would leave the window unusable')
ok('the watchdog does not depend on React state',
  /querySelectorAll\("\[" \+ SCENE_ATTRIBUTE \+ "\]"\)/.test(bundle),
  'it must work even if the render or the timers are broken')
ok('exactly one watchdog runs', timers.intervals.size === 1, `${timers.intervals.size} intervals`)
// Drive it instead of trusting it. The two cases are checked one at a time:
// the watchdog deliberately clears the whole batch once any cover is stale
// (one stuck cover already means the window is unusable), so a mixed scan says
// nothing about the fresh case.
const tickWatchdog = () => { for (const [, interval] of timers.intervals) interval.fn() }
const fresh = dom.document.createElement('div')
fresh.setAttribute('data-dsh-stalker-scene', '')
fresh.setAttribute('data-born', String(Date.now()))
tickWatchdog()
ok('a cover inside its timeline is left alone', fresh.removed === false)
const stuck = dom.document.createElement('div')
stuck.setAttribute('data-dsh-stalker-scene', '')
stuck.setAttribute('data-born', String(Date.now() - 60000))
tickWatchdog()
ok('a stuck cover is removed', stuck.removed === true)
const unstamped = dom.document.createElement('div')
unstamped.setAttribute('data-dsh-stalker-scene', '')
tickWatchdog()
ok('an unstamped cover is bounded instead of ignored',
  unstamped.removed === false && Number(unstamped.getAttribute('data-born')) > 0)
unstamped.remove()
fresh.remove()

// ── the opening frame is data ───────────────────────────────────────────────
console.log('opening frame')
ok('a picked image is written to IndexedDB', bundle.includes('splashStore.write(IMAGE_KEY, file)'))
ok('it is read back as a Blob', /blob instanceof Blob/.test(bundle))
ok('it is served through an object URL', /URL\.createObjectURL\(blob\)/.test(bundle))
ok('the store is namespaced to this plugin', bundle.includes('"dsh-open-display-stalker"'))
ok('the bundled rendition is inlined, not fetched',
  /const POSTER_RENDITION = "data:image\/svg\+xml;base64,[A-Za-z0-9+/=]{200,}";/.test(bundle))
ok('nothing in the bundle fetches a file',
  !/\bfetch\(/.test(bundle) && !bundle.includes('assets/'),
  'the host serves no plugin assets, so the frame must be data or nothing')

// ── reload safety ───────────────────────────────────────────────────────────
// A client bundle can be applied twice in one document (a rebuild re-imports
// it). The first application's disposer must not remove the scope attribute or
// the stylesheet the second one just installed, or the plugin reports itself
// active while every scoped rule is inert.
console.log('reload safety')
const firstApplication = disposers.length
plugin.apply(ctx)
ok('a second application is tolerated', disposers.length > firstApplication)
for (const dispose of disposers.slice(0, firstApplication).reverse()) dispose()
ok('a stale application cannot unscoped the live one',
  dom.document.documentElement.attributes['data-dsh-stalker'] !== undefined)
ok('a stale application does not remove the live stylesheet',
  dom.nodes.some((node) => node.attributes['data-dsh-stalker-style'] !== undefined && !node.removed))

// ── unload ──────────────────────────────────────────────────────────────────
console.log('unload')
for (const dispose of disposers.reverse()) dispose()
ok('no seat registration survives unload', registrations.length === 0, `${registrations.length} left`)
ok('the stylesheet is removed', styles.removed === true)
ok('the watchdog is stopped', timers.intervals.size === 0, `${timers.intervals.size} intervals left`)
ok('the scope attribute is gone',
  dom.document.documentElement.attributes['data-dsh-stalker'] === undefined)

// ── side by side with the sibling display plugin ─────────────────────────────
console.log('no conflict with the sibling display plugin')
const siblingPath = path.join(ROOT, '..', 'Theme-Display-2001SpaceOdyssey', 'lib', 'client.js')
if (!fs.existsSync(siblingPath)) {
  console.log('  --   sibling plugin not present; cross-checks skipped')
} else {
  const sibling = fs.readFileSync(siblingPath, 'utf8')
  const siblingPkg = JSON.parse(fs.readFileSync(
    path.join(ROOT, '..', 'Theme-Display-2001SpaceOdyssey', 'package.json'), 'utf8'))

  ok('the two packages have different names', siblingPkg.name !== PKG.name,
    `${siblingPkg.name} / ${PKG.name}`)
  ok('the two loader rows have different ids',
    !sibling.includes('DSH-Theme-OpenDisplay-Stalker') && bundle.includes('DSH-Theme-OpenDisplay-Stalker'))
  ok('this bundle never names the sibling plugin',
    !/dsh2001|dsh-2001|data-dsh-2001/.test(bundle),
    'a shared class, attribute or id would make the two plugins fight for the same DOM')
  ok('the sibling bundle never names this plugin',
    !/dshStalker|data-dsh-stalker|open-display-stalker/.test(sibling))
  ok('different storage databases',
    !sibling.includes('"dsh-open-display-stalker"') && !bundle.includes('"dsh-2001-space-odyssey"'))
  ok('different z-index bands',
    css.includes('z-index: 9999') && !sibling.includes('z-index: 9999'),
    'the cover has to be above the sibling frame, and the frame must not chase it')
  ok('both can hold a seat in the same list slot',
    sibling.includes('"shell.overlay"') && bundle.includes('"shell.overlay"'))
  ok('this plugin defers the token layer to the sibling',
    !bundle.includes('overrideTokens') && sibling.includes('overrideTokens'))
}

console.log('')
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('all checks passed')
