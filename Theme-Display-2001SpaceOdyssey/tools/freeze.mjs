#!/usr/bin/env node
/**
 * Freeze this plugin into a DSH profile.
 *
 * A dev install is a `file:` link (or hard link) to this working copy, so the
 * profile breaks the moment the folder moves. Freezing instead packs the
 * package, copies the tarball INSIDE the profile, and leaves pnpm to extract
 * its own copy from the store — after that nothing in the profile points back
 * here.
 *
 *   node tools/freeze.mjs                 # pack, vendor into the desktop profile
 *   node tools/freeze.mjs --profile web   # another profile
 *   node tools/freeze.mjs --dry-run       # show what would happen
 *
 * The script does the mechanical half (pack + vendor). pnpm still has to run
 * inside the profile, which the running app owns; the exact command to finish
 * is printed, and DSH's own plugin manager performs the same step when a
 * package is installed from the Plugins settings page.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const TARBALL = 'DSH-theme-display-2001SpaceOdyssey.tgz'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback
}
const dryRun = args.includes('--dry-run')

const home = flag('--home', process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh'))
const profile = flag('--profile', 'desktop')
const profileDir = path.join(home, 'profiles', profile)
if (!fs.existsSync(profileDir)) {
  console.error(`no such profile: ${profileDir}`)
  process.exit(1)
}

const vendorDir = path.join(profileDir, 'vendor')
const vendoredTarball = path.join(vendorDir, TARBALL)

console.log(`package   ${PKG.name}@${PKG.version}`)
console.log(`profile   ${profileDir}`)
console.log(`vendor    ${vendoredTarball}`)
if (dryRun) {
  console.log('\n--dry-run: nothing was written')
  process.exit(0)
}

// 1. Pack into the profile's vendor dir. `npm pack` names the file after the
//    package, so it is renamed to the single-file name this project uses.
//    npm is invoked as its JS CLI through the running node: spawning npm.cmd
//    directly is rejected (EINVAL) on hardened Node builds, and passing args
//    through a shell is exactly what that hardening guards against.
const runPack = () => {
  const binDir = path.dirname(process.execPath)
  const candidates = [
    path.join(binDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(binDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ]
  const cli = candidates.find((candidate) => fs.existsSync(candidate))
  const args = ['pack', ROOT, '--pack-destination', vendorDir]
  const options = { stdio: ['ignore', 'inherit', 'inherit'] }
  if (cli !== undefined) execFileSync(process.execPath, [cli, ...args], options)
  else execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { ...options, shell: process.platform === 'win32' })
}
runPack()
const packed = path.join(vendorDir, `${PKG.name}-${PKG.version}.tgz`)
if (!fs.existsSync(packed)) {
  console.error(`npm pack did not produce ${packed}`)
  process.exit(1)
}
// Rename BEFORE tidying: the tidy pass removes anything that is not the
// vendored artifact, and it would otherwise delete the fresh pack.
fs.rmSync(vendoredTarball, { force: true })
fs.renameSync(packed, vendoredTarball)
for (const name of fs.readdirSync(vendorDir)) {
  if (name.endsWith('.tgz') && name !== TARBALL) fs.rmSync(path.join(vendorDir, name), { force: true })
}
console.log(`\nvendored ${(fs.statSync(vendoredTarball).size / 1024).toFixed(1)} KiB`)

// 2. Point the profile at the vendored tarball. A stale lockfile entry would
//    keep the old resolution, and pnpm would report "already up to date".
const manifestPath = path.join(profileDir, 'package.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
manifest.dependencies = manifest.dependencies ?? {}
manifest.dependencies[PKG.name] = `file:vendor/${TARBALL}`
if (!manifest.dsh.profile.bundles.includes(PKG.name)) manifest.dsh.profile.bundles.push(PKG.name)
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
fs.rmSync(path.join(profileDir, 'pnpm-lock.yaml'), { force: true })
console.log('package.json points at the vendored tarball; lockfile cleared for a clean resolve')

console.log('\nnext, let the profile install it (the running app owns pnpm):')
console.log(`  dsh plugin --profile ${profile} add file:vendor/${TARBALL}`)
console.log('  — or install it from the tarball in the meantime:')
console.log(`  dsh plugin --profile ${profile} add "${path.join(ROOT, TARBALL)}"`)
console.log('\nthen restart the app so the new resolution is picked up.')
