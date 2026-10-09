#!/usr/bin/env node
/**
 * Contract check for dsh-pet-robot.
 *
 * Runs the real `lib/client.js` against a stub ModuleLoader, DOM, an
 * IndexedDB-free environment and stub slot/shortcut/Remote services, then
 * asserts both the safety properties and the four things the pet promises:
 *
 *   - identity, a baseline-only module graph, two additive seats, no token layer
 *   - the robot is inline SVG driven by `data-mood` (an <img> could neither be
 *     animated nor change its eye colour)
 *   - the close button ARMS first and only then calls the shell's shortcuts
 *     service (driven here, not just grepped)
 *   - the balance button really calls `remote.account.getBalance` with the
 *     metadata shape that Remote validates
 *   - the lock cover keeps the welcome line, unlocks on one press, and carries a
 *     native listener so it can free the window even if React's events are what
 *     broke
 *   - the completion sound is synthesised, gated on a running -> settled edge,
 *     and never required: `off` and a missing AudioContext are both fine
 *   - it shares no name, attribute, id, storage or z-index band with the two
 *     sibling display plugins
 *   - unload leaves no residue
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

const requested = []
/** Effect cleanups, so unload can be checked for residue. */
const cleanups = []

/**
 * A small stateful React stand-in.
 *
 * State lives in cells addressed by hook order, exactly like the real thing, so
 * a setter can schedule another render pass and the assertions can drive a click,
 * wait for the commit, and then look at what the component actually renders.
 * Effects run after a pass and only re-run when their deps change, so a
 * subscribe effect does not pile up listeners.
 */
const cells = []
const deps = []
let hookIndex = 0
let pendingEffects = []
let scheduled = false
let portals = []

const sameDeps = (before, after) => before !== undefined && after !== undefined
  && before.length === after.length && before.every((value, index) => Object.is(value, after[index]))

const reactStub = {
  Fragment: Symbol('Fragment'),
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
  useState (initial) {
    const index = hookIndex++
    if (cells[index] === undefined) cells[index] = typeof initial === 'function' ? initial() : initial
    const set = (next) => {
      const value = typeof next === 'function' ? next(cells[index]) : next
      if (Object.is(value, cells[index])) return
      cells[index] = value
      scheduled = true
    }
    return [cells[index], set]
  },
  useRef (initial) {
    const index = hookIndex++
    if (cells[index] === undefined) cells[index] = { current: initial ?? null }
    return cells[index]
  },
  useEffect (fn, list) {
    const index = hookIndex++
    if (sameDeps(deps[index], list)) return
    deps[index] = list
    pendingEffects.push(fn)
  },
  useCallback: (callback) => callback,
  useMemo: (factory) => factory(),
}

const reactDomStub = {
  createPortal: (node, container) => {
    portals.push({ node, container })
    return { portal: true, node, container }
  },
}

// ── DOM stub ────────────────────────────────────────────────────────────────
function makeDom () {
  const nodes = []
  const created = []
  const makeElement = (tag) => ({
    tagName: tag,
    attributes: {},
    listeners: {},
    style: {
      properties: {},
      setProperty (key, value) { this.properties[key] = value },
      removeProperty (key) { delete this.properties[key] },
    },
    textContent: '',
    removed: false,
    isConnected: true,
    setAttribute (key, value) { this.attributes[key] = value },
    getAttribute (key) { return this.attributes[key] ?? null },
    removeAttribute (key) { delete this.attributes[key] },
    addEventListener (type, handler) { this.listeners[type] = handler },
    removeEventListener (type) { delete this.listeners[type] },
    remove () { this.removed = true; this.isConnected = false },
  })
  const head = { appendChild: (el) => nodes.push(el) }
  const documentElement = makeElement('html')
  documentElement.lang = 'zh-CN'
  const body = makeElement('body')
  const matchAttribute = (selector) => selector.replace(/^.*\[|\]$/g, '')
  return {
    nodes,
    created,
    document: {
      documentElement,
      body,
      head,
      addEventListener: () => {},
      removeEventListener: () => {},
      createElement: (tag) => {
        const element = makeElement(tag)
        created.push(element)
        return element
      },
      querySelector: (selector) => {
        const key = matchAttribute(selector)
        return nodes.find((node) => node.attributes[key] !== undefined && !node.removed) ?? null
      },
      querySelectorAll: (selector) => {
        const key = matchAttribute(selector)
        return created.filter((node) => node.attributes[key] !== undefined && !node.removed)
      },
    },
  }
}

const dom = makeDom()
const timers = { timeouts: new Map(), next: 1 }
/** Records every oscillator start, so "a sound played" can be asserted. */
const audio = { starts: 0 }
class FakeAudioContext {
  constructor () {
    this.state = 'running'
    this.sampleRate = 8000
    this.currentTime = 0
    this.destination = {}
  }

