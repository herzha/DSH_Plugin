#!/usr/bin/env node
/**
 * Pack every plugin listed in plugins.json into a single installable .tgz at
 * the repository root.
 *
 *   node tools/pack-all.mjs            pack every plugin
 *   node tools/pack-all.mjs --check    fail if a root .tgz is missing or stale
 *   node tools/pack-all.mjs <dir>      pack just one plugin folder
 *
 * The artifact is named after the plugin's full display name
 * (DSH-theme-display-2001SpaceOdyssey.tgz) instead of whatever npm pack
 * produces, so the raw.githubusercontent.com link carries the exact string
 * people search for.
 *
 * `--check` matters because the .tgz is committed: a stale artifact would
 * silently serve old code to everyone installing by direct link. It compares
 * the sha256 of every file inside the tarball against the working tree.
 *
 * npm is invoked as its JS CLI through the running node: spawning npm.cmd
 * directly is rejected (EINVAL) on hardened Node builds, and passing args
 * through a shell is exactly what that hardening guards against.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins.json'), 'utf8'))

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const only = args.find((arg) => !arg.startsWith('--'))

const plugins = manifest.plugins.filter((entry) => only === undefined || entry.dir === only)
if (plugins.length === 0) {
  console.error(`no plugin in plugins.json matched ${only ?? '(all)'}`)
  process.exit(1)
}

/** Locate npm's JS CLI next to the running node, so no .cmd/shell is involved. */
const npmCli = [
  path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
].find((candidate) => fs.existsSync(candidate))

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

/** Read a gzipped tar as a Map of member path (package/ stripped) -> sha256. */
function tarEntries (file) {
  const tar = zlib.gunzipSync(fs.readFileSync(file))
  const entries = new Map()
  for (let offset = 0; offset + 512 <= tar.length;) {
    const rawName = tar.subarray(offset, offset + 100).toString('utf8').replace(/\0.*$/, '')
    if (rawName === '') break
    const sizeText = tar.subarray(offset + 124, offset + 136).toString('utf8').replace(/\0.*$/, '').trim()
    const size = parseInt(sizeText, 8) || 0
    const body = tar.subarray(offset + 512, offset + 512 + size)
    entries.set(rawName.replace(/^package\//, ''), sha256(body))
    offset += 512 + Math.ceil(size / 512) * 512
  }
  return entries
}

let failures = 0

for (const plugin of plugins) {
  const dir = path.join(ROOT, plugin.dir)
  const artifact = path.join(ROOT, plugin.artifact)

  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    console.error(`✗ ${plugin.dir}: no package.json`)
    failures += 1
    continue
  }

  if (checkOnly) {
    if (!fs.existsSync(artifact)) {
      console.error(`✗ ${plugin.artifact}: missing — run node tools/pack-all.mjs`)
      failures += 1
      continue
    }
    const entries = tarEntries(artifact)
    const stale = []
    for (const [rel, hash] of entries) {
      const source = path.join(dir, rel)
      if (!fs.existsSync(source)) stale.push(`${rel} (gone from source)`)
      else if (sha256(fs.readFileSync(source)) !== hash) stale.push(rel)
    }
    if (stale.length > 0) {
      console.error(`✗ ${plugin.artifact}: stale — ${stale.join(', ')}`)
      failures += 1
    } else {
      console.log(`✓ ${plugin.artifact} matches ${plugin.dir} (${entries.size} files)`)
    }
    continue
  }

  const staging = fs.mkdtempSync(path.join(ROOT, '.pack-'))
  try {
    const packArgs = ['pack', dir, '--pack-destination', staging, '--loglevel=error']
    const options = { stdio: ['ignore', 'ignore', 'inherit'] }
    if (npmCli !== undefined) execFileSync(process.execPath, [npmCli, ...packArgs], options)
    else execFileSync('npm.cmd', packArgs, { ...options, shell: true })

    const produced = fs.readdirSync(staging).filter((name) => name.endsWith('.tgz'))
    if (produced.length !== 1) throw new Error(`npm pack produced ${produced.length} archives`)
    fs.rmSync(artifact, { force: true })
    fs.renameSync(path.join(staging, produced[0]), artifact)
    console.log(`✓ ${plugin.artifact}  ${(fs.statSync(artifact).size / 1024).toFixed(1)} KiB`)
  } finally {
    fs.rmSync(staging, { recursive: true, force: true })
  }
}

if (failures > 0) process.exit(1)
