#!/usr/bin/env node

import { argv, cwd, exit } from 'node:process'
import { readFile } from 'node:fs/promises'
import minimist from 'minimist'
import c from 'kleur'
import check from '@/index.js'
import type { CheckerOptions } from '@/types.js'

const args = minimist(argv.slice(2))

const options: CheckerOptions = {
  update: false,
  latest: false,
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

let rawJson
try {
  rawJson = await readFile(`${cwd()}/package.json`, { encoding: 'utf8' })
} catch {
  console.error(`${c.red('Error:')} There isn\'t a ${c.green('package.json')} file under this directory.`)
  exit(1)
}

let json
try {
  json = JSON.parse(rawJson)
} catch {
  console.error(`${c.red('Error:')} Failed to parse ${c.green('package.json')}.`)
}

check(json, options)
