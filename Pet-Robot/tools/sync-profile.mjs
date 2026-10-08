#!/usr/bin/env node
/**
 * Copy this package into the installed profile copy, writing in place.
 *
 * This is the DEV-mode tool: it only makes sense while the profile depends on
 * the working copy (`file:` pointing at this folder), where the plugin manager
 * installs hard links. A plain overwrite of a linked file fails ("in use by
 * another process") and a delete-plus-create silently leaves the profile with a
 * stale orphan, so the bytes are written in place to keep the existing link.
 *
 * A FROZEN profile (one installed from a .tgz) is refused on purpose: its files
 * come from pnpm's store and the lockfile records an integrity hash, so writing
 * into it would leave the profile lying about what it has installed. Rebuild
 * and reinstall instead — see tools/freeze.mjs.
 *
 *   node tools/sync-profile.mjs [--profile desktop] [--home C:\Users\me\.dsh]
 *
 * Run it after editing lib/, assets/ or cordis.patch.yml. If the client bundle
 * content changes, the host has to re-serve it: reload the page, and restart the
 * app if the pet does not appear.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback
}

const home = flag('--home', process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh'))
const profile = flag('--profile', 'desktop')
const profileDir = path.join(home, 'profiles', profile)
const target = path.join(profileDir, 'node_modules', PKG.name)

if (!fs.existsSync(target)) {
  console.error(`not installed in profile "${profile}": ${target}`)
  console.error(`install it first, e.g.  dsh plugin --profile ${profile} add file:${ROOT}`)
  process.exit(1)
}

// Refuse to poke a frozen install: its integrity is recorded in the lockfile.
const manifestPath = path.join(profileDir, 'package.json')
try {
  const spec = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))?.dependencies?.[PKG.name]
  if (typeof spec === 'string' && spec.endsWith('.tgz')) {
    console.error(`profile "${profile}" is a FROZEN install (${spec}).`)
    console.error('this tool only syncs a dev install that points at this folder.')
    console.error('to publish a change:  node tools/freeze.mjs   (then reinstall + restart)')
    process.exit(1)
  }
} catch {
  // A missing or unreadable manifest is not this tool's problem.
}

const ENTRIES = ['package.json', 'cordis.patch.yml', 'README.md', 'lib', 'assets', 'tools']

function collect (entry, out = []) {
  const abs = path.join(ROOT, entry)
  if (!fs.existsSync(abs)) return out
  const stat = fs.statSync(abs)
  if (stat.isFile()) {
    out.push(path.relative(ROOT, abs))
    return out
  }
  for (const name of fs.readdirSync(abs)) collect(path.join(entry, name), out)
  return out
}

let written = 0
let unchanged = 0
for (const rel of ENTRIES.flatMap((entry) => collect(entry))) {
  const from = path.join(ROOT, rel)
  const to = path.join(target, rel)
  const bytes = fs.readFileSync(from)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  const same = fs.existsSync(to) && Buffer.compare(fs.readFileSync(to), bytes) === 0
  // In-place write: never unlink, so a hard-linked destination keeps its identity.
  fs.writeFileSync(to, bytes)
  if (same) unchanged++
  else {
    written++
    console.log(`  updated ${rel}`)
  }
}

console.log(`\n${PKG.name} -> ${target}`)
console.log(`${written} file(s) written, ${unchanged} already current`)
if (written > 0) console.log('reload the page; restart the app if the pet does not appear')
