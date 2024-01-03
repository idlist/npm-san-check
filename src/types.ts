export interface CheckerOptions {
  filters?: string[]
  update: boolean
  latest: boolean
}

export type DependencyType = 'dep' | 'dev' | 'peer' | 'optional'

export type CheckStatusError = 'network' | 'semver'

export type CheckStatus = 'ok' | CheckStatusError

export interface Dependency {
  name: string
  type: DependencyType
  current: string
  status: CheckStatus
  newer?: string
  latest?: string
}

export type DependencyChecked =
  | { status: 'ok' } & Required<Dependency>
  | { status: CheckStatusError } & Dependency

export interface DependencyToUpdate extends Omit<Dependency, 'status'> {
  newerColored?: string
  latestColored?: string
}

export type CheckErrors = Record<CheckStatusError, string[]>
