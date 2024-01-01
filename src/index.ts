import type { PackageJson } from 'type-fest'
import depsCheck from './deps-check.js'
import depsUpdate from './deps-update.js'
import type { CheckerOptions, DependencyType, Dependency } from './types.js'

const DependencyTypes: DependencyType[] = ['dep', 'dev', 'peer', 'optional']

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
  const checked = await depsCheck(deps)
  depsUpdate(json, checked, options)
}

export default check
