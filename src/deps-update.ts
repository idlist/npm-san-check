import { writeFile } from 'fs/promises'
import { cwd } from 'process'
import semver from 'semver'
import c from 'kleur'
import print from '@/print.js'
import { parseRange } from '@/semver/range.js'
import { formatRangeBase, updateRangeBase } from '@/semver/range-base.js'
import replaceDependencies from './replace-deps.js'
import type { CheckerOptions, CheckErrors, DependencyChecked, DependencyUpdated } from '@/types.js'

export interface CharsCount {
  name: number
  current: number
  newer: number
  latest: number
}

export interface DependencyUpdateResult {
  updated: DependencyUpdated[]
  chars: CharsCount
  errors: CheckErrors
}

const updateDependencies = async (
  pkgData: string,
  deps: DependencyChecked[],
  options: CheckerOptions,
): Promise<DependencyUpdateResult | undefined> => {
  const pkgDataBackup = pkgData

  const updated: DependencyUpdated[] = []

  const chars: CharsCount = {
    name: 0,
    current: 0,
    newer: 0,
    latest: 0,
  }

  const errors: CheckErrors = {
    semver: [],
    network: [],
  }

  const duplicate = '..'

  for (const dep of deps) {
    if (dep.status == 'semver') {
      errors.semver.push(dep.name)
      continue
    }
    if (dep.status == 'network') {
      errors.network.push(dep.name)
      continue
    }
    if (dep.status != 'ok') {
      continue
    }

    const entry: DependencyUpdated = {
      name: dep.name,
      type: dep.type,
      currentRaw: dep.currentRaw,
      current: dep.current,
    }

    const range = parseRange(dep.current)

    if (!range || range.type == '||') {
      continue
    }

    if (range.type == '-') {
      if (dep.latest) {
        const latest = semver.parse(dep.latest)!

        if (semver.gtr(latest, dep.current)) {
          const rangeRight = updateRangeBase(range.operand[1], latest)

          if (rangeRight.result != 0) {
            const rangeLeft = formatRangeBase(range.operand[0])
            entry.latest = `${rangeLeft} - ${rangeRight.to}`
            entry.latestColored = `${rangeLeft} - ${rangeRight.toColored}`
          }
        }
      }
    } else {
      if (dep.newer && ['^', '~', '>', '>='].includes(range.type)) {
        const newer = semver.parse(dep.newer)!
        const newerUpdated = updateRangeBase(range.operand, newer)

        if (newerUpdated.result != 0) {
          entry.newer = `${range.type}${newerUpdated.to}`
          entry.newerColored = `${range.type}${newerUpdated.toColored}`
        }
      }

      if (dep.latest) {
        const latest = semver.parse(dep.latest)!
        const latestUpdated = updateRangeBase(range.operand, latest)

        if (latestUpdated.result != 0) {
          entry.latest = `${range.type}${latestUpdated.to}`
          entry.latestColored = `${range.type}${latestUpdated.toColored}`

          if (entry.latest == entry.newer) {
            entry.newer = duplicate
            entry.newerColored = duplicate
          }
        }
      }
    }

    if (entry.newer || entry.latest) {
      (['name', 'current', 'newer', 'latest'] as const).forEach((key) => {
        if (!entry[key]) {
          return
        }

        const length = entry[key]!.length

        if (length > chars[key]) {
          chars[key] = length
        }
      })

      updated.push(entry)
    }
  }

  if (updated.length && options.update) {
    print('')

    let backedUp = false
    let backupName

    const separator = options.project.lastIndexOf('.')
    if (separator < 0) {
      backupName = `${options.project}.sc.json`
    } else {
      backupName = `${options.project.slice(0, separator)}.sc.${options.project.slice(separator + 1)}`
    }

    try {

      await writeFile(`${cwd()}/${backupName}`, pkgDataBackup, { encoding: 'utf8' })
      backedUp = true

      print(`A backup ${c.green(backupName)} is created in case version control is not used.`)
    } catch {
      options.update = false

      print.error(
        `failed to generate ${c.green(backupName)}. `
        + `The updates are not written to the ${c.green(options.project)} in case version control is not used.`,
      )
    }

    if (backedUp) {
      pkgData = replaceDependencies(pkgData, updated, options)

      try {
        await writeFile(`${cwd()}/${options.project}`, pkgData, { encoding: 'utf8' })

        print(`Updates are written to ${c.green(options.project)}.`)
      } catch {
        print.error(`failed to write to ${c.green(options.project)}.`)
      }
    }
  }

  return {
    updated,
    chars,
    errors,
  }
}

export default updateDependencies
