import type { PackageJson } from 'type-fest'
import depsCheck from './deps-check.js'
import depsUpdate from './deps-update.js'
import depsDisplay from './deps-display.js'
import { DependencyTypes } from './types.js'
import type { CheckerOptions, DependencyType, Dependency } from './types.js'

const collectDeps = (
  record: Record<string, string>,
  type: DependencyType,
  filters: string[] = [],
): Dependency[] => {
  let entries = Object.entries(record)

  if (filters.length) {
    const regexps = filters.map((filter) => new RegExp(`^${filter.replaceAll('*', '.*')}$`))

    entries = entries.filter(([name, _]) => {
      for (const regexp of regexps) {
        if (regexp.test(name)) {
          return true
        }
      }
      return false
    })
  }

  return entries.flatMap(([name, version]) => ({
    name,
    type,
    current: version,
    status: 'ok',
  }))
}

const check = async (pkgData: string, pkg: PackageJson, options: CheckerOptions) => {
  const deps: Dependency[] = DependencyTypes.flatMap((type) => {
    const key = type === 'dep' ? 'dependencies' : (type + 'Dependencies')
    const deps = pkg[key] as Record<string, string>
    return pkg[key] ? collectDeps(deps, type, options.filters) : []
  })

  if (!deps.length) {
    console.log('No dependencies.')
    return
  }

  deps.sort((a, b) => a.name.localeCompare(b.name))

  const checked = await depsCheck(deps)

  const result = depsUpdate(pkgData, checked, options)
  if (result) {
    const { toUpdate, chars, errors } = result
    depsDisplay(toUpdate, chars, errors, options)
  }
}

export default check
