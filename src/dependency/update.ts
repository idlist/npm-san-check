import { cyan, green } from '@src/declour'
import print from '@src/print'
import type { Dependency, SanCheckOptions, UpdatePlan } from '@src/types'
import { Latest, Newer } from '@src/utils'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { cwd } from 'node:process'
import { rewriteUpdateInPlace } from './rewrite'

export async function updateDependencies(
  packageData: string,
  plan: UpdatePlan,
  depsMap: Record<string, Dependency>,
  options: SanCheckOptions,
) {
  const target = options.checkLatest ? plan.toLatest : plan.toNewer
  if (Object.keys(target).length === 0) return

  const fullPath = path.resolve(cwd(), options.file)
  const updated = rewriteUpdateInPlace(packageData, target, depsMap)

  print.i()

  let backupName: string

  const separator = options.file.lastIndexOf('.')
  if (separator < 0) {
    backupName = `${options.file}.sc.json`
  } else {
    backupName = `${options.file.slice(0, separator)}.sc.${options.file.slice(separator + 1)}`
  }

  try {
    await fsp.writeFile(path.resolve(cwd(), backupName), packageData, { encoding: 'utf-8' })

    print.di(
      'A backup file ',
      green(backupName),
      ' is created in case something goes off.',
    )
  } catch {
    print.de(
      'failed to generate the backup file ',
      green(backupName),
      '. ',
      'The updates is aborted.',
    )
    return
  }

  try {
    await fsp.writeFile(fullPath, updated, { encoding: 'utf-8' })

    print.di('Updates are written to ', green(options.file), '.')
  } catch {
    print.de('failed to write update to ', green(options.file), '.')
    return
  }

  print.di(
    '\nRun ',
    cyan('npm install'),
    ' to install the ',
    ...(options.checkLatest ? Latest : Newer),
    ' versions.',
  )
}
