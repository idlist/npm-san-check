import type { Dependency, SanCheckOptions } from '@src/types'
import { justCompare } from '@src/utils'
import type { PackageJson } from 'type-fest'

export function collectDependencies(packageJson: PackageJson, options: SanCheckOptions) {
  const filters: RegExp[] = []
  const deps: Dependency[] = []

  for (const rawFilter of options.filters) {
    const pattern = rawFilter.replaceAll('*', '.*')
    filters.push(new RegExp(`^${pattern}$`))
  }

  const isFilterMatched = (name: string) => {
    if (filters.length === 0) return true

    for (const filter of filters) {
      if (filter.test(name)) return true
    }
    return false
  }

  for (const type of options.checkTypes.values()) {
    const depsOfType = packageJson[type] as Record<string, string>
    const entries = Object.entries(depsOfType)

    for (const [name, range] of entries) {
      if (!isFilterMatched(name)) continue
      deps.push({
        name,
        type,
        range,
        rangeClean: range.replace(/(?<!-) (?![-=<>])/g, ''),
      })
    }
  }

  deps.sort((a, b) => justCompare(a.name, b.name))
  return deps
}
