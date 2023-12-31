import type { PackageJson } from 'type-fest'
import checkDeps from './check-deps.js'
import displayDeps from './display-deps.js'
import type { CheckerOptions } from './types.js'

type DependencyType = 'dep' | 'dev' | 'peer' | 'optional'
const DependencyTypes: DependencyType[] = ['dep', 'dev', 'peer', 'optional']

type CheckStatus = 'ok' | 'network' | 'semver'

export interface Dependency {
  name: string
  type: DependencyType
  current: string
  newer?: string
  latest?: string
  status: CheckStatus
}

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

  const checked = await checkDeps(deps)
  displayDeps(checked, options)
}

export default check
