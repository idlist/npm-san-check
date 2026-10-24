import type { Verange } from '@src/veranger'
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
  versionClean: string
}

export type SemVerIssue = 'invalid' | 'complex'

export type NetworkIssue = 'no-provider' | 'failed' | 'invalid'

export interface UpdateTarget {
  latest: SemVer
  newer?: SemVer
}

export interface NetworkBadResult {
  network: NetworkIssue
}

export interface NetworkOkResult {
  network: 'ok'
  target: UpdateTarget
}

export type CheckResult = NetworkBadResult | NetworkOkResult

export interface UpdatePlan {
  toNewer: Record<string, Verange>
  toLatest: Record<string, Verange>
}
