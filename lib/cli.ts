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
  force: false,
}

if (args.u || args.update) {
  options.update = true
}
if (args.f || args.force) {
  options.force = true
}

let rawJson
try {
  rawJson = await readFile(`${cwd()}/package.json`, { encoding: 'utf8' })
} catch {
  console.error(c.red('Error:'), 'There isn\'t a "package.json" file under current directory.')
  exit(1)
}

let json
try {
  json = JSON.parse(rawJson)
} catch {
  console.log(c.red('Error:'), 'Failed to parse "package.json".')
}

check(json, options)
