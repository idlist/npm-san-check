import semver, { Range, SemVer } from 'semver'
import c, { type Color } from 'kleur'
import { PackageJson } from 'type-fest'
import type { CheckStatusError, Dependency, DependencyChecked, DependencyType } from './index.js'
import type { CheckerOptions } from './types.js'

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

  return undefined
}

const colorType = (type: DependencyType) => {
  switch (type) {
    case 'dep':
      return '    '
    case 'dev':
      return `${c.yellow('d')}${c.gray('ev')} `
    case 'peer':
      return `${c.magenta('p')}${c.gray('eer')}`
    case 'optional':
      return `${c.cyan('o')}${c.gray('pt')} `
  }
}

interface CharsCount {
  name: number
  current: number
  newer: number
  latest: number
}

interface DependencyToUpdate extends Omit<Dependency, 'status'> {
  newerColored?: string
  latestColored?: string
}

const depsUpdate = (json: PackageJson, deps: DependencyChecked[], options: CheckerOptions) => {
  const toUpdate: DependencyToUpdate[] = []

  const chars: CharsCount = {
    name: 0,
    current: 0,
    newer: 0,
    latest: 0,
  }

  const errors: Record<CheckStatusError, string[]> = {
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
    const range = new Range(dep.current)

    const min = semver.minVersion(range)!
    const latest = semver.parse(dep.latest)!

    const latestColored = colorVer(min, latest)
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

  if (!toUpdate.length) {
    console.log(`\nAll dependencies are up to date! ${c.green(':3')}`)
    return
  }

  (['name', 'newer', 'latest'] as const).map((key) => {
    if (chars[key] && key.length > chars[key]) {
      chars[key] = key.length
    }
  })

  const showType = toUpdate.filter((item) => item.type != 'dep').length

  console.log(
    `\n ${c.cyan('n')}ame${' '.repeat(chars.name - 4)}  `
    + (showType ? '      ' : '')
    + ' '.repeat(chars.current + 5)
    + (chars.newer ? `${' '.repeat(chars.newer - 5)}${c.green('n')}ewer  ` : '')
    + (chars.latest ? `${' '.repeat(chars.latest - 6)}${c.magenta('l')}atest` : ''),
  )

  for (const dep of toUpdate) {
    console.log(
      ` ${dep.name}${' '.repeat(chars.name - dep.name.length)}  `
      + (showType ? `${colorType(dep.type)}  ` : '')
      + `${' '.repeat(chars.current - dep.current.length)}${dep.current}  →  `
      + (chars.newer && dep.newer
        ? `${' '.repeat(chars.newer - dep.newer.length)}${dep.newerColored}  `
        : '')
      + (chars.latest && dep.latest ?
        `${' '.repeat(chars.latest - dep.latest.length)}${dep.latestColored}`
        : ''),
    )
  }

  if (options.update) {
    console.log('')
    console.log(
      `\nUse ${c.cyan('npm install')} to install the `
      + (options.latest ? `${c.magenta('l')}atest` : `${c.green('n')}ewer`)
      + ' versions.',
    )
    console.log(
      `A ${c.green('package.bak.json')} is generated in case version control is not used.`,
    )
  } else {
    console.log('')
    if (chars.newer) {
      console.log(
        `\nRun ${c.cyan('npm-sc -u')} to update ${c.green('package.json')} `
        + `to ${c.green('n')}ewer versions.`,
      )
    }
    if (chars.latest) {
      console.log(
        `Run ${c.cyan('npm-sc -u')}${c.magenta('l')} to update ${c.green('package.json')} `
        + `to ${c.magenta('l')}atest versions.`,
      )
    }
  }
}

export default depsUpdate
