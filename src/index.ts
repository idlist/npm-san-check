import type { PackageJson } from 'type-fest'
import checkDeps from './check-deps.js'
import displayDeps from './display-deps.js'
import type { CheckerOptions } from './types.js'

export type DependencyType = 'dep' | 'dev' | 'peer' | 'optional'
const DependencyTypes: DependencyType[] = ['dep', 'dev', 'peer', 'optional']

export type CheckStatusError = 'network' | 'semver'
type CheckStatus = 'ok' | CheckStatusError

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

const collectDependency = (
  record: Record<string, string>,
  type: DependencyType,
): Dependency[] => Object.entries(record).flatMap(([name, version]) => ({
  name,
  type,
  current: version,
  status: 'ok',
}))

const check = async (json: PackageJson, options: CheckerOptions) => {
  const deps: Dependency[] = DependencyTypes.flatMap((type) => {
    const key = type === 'dep' ? 'dependencies' : (type + 'Dependencies')
    return json[key] ? collectDependency(json[key] as Record<string, string>, type) : []
  })

  if (!deps.length) {
    console.log('No dependencies.')
    return
  }

  deps.sort((a, b) => a.name.localeCompare(b.name))
  const checked = await checkDeps(deps)
  displayDeps(checked, options)
}

export default check
