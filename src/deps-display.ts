import c from 'kleur'
import type { DependencyUpdateResult } from './deps-update.js'
import type { CheckerOptions, DependencyType } from './types.js'

const colorType = (type: DependencyType) => {
  switch (type) {
    case 'dep':
      return ' '
    case 'dev':
      return c.yellow('d')
    case 'peer':
      return c.magenta('p')
    case 'optional':
      return c.cyan('o')
  }
}

const displayUpdatableDependencies = (
  result: DependencyUpdateResult,
  options: CheckerOptions,
) => {
  const { toUpdate, chars, errors } = result

  const errored = () => errors.semver.length || errors.network.length

  if (errored()) {
    console.log('')
  }
  if (errors.semver.length) {
    console.log(
      `Package ${errors.semver.map((name) => c.red(name)).join(', ')} `
      + (errors.semver.length == 1
        ? 'has invalid semver range, and is skipped.'
        : 'have invalid semver ranges, and are skipped.'),
    )
  }
  if (errors.network.length) {
    console.log(
      `Package ${errors.semver.map((name) => c.red(name)).join(', ')} `
      + (errors.network.length == 1 ? 'is' : 'are')
      + ' not checked due to connection error to npm\'s API.',
    )
  }

  if (!toUpdate.length) {
    if (!errored()) {
      console.log(`\nAll dependencies are up to date! ${c.green(':3')}`)
    }
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
    + (showType ? '   ' : '')
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

export default displayUpdatableDependencies
