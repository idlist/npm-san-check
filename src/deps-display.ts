import c from 'kleur'
import print from '@/print.js'
import type { DependencyUpdateResult } from '@/deps-update.js'
import type { CheckerOptions, DependencyType, DependencyUpdatable } from '@/types.js'

const colorType = (type: DependencyType) => {
  switch (type) {
    case 'dependencies':
      return ' '
    case 'devDependencies':
      return c.yellow('d')
    case 'peerDependencies':
      return c.magenta('p')
    case 'optionalDependencies':
      return c.cyan('o')
  }
}

const C = {
  newer: `${c.green('n')}ewer`,
  latest: `${c.magenta('l')}atest`,
}

const keys = ['name', 'current', 'newer', 'latest'] as const
type Keys = typeof keys[number]

const displayList = (list: DependencyUpdatable[], options: CheckerOptions) => {
  const stats: Record<Keys, number> = {
    name: 4,
    current: 0,
    newer: 0,
    latest: 0,
  }

  for (const item of list) {
    keys.forEach((key) => {
      const length = (item[key as keyof DependencyUpdatable])?.length ?? 0
      if (length > stats[key]) {
        stats[key] = length
      }
    })
  }

  if (stats.newer > 0 && stats.newer < 6) {
    stats.newer = 6
  }
  if (stats.latest > 0 && stats.latest < 6) {
    stats.latest = 6
  }

  const {
    name,
    current,
    newer,
    latest,
  } = stats

  const showNewer = !(options.latest && options.update) && !!newer
  const showLatest = !!latest

  print(
    `\n    ${c.cyan('n')}ame${' '.repeat(name - 4)}  `
    + ' '.repeat(current + 5)
    + (showNewer ? `${' '.repeat(newer - 5)}${C.newer}  ` : '')
    + (showLatest ? `${' '.repeat(latest - 6)}${C.latest}` : ''),
  )

  for (const dep of list) {
    print(
      ` ${colorType(dep.type)}  `
      + `${dep.name}${' '.repeat(name - dep.name.length)}  `
      + `${' '.repeat(current - dep.current.length)}${dep.current}  →  `
      + (showNewer && dep.newer
        ? `${' '.repeat(newer - dep.newer.length)}${dep.newerColored}  `
        : (showNewer ? ' '.repeat(newer + 2) : ''))
      + (showLatest && dep.latest ?
        `${' '.repeat(latest - dep.latest.length)}${dep.latestColored}`
        : ''),
    )
  }
}

const displayUpdatableDependencies = (
  result: DependencyUpdateResult,
  options: CheckerOptions,
) => {
  const {
    updated: { count, newer, latest },
    errors: { network, semverInvalid, semverComplex },
  } = result

  if (network.length) {
    const singular = network.length == 1
    print(
      `\nPackage${singular ? '' : 's'} ${network.map((name) => c.red(name)).join(', ')} `
      + (singular ? 'is' : 'are')
      + ` not checked due to connection error${singular ? '' : 's'} to the registry.`,
    )
  }
  if (semverInvalid.length) {
    print(`\nPackages having ${c.red('invalid')} semvers:`)
    displayList(semverInvalid, options)
  }
  if (semverComplex.length) {
    print(`\n Packages having ${c.yellow('complex')} semvers (for reference):`)
    displayList(semverComplex, options)
  }

  const errored = network.length
    || semverInvalid.length
    || semverComplex.length

  if (!count && !errored) {
    print(`\nAll dependencies are up to date! ${c.green(':3')}`)
  }

  if (!options.latest) {
    if (newer.length) {
      displayList(newer, options)
    }
    if (latest.length) {
      print(`\nOther dependencies that have ${C.latest} versions:`)
      displayList(latest, options)
    }
  } else {
    if (latest.length) {
      displayList(latest, options)
    }
  }

  if (options.update) {
    print(
      `\nRun ${c.cyan('npm install')} to install the `
      + (options.latest ? C.latest : C.newer)
      + ' versions.',
    )
  } else {
    print('')
    if (newer.length) {
      print(
        `Run ${c.cyan('npm-sc -u')}`
        + (options.filters ? ` ${c.cyan(options.filters.join(' '))}` : '')
        + (options.prerelease ? ` ${c.yellow('--pre')}` : '')
        + ` to update ${c.green(options.package)}`
        + ` to the ${C.newer} versions.`,
      )
    }
    if (latest.length) {
      print(
        `Run ${c.cyan('npm-sc -u')}${c.magenta('l')}`
        + (options.filters ? ` ${c.cyan(options.filters.join(' '))}` : '')
        + (options.prerelease ? ` ${c.yellow('--pre')}` : '')
        + ` to update ${c.green(options.package)}`
        + ` to the ${C.latest} versions.`,
      )
    }
  }
}

export default displayUpdatableDependencies
