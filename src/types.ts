export interface CheckerOptions {
  filters?: string[]
  update: boolean
  latest: boolean
  prerelease: boolean
  depsTypes: Set<DependencyType>
  package: string
  registry: string
  proxy?: string
}

export const DependencyTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const

export type DependencyType = typeof DependencyTypes[number]

export type CheckStatusError = 'network' | 'semverInvalid' | 'semverComplex'

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

export interface DependencyUpdatable extends Omit<Dependency, 'status'> {
  newerColored?: string
  latestColored?: string
}

export type CheckErrors = Record<CheckStatusError, string[]>
