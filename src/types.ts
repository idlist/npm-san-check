import type { SemVer } from 'verkit'

export const dependencyType = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
] as const

export type DependencyType = typeof dependencyType[number]

export const versionProviders = [
  'npm',
  'jsd',
] as const

export type VersionProvider = typeof versionProviders[number]

export interface SanCheckOptions {
  filters: string[]
  update: boolean
  checkLatest: boolean
  checkPrerelease: boolean
  checkTypes: Set<DependencyType>
  file: string
  provider: 'npm' | 'jsd'
  registry: string
}

export interface Dependency {
  name: string
  type: DependencyType
  version: string
}

export interface CheckResult {
  semver: 'ok' | 'invalid' | 'complex'
  network: 'ok' | 'failed'
  newer?: SemVer
  latest?: SemVer
}

export interface UpdateResult {
  updatableCount: number
}
