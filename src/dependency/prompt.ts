import { cyan, type DeclourPiece, green, magenta, yellow } from '@src/declour'
import print from '@src/print'
import type { SanCheckOptions, UpdatePlan } from '@src/types'

const Newer: DeclourPiece[] = [green('n'), 'ewer']
const Latest: DeclourPiece[] = [magenta('l'), 'atest']

export function displayPrompt(plan: UpdatePlan, options: SanCheckOptions) {
  if (options.update) {
    print.di(
      '\nRun ',
      cyan('npm install'),
      ' to install the ',
      ...(options.checkLatest ? Latest : Newer),
      ' versions.',
    )

    return
  }

  let promptNewer = false
  let promptLatest = false

  if (options.checkLatest) {
    promptLatest = Object.keys(plan.toLatest).length > 0
  } else {
    promptNewer = Object.keys(plan.toNewer).length > 0
    promptLatest = Object.keys(plan.toLatest)
      .some((name) => !(name in plan.toNewer))
  }

  print.i()

  if (promptNewer) {
    print.di(
      'Run ',
      cyan('npm-sc -u'),
      ...filterOptions(options),
      ' to update ',
      green(options.file),
      ' to the ',
      ...Newer,
      ' versions.',
    )
  }
  if (promptLatest) {
    print.di(
      'Run ',
      cyan('npm-sc -u'),
      magenta('l'),
      ...filterOptions(options),
      ' to update ',
      green(options.file),
      ' to the ',
      ...Latest,
      ' versions.',
    )
  }
}

function filterOptions(options: SanCheckOptions): DeclourPiece[] {
  const pieces: DeclourPiece[] = []

  if (options.filters.length > 0) {
    pieces.push(' ', cyan(options.filters.join(' ')))
  }
  if (options.checkPrerelease) {
    pieces.push(' ', yellow('--pre'))
  }

  return pieces
}
