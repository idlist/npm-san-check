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
}

if (args._) {
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

let pkgData
try {
  pkgData = await readFile(`${cwd()}/package.json`, { encoding: 'utf8' })
} catch {
  print(`${c.red('Error:')} There isn\'t a ${c.green('package.json')} file under this directory.`)
  exit(1)
}

let pkg
try {
  pkg = JSON.parse(pkgData)
} catch {
  print(`${c.red('Error:')} Failed to parse ${c.green('package.json')}.`)
  exit(1)
}

check(pkgData, pkg, options)
