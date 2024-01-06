export interface CheckerOptions {
  filters?: string[]
  update: boolean
  latest: boolean
  prerelease: boolean
  project: string
  registry: string
}

export const DependencyTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const

export type DependencyType = typeof DependencyTypes[number]

export type CheckStatusError = 'network' | 'semver'

export type CheckStatus = 'ok' | CheckStatusError

export interface Dependency {
  name: string
  type: DependencyType
  currentRaw: string
  current: string
  status: CheckStatus
  newer?: string
  latest?: string
}

export type DependencyChecked = Dependency

export interface DependencyUpdated extends Omit<Dependency, 'status'> {
  newerColored?: string
  latestColored?: string
}

export type CheckErrors = Record<CheckStatusError, string[]>
