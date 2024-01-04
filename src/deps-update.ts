import { writeFile } from 'fs/promises'
import { cwd } from 'process'
import semver from 'semver'
import c from 'kleur'
import { parseRange } from './semver/range.js'
import { takeSemverFrom } from './semver/semver.js'
import { updateRangeBase } from './semver/range-base.js'
import type { CheckerOptions, CheckErrors, DependencyChecked, DependencyToUpdate } from './types.js'

export interface CharsCount {
  name: number
  current: number
  newer: number
  latest: number
}

export interface DependencyUpdateResult {
  toUpdate: DependencyToUpdate[]
  chars: CharsCount
  errors: CheckErrors
}

const updateDependencies = async (
  pkgData: string,
  deps: DependencyChecked[],
  options: CheckerOptions,
): Promise<DependencyUpdateResult | undefined> => {
  const pkgDataBackup = pkgData

  const toUpdate: DependencyToUpdate[] = []

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

    const line: DependencyToUpdate = {
      name: dep.name,
      type: dep.type,
      current: dep.current,
    }

    const range = parseRange(dep.current)

    if (!range) {
      continue
    }

    if (range.type == '-') {
      const latest = takeSemverFrom(semver.parse(dep.latest)!)
    } else {

    }

    if (line.newer || line.latest) {
      (['name', 'current', 'newer', 'latest'] as const).map((key) => {
        if (line[key] && line[key]!.length > chars[key]) {
          chars[key] = line[key]!.length
        }
      })

      toUpdate.push(line)
    }
  }

  if (toUpdate.length && options.update) {
    console.log('')

    let backedUp = false
    try {
      await writeFile(`${cwd()}/package.sc.json`, pkgDataBackup)
      backedUp = true

      console.log(`A backup ${c.green('package.sc.json')} is created in case version control is not used.`)
    } catch {
      options.update = false

      console.log(
        `${c.red('Error:')} failed to generate ${c.green('package.sc.json')}. `
        + `The updates are not written to the ${c.green('package.json')} in case version control is not used.`,
      )
    }

    if (backedUp) {
      try {
        await writeFile(`${cwd()}/package.json`, pkgData)

        console.log(`Updates are written to ${c.green('package.json')}`)
      } catch {
        console.log(`${c.red('Error:')} failed to write to ${c.green('package.json')}.`)
      }
    }
  }

  return { toUpdate, chars, errors }
}

export default updateDependencies
