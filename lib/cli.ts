#!/usr/bin/env node

import { argv, cwd, exit } from 'node:process'
import { readFile } from 'node:fs/promises'
import minimist from 'minimist'
import c from 'kleur'
import check from '@/index.js'
import print from '@/print.js'
import type { CheckerOptions } from '@/types.js'

const args = minimist(argv.slice(2))

const options: CheckerOptions = {
  update: false,
  latest: false,
  prerelease: false,
  project: 'package.json',
  registry: 'https://registry.npmjs.org/',
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
if (args.pre || args.prerelease) {
  options.prerelease = true
}
if (args.p || args.project) {
  options.project = args.p ?? args.project
}
if (args.r || args.registry) {
  options.registry = args.r ?? args.registry
}

let pkgData
try {
  pkgData = await readFile(`${cwd()}/${options.project}`, { encoding: 'utf8' })
} catch {
  print.error(`there isn\'t a ${c.green(options.project)} file under this directory.`)
  exit(1)
}

let pkg
try {
  pkg = JSON.parse(pkgData)
} catch {
  print.error(`failed to parse ${c.green(options.project)}.`)
  exit(1)
}

check(pkgData, pkg, options)
