#!/usr/bin/env node

import check from '@/index.js'
import print from '@/print.js'
import type { CheckerOptions } from '@/types.js'
import { green } from 'colorette'
import minimist from 'minimist'
import { readFile } from 'node:fs/promises'
import { argv, cwd, exit } from 'node:process'
import { env } from 'node:process'
import type { PackageJson } from 'type-fest'

const args = minimist(argv.slice(2))

const options: CheckerOptions = {
  update: false,
  latest: false,
  prerelease: false,
  depsTypes: new Set(['dependencies', 'devDependencies']),
  package: 'package.json',
  registry: 'https://registry.npmjs.org/',
}

if (env.HTTP_PROXY) {
  options.proxy = env.HTTP_PROXY
}
if (env.HTTPS_PROXY) {
  options.proxy = env.HTTPS_PROXY
}

if (args._.length) {
  options.filters = args._
}
if (args.u || args.update) {
  options.update = true
}
if (args.l || args.latest) {
  options.latest = true
}
if (args.I || args.deps === false) {
  options.depsTypes.delete('dependencies')
}
if (args.D || args['dev-deps'] === false) {
  options.depsTypes.delete('devDependencies')
}
if (args.peer) {
  options.depsTypes.add('peerDependencies')
}
if (args.opt) {
  options.depsTypes.add('optionalDependencies')
}
if (args.pre || args.prerelease) {
  options.prerelease = true
}
if (args.p || args.package) {
  options.package = (args.p ?? args.package) as string
}
if (args.proxy) {
  options.proxy = args.proxy as string
}
if (args.r || args.registry) {
  options.registry = (args.r ?? args.registry) as string
}

let pkgData
try {
  pkgData = await readFile(`${cwd()}/${options.package}`, { encoding: 'utf-8' })
} catch {
  print.error(`there isn't a ${green(options.package)} file under this directory.`)
  exit(1)
}

let pkg: PackageJson
try {
  pkg = JSON.parse(pkgData) as PackageJson
} catch {
  print.error(`failed to parse ${green(options.package)}.`)
  exit(1)
}

await check(pkgData, pkg, options)
