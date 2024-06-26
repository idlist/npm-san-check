import type { PackageJson } from 'type-fest'
import print from '@/print.js'
import checkDependencies from '@/deps-check.js'
import updateDependencies from '@/deps-update.js'
import displayUpdatableDependencies from '@/deps-display.js'
import type { CheckerOptions, DependencyType, Dependency } from '@/types.js'

const collectDependencies = (
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
    currentRaw: version,
    // Clear redundant spaces for loose validation.
    current: version.replace(/(?<!-) (?![-=<>])/g, ''),
    status: 'ok',
  }))
}

const check = async (pkgData: string, pkg: PackageJson, options: CheckerOptions) => {
  const deps: Dependency[] = [...options.depsTypes].flatMap((type) => {
    const deps = pkg[type] as Record<string, string>
    return pkg[type] ? collectDependencies(deps, type, options.filters) : []
  })

  if (!deps.length) {
    print('No dependencies.')
    return
  }

  deps.sort((a, b) => a.name < b.name ? -1 : 1)

  const checked = await checkDependencies(deps, options)

  const result = await updateDependencies(pkgData, checked, options)

  if (result) {
    displayUpdatableDependencies(result, options)
  }
}

export default check
