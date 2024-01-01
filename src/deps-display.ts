import c from 'kleur'
import type { CharsCount } from './deps-update.js'
import type { CheckerOptions, CheckErrors, DependencyToUpdate, DependencyType } from './types.js'

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

const depsDisplay = (
  toUpdate: DependencyToUpdate[],
  chars: CharsCount,
  errors: CheckErrors,
  options: CheckerOptions,
) => {
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

export default depsDisplay
