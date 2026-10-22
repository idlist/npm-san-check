#!/usr/bin/env node

import { sanCheck } from '@src/index'
import { SanCheckOptions } from '@src/types'
import minimist from 'minimist'
import { argv, env } from 'node:process'

env.NODE_USE_ENV_PROXY = '1'
const args = minimist(argv.slice(2))

const options: SanCheckOptions = {
  filters: [],
  update: false,
  checkLatest: false,
  checkPrerelease: false,
  checkTypes: new Set(['dependencies', 'devDependencies']),
  package: 'package.json',
  registry: 'https://registry.npmjs.org/',
}

if (args._.length) {
  options.filters = args._
}
if (args.u || args.update) {
  options.update = true
}
if (args.l || args.latest) {
  options.checkLatest = true
}
if (args.pre || args.prerelease) {
  options.checkPrerelease = true
}
if (args.deps === false) {
  options.checkTypes.delete('dependencies')
}
if (args['dev-deps'] === false) {
  options.checkTypes.delete('devDependencies')
}
if (args.opt) {
  options.checkTypes.add('optionalDependencies')
}
if (args.p || args.package) {
  options.package = String(args.p || args.package)
}
if (args.r || args.registry) {
  options.registry = String(args.r || args.registry)
}

sanCheck(options)
