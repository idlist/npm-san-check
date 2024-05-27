import c from 'kleur'
import print from '@/print.js'
import type { DependencyUpdateResult } from '@/deps-update.js'
import type { CheckerOptions, DependencyType } from '@/types.js'

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

const displayUpdatableDependencies = (
  result: DependencyUpdateResult,
  options: CheckerOptions,
) => {
  const { updated, chars, errors } = result

  const errored = () => errors.semverInvalid.length || errors.network.length

  if (errored()) {
    print('')
  }
  if (errors.semverInvalid.length) {
    print(
      `Package ${errors.semverInvalid.map((name) => c.red(name)).join(', ')} `
      + (errors.semverInvalid.length == 1
        ? 'has invalid semver range, and is skipped.'
        : 'have invalid semver ranges, and are skipped.'),
    )
  }
  if (errors.network.length) {
    print(
      `Package ${errors.network.map((name) => c.red(name)).join(', ')} `
      + (errors.network.length == 1 ? 'is' : 'are')
      + ' not checked due to connection error to npm\'s registry.',
    )
  }

  if (!updated.length) {
    if (!errored()) {
      print(`\nAll dependencies are up to date! ${c.green(':3')}`)
    }
    return
  }

  (['name', 'newer', 'latest'] as const).map((key) => {
    if (chars[key] && key.length > chars[key]) {
      chars[key] = key.length
    }
  })

  const showType = updated.filter((item) => item.type != 'dependencies').length

  print(
    `\n ${c.cyan('n')}ame${' '.repeat(chars.name - 4)}  `
    + (showType ? '   ' : '')
    + ' '.repeat(chars.current + 5)
    + (chars.newer ? `${' '.repeat(chars.newer - 5)}${c.green('n')}ewer  ` : '')
    + (chars.latest ? `${' '.repeat(chars.latest - 6)}${c.magenta('l')}atest` : ''),
  )

  for (const dep of updated) {
    print(
      ` ${dep.name}${' '.repeat(chars.name - dep.name.length)}  `
      + (showType ? `${colorType(dep.type)}  ` : '')
      + `${' '.repeat(chars.current - dep.current.length)}${dep.current}  →  `
      + (chars.newer && dep.newer
        ? `${' '.repeat(chars.newer - dep.newer.length)}${dep.newerColored}  `
        : (chars.newer && dep.latest ? ' '.repeat(chars.newer + 2)  : ''))
      + (chars.latest && dep.latest ?
        `${' '.repeat(chars.latest - dep.latest.length)}${dep.latestColored}`
        : ''),
    )
  }

  if (options.update) {
    print(
      `\nRun ${c.cyan('npm install')} to install the `
      + (options.latest ? `${c.magenta('l')}atest` : `${c.green('n')}ewer`)
      + ' versions.',
    )
  } else {
    print('')
    if (chars.newer) {
      print(
        `Run ${c.cyan('npm-sc -u')}`
        + (options.filters ? ` ${c.cyan(options.filters.join(' '))}` : '')
        + (options.prerelease ? ` ${c.yellow('--pre')}` : '')
        + ` to update ${c.green(options.package)}`
        + ` to ${c.green('n')}ewer versions.`,
      )
    }
    if (chars.latest) {
      print(
        `Run ${c.cyan('npm-sc -u')}${c.magenta('l')}`
        + (options.filters ? ` ${c.cyan(options.filters.join(' '))}` : '')
        + (options.prerelease ? ` ${c.yellow('--pre')}` : '')
        + ` to update ${c.green(options.package)}`
        + ` to ${c.magenta('l')}atest versions.`,
      )
    }
  }
}

export default displayUpdatableDependencies
