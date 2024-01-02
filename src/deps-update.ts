import semver, { type SemVer } from 'semver'
import c, { type Color } from 'kleur'
import { PackageJson } from 'type-fest'
import type { CheckerOptions, CheckErrors, DependencyChecked, DependencyToUpdate } from './types.js'
import readableRange from './semver-range.js'

const cloneVer = (prev: SemVer) => semver.parse(prev.version)!

const colorVer = (prev: SemVer, next: SemVer): string | undefined => {
  const nextMajor = cloneVer(prev).inc('major')
  if (semver.gte(next, nextMajor)) {
    return c.red(next.version)
  }

  const nextMinor = cloneVer(prev).inc('minor')
  if (semver.gte(next, nextMinor)) {
    let color: Color
    if (prev.major == 0) {
      color = c.red
    } else {
      color = c.cyan
    }
    return `${next.major}.${color(`${next.minor}.${next.patch}`)}`
  }

  const nextPatch = cloneVer(prev).inc('patch')
  if (semver.gte(next, nextPatch)) {
    let color: Color
    if (prev.minor == 0) {
      color = c.red
    } else if (prev.major == 0) {
      color = c.cyan
    } else {
      color = c.green
    }
    return `${next.major}.${next.minor}.${color(next.patch)}`
  }

  if (semver.lt(next, prev)) {
    return c.bgRed().black(next.version)
  }

  return
}

export interface CharsCount {
  name: number
  current: number
  newer: number
  latest: number
}

const depsUpdate = (json: PackageJson, deps: DependencyChecked[], options: CheckerOptions) => {
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

    const range = readableRange(dep.current)

    const prev = semver.minVersion(dep.current)!
    const latest = semver.parse(dep.latest)!

    const latestColored = colorVer(prev, latest)
    if (latestColored) {
      line.latest = `^${dep.latest}`
      line.latestColored = `^${latestColored}`
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

  return { toUpdate, chars, errors }
}

export default depsUpdate
