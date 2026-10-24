#!/usr/bin/env node

import { sanCheck } from '@src/index'
import { type SanCheckOptions, type VersionProvider, versionProviders } from '@src/types'
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
  file: 'package.json',
  provider: 'npm',
  registry: 'https://registry.npmjs.org',
}

const possibleVersionProviders: Set<string> = new Set(versionProviders)

function isVersionProvider(provider: string): provider is VersionProvider {
  return possibleVersionProviders.has(provider)
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
if (args.f || args.file) {
  options.file = String(args.f || args.file)
}
if (args.p || args.provider) {
  const provider: string = args.p || args.provider

  if (isVersionProvider(provider)) {
    options.provider = provider
  }
}
if (args.r || args.registry) {
  options.registry = String(args.r || args.registry)
}

sanCheck(options)
