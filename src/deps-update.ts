import { writeFile } from 'fs/promises'
import { cwd } from 'process'
import semver from 'semver'
import c from 'kleur'
import print from '@/print.js'
import { parseRange } from '@/semver/range.js'
import { formatRangeBase, updateRangeBase } from '@/semver/range-base.js'
import replaceDependencies from '@/replace-deps.js'
import type { CheckerOptions, DependencyChecked, DependencyUpdatable } from '@/types.js'

export interface DependencyUpdateResult {
  updated: {
    count: number
    newer: DependencyUpdatable[]
    latest: DependencyUpdatable[]
  }
  errors: {
    network: string[]
    semverInvalid: DependencyUpdatable[]
    semverComplex: DependencyUpdatable[]
  }
}

const updateDependencies = async (
  pkgData: string,
  deps: DependencyChecked[],
  options: CheckerOptions,
): Promise<DependencyUpdateResult | undefined> => {
  const pkgDataBackup = pkgData

  const updatableNewer: DependencyUpdatable[] = []
  const updatableLatest: DependencyUpdatable[] = []
  const network: string[] = []
  const semverInvalid: DependencyUpdatable[] = []
  const semverComplex: DependencyUpdatable[] = []

  const duplicate = '..'

  for (const dep of deps) {
    if (dep.status == 'network') {
      network.push(dep.name)
      continue
    }

    const entry: DependencyUpdatable = {
      name: dep.name,
      type: dep.type,
      currentRaw: dep.currentRaw,
      current: dep.current,
    }

    const range = parseRange(dep.current)

    if (!range) {
      continue
    }

    if (dep.status == 'semverInvalid' || dep.status == 'semverComplex') {
      entry.latest = dep.latest
      entry.latestColored = dep.latest

      if (dep.status == 'semverInvalid') {
        semverInvalid.push(dep)
      } else if (dep.status == 'semverComplex') {
        semverComplex.push(dep)
      }
    } else if (range.type == '-') {
      const latest = semver.parse(dep.latest)!

      if (semver.gtr(latest, dep.current)) {
        const rangeRight = updateRangeBase(range.operands[1], latest)

        if (rangeRight.result != 0) {
          const rangeLeft = formatRangeBase(range.operands[0])
          entry.latest = `${rangeLeft} - ${rangeRight.to}`
          entry.latestColored = `${rangeLeft} - ${rangeRight.toColored}`
        }

        updatableLatest.push(entry)
      }
    } else if (range.type != '||') {
      if (dep.newer && ['^', '~', '>', '>='].includes(range.type)) {
        const newer = semver.parse(dep.newer)!
        const newerUpdated = updateRangeBase(range.operand, newer)

        if (newerUpdated.result != 0) {
          entry.newer = `${range.type}${newerUpdated.to}`
          entry.newerColored = `${range.type}${newerUpdated.toColored}`
        }
      }

      const latest = semver.parse(dep.latest)!
      const latestUpdated = updateRangeBase(range.operand, latest)

      if (latestUpdated.result != 0) {
        entry.latest = `${range.type}${latestUpdated.to}`
        entry.latestColored = `${range.type}${latestUpdated.toColored}`
      }

      if (entry.newer && entry.latest && entry.newer == entry.latest) {
        if (!options.latest) {
          entry.latest = duplicate
          entry.latestColored = duplicate
        } else {
          entry.newer = duplicate
          entry.newerColored = duplicate
        }
      }

      if (!options.latest) {
        if (entry.newer) {
          updatableNewer.push(entry)
        } else if (entry.latest) {
          updatableLatest.push(entry)
        }
      } else {
        if (entry.newer || entry.latest) {
          updatableLatest.push(entry)
        }
      }
    }
  }

  const updatable = [...updatableNewer, ...(options.latest ? updatableLatest : [])]
  const updatableCount = updatable.length

  if (updatable.length && options.update) {
    print('')

    let backedUp = false
    let backupName

    const separator = options.package.lastIndexOf('.')
    if (separator < 0) {
      backupName = `${options.package}.sc.json`
    } else {
      backupName = `${options.package.slice(0, separator)}.sc.${options.package.slice(separator + 1)}`
    }

    try {
      await writeFile(`${cwd()}/${backupName}`, pkgDataBackup, { encoding: 'utf8' })
      backedUp = true

      print(`A backup ${c.green(backupName)} is created in case version control is not used.`)
    } catch {
      options.update = false

      print.error(
        `failed to generate ${c.green(backupName)}. `
        + `The updates are not written to the ${c.green(options.package)} in case version control is not used.`,
      )
    }

    if (backedUp) {
      pkgData = replaceDependencies(pkgData, updatable, options)

      try {
        await writeFile(`${cwd()}/${options.package}`, pkgData, { encoding: 'utf8' })

        print(`Updates are written to ${c.green(options.package)}.`)
      } catch {
        print.error(`failed to write to ${c.green(options.package)}.`)
      }
    }
  }

  return {
    updated: {
      count: updatableCount,
      newer: updatableNewer,
      latest: updatableLatest,
    },
    errors: {
      network,
      semverInvalid,
      semverComplex,
    },
  }
}

export default updateDependencies