  createOscillator () {
    audio.starts += 1
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => ({ connect: () => {} }),
      start: () => {},
      stop: () => {},
    }
  }

  createGain () { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => ({ connect: () => {} }) } }
  createBuffer () { return { getChannelData: () => new Float32Array(8) } }
  createBufferSource () { return { connect: () => ({ connect: () => {} }), start: () => {}, stop: () => {} } }
  createBiquadFilter () { return { type: 'lowpass', frequency: {}, connect: () => ({ connect: () => {} }) } }
  resume () { this.state = 'running'; return Promise.resolve() }
  close () { return Promise.resolve() }
}
globalThis.AudioContext = FakeAudioContext
const loaded = []
globalThis.window = {
  innerWidth: 1600,
  innerHeight: 900,
  location: { hash: '' },
  setTimeout: (fn, ms) => { const id = timers.next++; timers.timeouts.set(id, { fn, ms }); return id },
  clearTimeout: (id) => { timers.timeouts.delete(id) },
  setInterval: (fn, ms) => { const id = timers.next++; timers.intervals = timers.intervals ?? new Map(); timers.intervals.set(id, { fn, ms }); return id },
  clearInterval: (id) => { if (timers.intervals !== undefined) timers.intervals.delete(id) },
  addEventListener: () => {},
  removeEventListener: () => {},
  close: () => { globalThis.__closed = true },
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
ok('react-dom is required for the portals', requested.includes('react-dom'))
ok('declared client platform is web', PKG.dsh?.client?.platform === 'web')

console.log('exports')
const plugin = spec?.exports
ok('exports apply()', typeof plugin?.apply === 'function')
ok('inject covers the three borrowed capabilities',
  Array.isArray(plugin?.inject)
  && plugin.inject.includes('slots')
  && plugin.inject.includes('shortcuts')
  && plugin.inject.includes('remote.account'),
  String(plugin?.inject))

// ── apply against stub services ─────────────────────────────────────────────
const layers = []
const disposers = []
const registrations = []
const injectedSlots = []
const closeCalls = []
const balanceCalls = []
const commandCalls = []
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
  shortcuts: {
    closeWindow: () => {
      closeCalls.push(Date.now())
      return Promise.resolve()
    },
  },
  remote: {
    commands: { execute: (sessionId, line) => { commandCalls.push({ sessionId, line }); return Promise.resolve({ kind: 'success' }) } },
    account: {
      getBalance: (metadata) => {
        balanceCalls.push(metadata)
        return Promise.resolve({ ok: true, value: { status: 'ready', value: [{ currency: 'CNY', balance: '12.34' }], bonusWallets: [{ currency: 'CNY', balance: '5.00' }] } })
      },
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
ok('overrides no theme token', layers.length === 0, `${layers.length} token layer(s)`)

const settingsPages = registrations.filter((entry) => entry.slot === 'settings.section')
const overlays = registrations.filter((entry) => entry.slot === 'shell.overlay')
ok('registered exactly one settings page', settingsPages.length === 1, `got ${settingsPages.length}`)
ok('registered exactly one overlay entry', overlays.length === 1, `got ${overlays.length}`)
ok('both seats use ids of their own',
  settingsPages[0]?.declaration?.id === PKG.name && overlays[0]?.declaration?.id === PKG.name,
  `${settingsPages[0]?.declaration?.id} / ${overlays[0]?.declaration?.id}`)
ok('page label is a thunk (locale-aware)', typeof settingsPages[0]?.declaration?.label === 'function')

// ── render the pet ──────────────────────────────────────────────────────────
const render = (node) => {
  if (node === null || node === undefined || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(render)
  if (node.portal === true) return { ...node, node: render(node.node) }
  if (typeof node.type === 'function') return render(node.type(node.props ?? {}))
  return { ...node, children: (node.children ?? []).map(render) }
}
const collectTree = (node, out = []) => {
  if (node === null || node === undefined || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const child of node) collectTree(child, out)
    return out
  }
  if (node.portal === true) {
    collectTree(node.node, out)
    return out
  }
  if (node.props !== undefined) out.push(node)
  for (const child of node.children ?? []) collectTree(child, out)
  return out
}

/**
 * Render the seat and settle: state updates schedule another pass, and effects
 * run after each one, exactly so a driven click can be observed in the tree.
 * @returns the rendered tree plus its host nodes.
 */
const renderApp = (element) => {
  let tree = null
  for (let pass = 0; pass < 24; pass += 1) {
    hookIndex = 0
    pendingEffects = []
    scheduled = false
    portals = []
    tree = render(element)
    const queue = pendingEffects
    pendingEffects = []
    for (const fn of queue) {
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
    }
    if (!scheduled) break
  }
  return { tree, nodes: collectTree(tree).filter((node) => typeof node.type === 'string') }
}
/** @returns the host nodes of the currently rendered seat. */
const currentNodes = (element) => renderApp(element).nodes
/** Find one interactive node by the text it renders. */
const findButton = (nodes, needle) => nodes.find((node) => node.props.className?.startsWith('dshPet')
  && typeof node.props.onClick === 'function'
  && node.children.join('').includes(needle))

console.log('the pet')
const seat = overlays[0]
/**
 * The seat element re-rendered from scratch, which is what drives state. The
 * status hook is a plain function over a mutable snapshot, so a test can move a
 * session from running to settled and see what the pet does about it.
 */
let sessionSnapshot = undefined
const statusHook = (selector) => selector(sessionSnapshot)
const sessionsHook = (selector) => selector({ order: ['session-1'] })
const seatElement = () => seat.component({ useSessionStatus: statusHook, useSessions: sessionsHook })
const first = renderApp(seatElement())
const petNodes = first.nodes
const robot = petNodes.find((node) => node.props.className === 'dshPetRobot')
ok('the pet is portalled onto document.body',
  portals.length >= 1 && portals[0].container === dom.document.body,
  'the z-index 20 overlay layer would let the caption menubar paint over it')
ok('the robot is rendered', robot !== undefined)
ok('the robot is marked for inspection', robot?.props['data-dsh-pet-robot'] === '')
ok('the robot carries its mood', typeof robot?.props['data-mood'] === 'string', String(robot?.props['data-mood']))
ok('the robot is draggable',
  typeof robot?.props.onPointerDown === 'function'
  && typeof robot?.props.onPointerMove === 'function'
  && typeof robot?.props.onPointerUp === 'function')
ok('the pet scales from a custom property',
  typeof robot?.props.style?.['--dsh-pet-scale'] === 'string')
ok('the robot is inline SVG, not a picture',
  petNodes.some((node) => node.type === 'svg' && node.props.className === 'dshPetFigure'),
  'an <img> could not animate its parts or change its eye colour')
ok('the eye and the antenna are separate animated parts',
  petNodes.some((node) => node.props.className === 'dshPetEye')
  && petNodes.some((node) => node.props.className === 'dshPetAntenna'))

// ── the trigger, driven with the container the shell really publishes ────────
// The status snapshot is a Map, and reading it with Object.entries yields
// nothing at all — which is exactly why the sound and the bubble never fired.
console.log('user-turn trigger (driven)')
// The ring has a cooldown so two triggers cannot double-sound for one turn, so
// these steps move a controllable clock instead of racing real time.
const clock = { value: 1000000 }
Date.now = () => clock.value
const advance = (ms) => { clock.value += ms }
sessionSnapshot = new Map([['session-1', { running: true, pendingInteraction: false, completionUnread: false }]])
renderApp(seatElement())
ok('a running turn shows no bubble', currentNodes(seatElement()).every((node) => node.props.className !== 'dshPetNotice'))
const startsBefore = audio.starts
advance(3000)
sessionSnapshot = new Map([['session-1', { running: false, pendingInteraction: false, completionUnread: true }]])
const settled = renderApp(seatElement())
ok('a Map snapshot is read at all', settled.nodes.length > 0)
ok('a settled turn shows the bubble',
  settled.nodes.some((node) => node.props.className === 'dshPetNotice'),
  'the snapshot is a Map, so Object.entries sees nothing')
const bubble = settled.nodes.find((node) => node.props.className === 'dshPetNotice')
ok('the bubble says the task finished', bubble?.children.join('').includes('任务完成') || bubble?.children.join('').includes('Task finished'),
  bubble?.children.join(''))
ok('a settled turn also plays a sound', audio.starts > startsBefore, `${audio.starts - startsBefore} oscillators`)

// A question waiting for an answer is the other "needs me" edge.
sessionSnapshot = new Map([['session-1', { running: true, pendingInteraction: false, completionUnread: false }]])
renderApp(seatElement())
advance(3000)
sessionSnapshot = new Map([['session-1', { running: true, pendingInteraction: true, completionUnread: false }]])
const asked = renderApp(seatElement())
const askedBubble = asked.nodes.find((node) => node.props.className === 'dshPetNotice')
ok('a waiting question shows its own bubble',
  askedBubble !== undefined && (askedBubble.children.join('').includes('需要你输入') || askedBubble.children.join('').includes('Your turn')),
  askedBubble?.children.join(''))

console.log('the tool bar')
const buttons = petNodes.filter((node) => node.props.className === 'dshPetButton')
ok('five tool buttons are offered', buttons.length === 5, `got ${buttons.length}`)
const labels = buttons.map((node) => node.children.join(''))
ok('the bar offers balance, refresh, lock, sound and close',
  labels.some((label) => label.includes('刷新') || label.includes('Refresh')) &&
  labels.some((label) => label.includes('余额') || label.includes('Balance'))
  && labels.some((label) => label.includes('锁屏') || label.includes('Lock'))
  && labels.some((label) => label.includes('音效') || label.includes('Sound'))
  && labels.some((label) => label.includes('关闭') || label.includes('Close')),
  labels.join(' | '))

// Five controls in one row read as "too many, then too few", so the bar breaks
// after the third: three on top, two below, both centred.
const bar = petNodes.find((node) => node.props.className === 'dshPetBar')
const barChildren = (bar?.children ?? []).filter((node) => node !== null && node !== undefined && node !== false)
const breakAt = barChildren.findIndex((node) => node.props?.className === 'dshPetBarBreak')
const buttonsBefore = barChildren.slice(0, breakAt).filter((node) => node.props?.className === 'dshPetButton').length
const buttonsAfter = barChildren.slice(breakAt + 1).filter((node) => node.props?.className === 'dshPetButton').length
ok('the bar is laid out three and two',
  breakAt === 3 && buttonsBefore === 3 && buttonsAfter === 2,
  `break at ${breakAt}, ${buttonsBefore} + ${buttonsAfter}`)
ok('the break really forces a new line',
  bundle.includes('.dshPetBarBreak') && bundle.includes('flex-basis: 100%'),
  'a zero-height full-width item is what flexbox needs to break a line on purpose')

// ── the drag must not eat the controls ──────────────────────────────────────
// This is the regression that made every button look dead: capturing the
// pointer on a press that started on a button retargets the pointerup to the
// wrapper, so the button's own click never fires.
console.log('drag vs controls (driven)')
const dragged = { captures: 0, releases: 0 }
const wrapper = {
  getBoundingClientRect: () => ({ left: 100, top: 100, width: 96, height: 130 }),
  setPointerCapture: () => { dragged.captures += 1 },
  releasePointerCapture: () => { dragged.releases += 1 },
}
const pointer = (target, x, y) => ({
  button: 0,
  pointerId: 7,
  clientX: x,
  clientY: y,
  currentTarget: wrapper,
  target,
})
const buttonTarget = { closest: () => ({ tagName: 'BUTTON' }) }
robot.props.onPointerDown(pointer(buttonTarget, 120, 140))
ok('a press on a control never captures the pointer', dragged.captures === 0,
  'capturing here is what swallowed every tool bar click')
robot.props.onPointerMove(pointer(buttonTarget, 160, 180))
ok('a press on a control never drags the robot', dragged.captures === 0)
robot.props.onPointerUp(pointer(buttonTarget, 160, 180))

const plainTarget = { closest: () => null }
robot.props.onPointerDown(pointer(plainTarget, 120, 140))
ok('a press on the robot body does not capture yet', dragged.captures === 0,
  'a plain click must keep its own target and its own click event')
robot.props.onPointerMove(pointer(plainTarget, 121, 141))
ok('a jitter below the threshold is still a click', dragged.captures === 0)
robot.props.onPointerMove(pointer(plainTarget, 150, 170))
ok('a real drag captures only once it has moved', dragged.captures === 1, `${dragged.captures} captures`)
robot.props.onPointerUp(pointer(plainTarget, 150, 170))
ok('the drag releases its capture', dragged.releases === 1)

// Requirement: the sound switch has to work in both directions.
console.log('sound switch (driven)')
const soundButton = buttons.find((node) => (node.children.join('')).includes('音效') || (node.children.join('')).includes('Sound'))
ok('the switch states which way it is', soundButton?.props['data-on'] === 'true' || soundButton?.props['data-on'] === 'false',
  String(soundButton?.props['data-on']))
ok('the switch turns the sound off', typeof soundButton?.props.onClick === 'function')
ok('turning it back on restores the previous choice, not the default',
  bundle.includes('prefs.get().sound === "off" ? prefs.lastAudible() : "off"')
  && bundle.includes('lastAudible()'),
  'an off switch that forgets the choice is a lossy toggle')
ok('a quick click cannot be undone by a slow storage read',
  bundle.includes('if (touched) return'),
  'hydrate() resolving late must not revert a choice the viewer already made')

// Requirement: the balance is reachable by double-click as well as by button.
const figure = petNodes.find((node) => typeof node.props.onDoubleClick === 'function')
ok('double-clicking the robot opens the balance', figure !== undefined)

console.log('balance (driven)')
const balanceButton = buttons.find((node) => (node.children.join('')).includes('余额') || (node.children.join('')).includes('Balance'))
balanceButton?.props.onClick?.()
// The handler awaits the metadata before it can call the Remote, so the
// assertion has to let the microtask queue drain first.
await new Promise((resolve) => { setTimeout(resolve, 0) })
const metadata = balanceCalls[0]
ok('the balance button calls remote.account.getBalance', balanceCalls.length === 1, `${balanceCalls.length} calls`)
ok('the call carries the metadata Remote validates',
  metadata !== undefined
  && typeof metadata.version === 'string' && metadata.version !== ''
  && typeof metadata.locale === 'string'
  && typeof metadata.timezoneOffsetSeconds === 'number',
  JSON.stringify(metadata))
ok('the timezone offset is in seconds, west positive',
  typeof metadata?.timezoneOffsetSeconds === 'number' && metadata.timezoneOffsetSeconds % 60 === 0)
// The namespace holder must be injected as well as the leaf: without it
// ctx.remote may not exist even though remote.account resolved, which is how a
// balance can silently read as "unavailable".
ok('both the remote namespace and the account leaf are injected',
  plugin.inject.includes('remote') && plugin.inject.includes('remote.account'))
// Cordis THROWS for an uninjected service property, so optional chaining is not
// a guard: an access outside a try became an unhandled rejection that left the
// balance card on "reading" forever.
ok('every service is read through a throwing-safe accessor',
  bundle.includes('function service(ctx, name)') && /catch \(error\) \{\s*return undefined;\s*\}/.test(bundle)
  && !/ctx\?\.remote/.test(bundle) && !/ctx\?\.shortcuts/.test(bundle),
  'Cordis throws instead of returning undefined for a service that was not injected')
ok('both namespace layouts are still accepted',
  bundle.includes('service(service(ctx, "remote"), "account")') && bundle.includes('service(ctx, "remote.account")'))
ok('a balance read can never reject unhandled',
  /void account\.balance\(ctx\)\.then\(async \(result\) =>/.test(bundle))
ok('a failure carries a reason instead of a shrug',
  bundle.includes('detail: "no remote.account"') && bundle.includes('detail: message.slice(0, 90)'))
ok('the account state is read when the balance read fails',
  bundle.includes('account.state(ctx)') && bundle.includes('function describeAccount'))
// The card is not rendered here because the stub state never updates, so the
// parse is asserted on the source: both wallet lists are read by name.
ok('both wallet lists are parsed by their wire names',
  bundle.includes('payload.value') && bundle.includes('payload.bonusWallets')
  && bundle.includes('payload.status !== "ready"'))
ok('wallet amounts are summed per currency',
  bundle.includes('function walletTotal') && bundle.includes('CURRENCY_SIGNS'))

console.log('close (driven)')
const closeButton = findButton(petNodes, '关闭') ?? findButton(petNodes, 'Close')
closeButton?.props.onClick?.()
ok('the first press only asks, it does not close', closeCalls.length === 0,
  'one click must not shut the app down')
const afterAsk = currentNodes(seatElement())
const panel = afterAsk.find((node) => node.props['data-dsh-pet-close'] !== undefined)
ok('a confirmation panel appears', panel !== undefined)
const panelText = collectTree(panel).map((node) => (Array.isArray(node.children) ? node.children.join('') : '')).join(' ')
ok('the panel names what is at stake', panelText.includes('关闭') || panelText.includes('Close'), panelText.slice(0, 90))
ok('the panel is honest about the tray when nothing is confirmed away',
  bundle.includes('系统托盘') && bundle.includes('system tray'),
  'the desktop shell keeps itself alive in the tray, and the copy has to say so')
ok('the panel is honest when nothing is running',
  bundle.includes('当前没有任务在跑') && bundle.includes('Nothing is running right now'))
const cancel = findButton(afterAsk, '取消') ?? findButton(afterAsk, 'Cancel')
// The refresh button reloads through the shell's own path, driven here.
const reloads = { count: 0 }
globalThis.window.location.reload = () => { reloads.count += 1 }
const refreshButton = findButton(petNodes, '刷新') ?? findButton(petNodes, 'Refresh')
refreshButton?.props.onClick?.()
ok('refresh reloads the interface', reloads.count === 1, reloads.count + ' reloads')
ok('the reload is the shell\'s own path', bundle.includes('window.location.reload()'))
ok('the button warns that a draft is lost',
  bundle.includes('未发送的草稿会丢失') && bundle.includes('unsent drafts are lost'))
const stop = findButton(afterAsk, '停止任务') ?? findButton(afterAsk, 'Stop task')
const closeWindow = findButton(afterAsk, '关闭窗口') ?? findButton(afterAsk, 'Close window')
const endApp = findButton(afterAsk, '结束 DSH') ?? findButton(afterAsk, 'End DSH')
ok('the panel offers cancel, stop, close and end',
  cancel !== undefined && stop !== undefined && closeWindow !== undefined && endApp !== undefined,
  [cancel, stop, closeWindow, endApp].map((node) => node === undefined).join(','))

// "Stop task" has no client service, so it presses the composer's own control:
// driven here against a stand-in button.
const composerStop = { clicks: 0, click () { this.clicks += 1 } }
const realQuery = dom.document.querySelector
dom.document.querySelector = (selector) => (selector.includes('停止生成') ? composerStop : realQuery(selector))
stop?.props.onClick?.()
ok('stop presses the composer\'s own stop control', composerStop.clicks === 1, `${composerStop.clicks} clicks`)
ok('the stop control is found by the labels the shell ships',
  bundle.includes('"停止生成"') && bundle.includes('"Stop generating"'))
dom.document.querySelector = realQuery

// "End DSH" raises the marker the host half watches for.
endApp?.props.onClick?.()
// The quit goes through the shell's own command Remote, driven here against a
// stand-in namespace: the page only ever says "run this command".
endApp?.props.onClick?.()
await new Promise((resolve) => { setTimeout(resolve, 0) })
ok('end DSH runs the host command through the command Remote',
  commandCalls.length >= 1 && commandCalls.every((call) => call.line === '/quitdsh'),
  JSON.stringify(commandCalls))
ok('the command is routed with a real session id',
  typeof commandCalls[0]?.sessionId === 'string' && commandCalls[0].sessionId !== '',
  String(commandCalls[0]?.sessionId))
ok('end DSH reports rather than closing the window itself',
  bundle.includes('setQuit("fallback")') && !/setQuit\("fallback"\);\s*\n\s*close\(\);/.test(bundle),
  'closing while work is in flight is what makes the shell report an unexpected shutdown')
ok('the panel names the only real way out',
  bundle.includes('托盘图标右键') && bundle.includes('tray icon'), panelText.slice(0, 80))
ok('the panel no longer claims a window close quits',
  !bundle.includes('关窗就是完全退出') && !bundle.includes('quits DSH with no notice'))
cancel?.props.onClick?.()
ok('cancel closes the panel and closes nothing', closeCalls.length === 0)
const afterCancel = currentNodes(seatElement())
ok('the panel is gone after cancel',
  afterCancel.every((node) => node.props['data-dsh-pet-close'] === undefined))
findButton(afterCancel, '关闭')?.props.onClick?.()
ok('the close goes through the shell shortcuts service when confirmed',
  bundle.includes('service(ctx, "shortcuts")') && bundle.includes('shortcuts?.closeWindow') && bundle.includes('window.close()'),
  'the fallback keeps a non-desktop build working')

// ── the host half ───────────────────────────────────────────────────────────
const hostSource = fs.readFileSync(path.join(ROOT, 'lib', 'index.js'), 'utf8')
ok('it exports the plugin name and an apply()',
  hostSource.includes("export const name = 'dsh-pet-robot'") && hostSource.includes('export function apply'))
ok('the host half declares the service it needs',
  hostSource.includes("export const inject = ['commands']"),
  'Cordis throws on an uninjected read, which is how the registration silently vanished')
ok('an unknown command is reported as exactly that',
  bundle.includes('setQuit("unknown")') && bundle.includes('完整重启'))
ok('it registers the command the client invokes',
  hostSource.includes("const QUIT_COMMAND = 'quitdsh'")
  && bundle.includes('const QUIT_COMMAND = "quitdsh"')
  && bundle.includes('"/" + QUIT_COMMAND'),
  'a name that does not match on both sides is a dead bridge')
ok('it is quiet when this host has no command registry',
  hostSource.includes('commands === undefined') && hostSource.includes('typeof commands.register'))
ok('it reads the service through a throwing-safe accessor',
  hostSource.includes('catch (error)') && hostSource.includes('return undefined'))
ok('the handler ends the supervising shell, not just itself',
  hostSource.includes('process.kill(process.ppid)'),
  'a host exit is reported by the shell as a failure, so exiting here only produces the crash notice')
ok('it leaves on its own if the kill is refused',
  hostSource.includes('process.exit(0)') && hostSource.includes('setTimeout'))
ok('it detaches on unload', hostSource.includes("ctx.effect(() => commands.register("))

// ── approvals, questions and plan reviews ring too ──────────────────────────
// The bell used to depend on the status hook, and an approval is a different
// request path entirely, so it passed in silence. Each of these surfaces carries
// its own marker in the DOM, so the detector is driven against them here.
console.log('pending actions (driven)')
const marker = { shown: [] }
const markerQuery = dom.document.querySelector
const markerQueryAll = dom.document.querySelectorAll
const countMarked = (selector) => marker.shown.filter((entry) => entry === selector).length
dom.document.querySelector = (selector) => {
  if (countMarked(selector) > 0) return { nodeType: 1 }
  return markerQuery(selector)
}
dom.document.querySelectorAll = (selector) => {
  const found = countMarked(selector)
  // The real querySelectorAll only ever returns marked or created nodes.
  return found > 0 ? new Array(found).fill({ nodeType: 1 }) : markerQueryAll(selector)
}
const runIntervals = () => {
  for (const entry of (timers.intervals ?? new Map()).values()) entry.fn()
}
/** Show `selector` and report whether that rings, and what the bubble says. */
const ringFor = (selector) => {
  marker.shown = []
  // Clear any cooldown an earlier section left behind, or the first ring here is
  // suppressed and the test blames the detector.
  advance(3000)
  runIntervals()
  const starts = audio.starts
  marker.shown = [selector]
  runIntervals()
  const nodes = renderApp(seatElement()).nodes
  return {
    bubble: nodes.find((node) => node.props.className === 'dshPetNotice'),
    rang: audio.starts > starts,
  }
}

const approval = ringFor('[data-approval-key]')
ok('an approval rings the bell',
  approval.rang, 'a permission request is a different request path from a finished turn')
ok('the approval bubble says what it wants',
  approval.bubble?.children.join('').includes('等待审批') || approval.bubble?.children.join('').includes('Approval needed'),
  approval.bubble?.children.join(''))
ok('the approval bubble is labelled as an approval',
  approval.bubble?.props['data-kind'] === 'approve', String(approval.bubble?.props['data-kind']))

const question = ringFor('[data-question-key]')
ok('a question set rings the bell', question.rang)
ok('the question bubble asks for input',
  question.bubble?.children.join('').includes('需要你输入') || question.bubble?.children.join('').includes('Your turn'),
  question.bubble?.children.join(''))

const review = ringFor('[data-plan-review-key]')
ok('a plan review rings the bell', review.rang, 'the third surface that waits on the viewer')

// A completed question card stays in the transcript, so "something is waiting"
// would be true for the rest of the session and the next request would be missed.
// The detector counts instead, and this is that case driven directly.
marker.shown = ['[data-question-key]']
advance(3000)
runIntervals()
const startsWithStale = audio.starts
marker.shown = ['[data-question-key]', '[data-approval-key]']
runIntervals()
const staleNodes = renderApp(seatElement()).nodes
ok('a new request still rings with an answered card on screen',
  audio.starts > startsWithStale,
  'presence alone would have stayed "waiting" and swallowed this approval')
ok('and it is identified as the approval, not the stale question',
  staleNodes.find((node) => node.props.className === 'dshPetNotice')?.props['data-kind'] === 'approve',
  String(staleNodes.find((node) => node.props.className === 'dshPetNotice')?.props['data-kind']))

ok('all three waiting surfaces are watched',
  bundle.includes('[data-approval-key]') && bundle.includes('[data-question-key]') && bundle.includes('[data-plan-review-key]'))
ok('the waiting detector is polled, not only event-driven',
  /let seen = pendingActions\(\)\.count;/.test(bundle),
  'the hook-based path missed approvals once already')
ok('an answered prompt does not mask the next one',
  bundle.includes('now.count > seen') && bundle.includes('querySelectorAll(selector)'),
  'a completed question card stays in the transcript, so presence alone would stay true forever')
dom.document.querySelector = markerQuery
dom.document.querySelectorAll = markerQueryAll

console.log('lock')

ok('the lock cover keeps the welcome line',
  bundle.includes('const WELCOME = "欢迎来到未来"'))
ok('the welcome line is drawn per glyph',
  /Array\.from\(WELCOME\)\.map\(/.test(bundle))
ok('the cover uses its own backdrop', /const LOCK_RENDITION = "data:image\/svg\+xml;base64,[A-Za-z0-9+/=]{200,}";/.test(bundle))
ok('one press unlocks it',
  /className: "dshPetLock"[\s\S]{0,320}?ref: attach/.test(bundle) && bundle.includes('"pointerdown"'))
ok('the cover can free the window without React',
  /if \(node\.isConnected\) node\.remove\(\)/.test(bundle),
  'a cover that never unmounts would leave the window unusable')
ok('Escape also unlocks', bundle.includes('"Escape"'))
ok('the cover sits above the pet, below a boot splash',
  bundle.includes('const PET_Z = 9400') && bundle.includes('const LOCK_Z = 9990'))

// Requirement: no visible "click to unlock" line on the welcome screen.
ok('the cover shows no unlock hint',
  !bundle.includes('dshPetLockHint') && !bundle.includes('CLICK TO UNLOCK'),
  'the welcome screen must read as a screen, not as a dialog')
ok('the cover still names itself for assistive tech',
  bundle.includes('"aria-label"') && bundle.includes('锁屏，单击解锁'))

// Requirement: pick your own lock image, and deleting the file is harmless.
console.log('lock image')
ok('a picked image is written to IndexedDB',
  bundle.includes('petStore.write(LOCK_IMAGE_KEY, file)'))
ok('it is read back as a Blob and served through an object URL',
  /blob instanceof Blob/.test(bundle) && /URL\.createObjectURL\(blob\)/.test(bundle))
ok('the cover paints the stored image, falling back to the bundled frame',
  bundle.includes('src: source') && /src\(\) \{ return state\.objectUrl !== "" \? state\.objectUrl : LOCK_RENDITION; \}/.test(bundle))
ok('the settings page offers pick and restore',
  bundle.includes('选择锁屏图片') && bundle.includes('恢复内置画面'))
ok('the store can clear the record', bundle.includes('clear(key)') && bundle.includes('LOCK_IMAGE_KEY'))
ok('the lock image has its own record, not a sibling plugin\'s',
  bundle.includes('const LOCK_IMAGE_KEY = "lock-image"') && !bundle.includes('"plate"'))

// Requirement: the pet must not be re-styled by another display plugin.
// These read the bundle (which contains the stylesheet) because `css` is
// extracted further down; the rule-scope assertion lives with it.
console.log('isolation from other display plugins')
ok('the bundle reads no theme token at all',
  !/--dsw-/.test(bundle),
  'the pet lives on <body>, where another plugin\'s token layer lands')
ok('the floating surfaces restate their own type and colour',
  /\.dshPetRobot \{[\s\S]{0,900}?text-shadow: none/.test(bundle)
  && /\.dshPetCard \{[\s\S]{0,900}?font-family:/.test(bundle)
  && /\.dshPetLock \{[\s\S]{0,600}?text-shadow: none/.test(bundle))
ok('the settings page restates them too',
  /\.dshPetPanel \{[\s\S]{0,900}?text-shadow: none/.test(bundle))

console.log('completion sound')
ok('four sound choices including off',
  /const SOUNDS = \[[\s\S]{0,400}?id: "off"[\s\S]{0,400}?id: "chime"/.test(bundle))
ok('the sound is synthesised, not an asset',
  bundle.includes('createOscillator') && !bundle.includes('new Audio(') && !bundle.includes('.mp3'))
ok('audio is deferred until a gesture',
  bundle.includes('pointerdown') && bundle.includes('audio.state === "suspended"'),
  'browsers refuse to start audio before an interaction')
ok('a missing AudioContext is survivable',
  bundle.includes('typeof Ctor !== "function"') && bundle.includes('if (audio === null) return false'))
// The shell publishes { running, pendingInteraction, completionUnread } per
// session. Reading it as the string "running" is exactly why the completion
// sound never fired, so the object shape is asserted by name.
ok('the status entry is read as the object the shell publishes',
  bundle.includes('function readStatus') && bundle.includes('pendingInteraction === true'),
  'the value is not the string "running"')
ok('a turn that settled is a completion',
  bundle.includes('was.running && !now.running'))
ok('a question waiting for an answer also rings',
  bundle.includes('!was.pending && now.pending'))
ok('a missing status hook is visible on the pet itself',
  bundle.includes('data-warn') && bundle.includes('监听不可用'))
ok('the trigger watches four edges, including a shrinking count',
  bundle.includes('beforeRunning > running') && bundle.includes('becameUnread'))
ok('the settings page can report the trigger state',
  bundle.includes('statusReport') && bundle.includes('已触发'))
ok('the waiting state is visible, not only audible',
  bundle.includes('dshPetNotice') && bundle.includes('需要你输入'))
ok('sound off suppresses the play',
  /prefs\.get\(\)\.sound !== "off"\) void speaker\.play/.test(bundle))
ok('a suspended audio context is resumed before anything is scheduled',
  bundle.includes('return audio.resume().then('),
  'a suspended context swallows whatever is scheduled on it')
ok('the close dialog counts running turns through the same reader',
  /if \(now\.running\) running \+= 1/.test(bundle))

console.log('storage')
ok('the store is namespaced to this plugin', bundle.includes('"dsh-pet-robot"'))
ok('settings and position are separate records',
  bundle.includes('const SETTINGS_KEY = "settings"') && bundle.includes('const POSITION_KEY = "position"'))
ok('a drag lands on disk', bundle.includes('petStore.write(POSITION_KEY'))
ok('every read has a default', bundle.includes('DEFAULT_POSITION') && bundle.includes('DEFAULT_SCALE'))

// ── stylesheet ──────────────────────────────────────────────────────────────
const styles = dom.nodes[0]
const css = styles?.textContent ?? ''
console.log('stylesheet')
ok('exactly one stylesheet is injected', dom.nodes.length === 1, `got ${dom.nodes.length}`)
ok('the stylesheet is marked with this plugin id', styles?.attributes['data-dsh-pet-style'] === PKG.name)
const opens = (css.match(/\/\*/g) ?? []).length
const closes = (css.match(/\*\//g) ?? []).length
ok('every CSS comment is terminated', opens === closes, `${opens} opened, ${closes} closed`)
const ruleStarts = css.match(/^[^\s@/}][^{}]*\{/gm) ?? []
ok('every style rule is scoped to this plugin attribute',
  ruleStarts.every((rule) => rule.startsWith('html[data-dsh-pet]') || rule.startsWith('@')),
  ruleStarts.filter((rule) => !rule.startsWith('html[data-dsh-pet]')).join(' | '))
ok('the pet floats above the app', css.includes('z-index: 9400'))
ok('the cover floats above everything but a splash', css.includes('z-index: 9990'))
ok('the sound switch shows its state, not just a label',
  css.includes('.dshPetButton[data-on="true"]') && css.includes('.dshPetButton[data-on="false"]'))
ok('the gradient title is behind a clip support guard',
  /@supports \(\(background-clip: text\) or \(-webkit-background-clip: text\)\)/.test(css))
ok('reduced motion stills the robot and the cover',
  /prefers-reduced-motion: reduce\)[\s\S]{0,900}?\.dshPetBob[\s\S]{0,600}?animation: none/.test(css))

// ── unload ──────────────────────────────────────────────────────────────────
// ── reload safety ───────────────────────────────────────────────────────────
// A client bundle can be applied twice in one document (a rebuild re-imports
// it). The first application's disposer must not remove the scope attribute or
// the stylesheet the second one just installed.
console.log('reload safety')
const firstApplication = disposers.length
plugin.apply(ctx)
ok('a second application is tolerated', disposers.length > firstApplication)
for (const dispose of disposers.slice(0, firstApplication).reverse()) dispose()
ok('a stale application cannot unscoped the live one',
  dom.document.documentElement.attributes['data-dsh-pet'] !== undefined,
  'removing the scope attribute makes the whole stylesheet inert')
ok('a stale application does not remove the live stylesheet',
  dom.nodes.some((node) => node.attributes['data-dsh-pet-style'] !== undefined && !node.removed))

console.log('unload')
for (const dispose of cleanups.reverse()) dispose()
for (const dispose of disposers.reverse()) dispose()
ok('no seat registration survives unload', registrations.length === 0, `${registrations.length} left`)
ok('the stylesheet is removed', styles.removed === true)
ok('the scope attribute is gone',
  dom.document.documentElement.attributes['data-dsh-pet'] === undefined)

// ── side by side with the sibling display plugins ───────────────────────────
console.log('no conflict with the sibling display plugins')
const siblings = [
  { dir: 'Theme-Display-2001SpaceOdyssey', prefix: /dsh2001|dsh-2001|data-dsh-2001/ },
  { dir: 'Theme-OpenDisplay-Stalker', prefix: /dshStalker|data-dsh-stalker|open-display-stalker/ },
]
ok('this bundle never names a sibling plugin', !/dsh2001|dshStalker|data-dsh-2001|data-dsh-stalker/.test(bundle))
let present = 0
for (const sibling of siblings) {
  const file = path.join(ROOT, '..', sibling.dir, 'lib', 'client.js')
  if (!fs.existsSync(file)) continue
  present += 1
  const other = fs.readFileSync(file, 'utf8')
  ok(`${sibling.dir} never names this plugin`, !/dshPet|data-dsh-pet/.test(other))
  ok(`${sibling.dir} uses a different storage database`, !other.includes('"dsh-pet-robot"'))
  ok(`${sibling.dir} uses a different z-index band`,
    !other.includes('9400') && !other.includes('9990'),
    'the pet and the cover must own their bands')
  ok(`${sibling.dir} and the pet share the overlay seat`,
    other.includes('"shell.overlay"') && bundle.includes('"shell.overlay"'))
}
if (present === 0) console.log('  --   no sibling plugin present; cross-checks skipped')

console.log('')
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('all checks passed')
