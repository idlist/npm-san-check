import { declour, green } from '@src/declour/index'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { cwd, exit } from 'node:process'
import type { PackageJson } from 'type-fest'
import print from './print'
import type { Dependency, SanCheckOptions } from './types'

import { checkDependencies, checkSemver, collectDependencies, planDependencyUpdate } from './dependency/index'

export async function sanCheck(options: SanCheckOptions) {
  const packageData = await tryGetPackageFile(options.file)
  if (packageData == null) exit(1)

  const packageJson = await tryLoadPackageJson(options.file, packageData)
  if (packageJson == null) exit(1)

  const deps = collectDependencies(packageJson, options)
  if (!deps.length) {
    print.info('No dependencies.')
    return
  }

  const depsMap = new Map<string, Dependency>()
  for (const dep of deps) {
    depsMap.set(dep.name, dep)
  }

  const semverIssues = checkSemver(deps)
  const checkResult = await checkDependencies(deps, options)
  const plan = planDependencyUpdate(deps, semverIssues, checkResult)
  console.log(plan)
}

async function tryGetPackageFile(file: string) {
  try {
    const fullPath = path.resolve(cwd(), file)
    const packageData = await fsp.readFile(fullPath, { encoding: 'utf-8' })
    return packageData
  } catch {
    print.error(declour('there isn\'t a ', green(file), ' file under this directory'))
    return
  }
}

async function tryLoadPackageJson(file: string, packageData: string) {
  try {
    const packageJson = JSON.parse(packageData) as PackageJson
    return packageJson
  } catch {
    print.error(declour('failed to parse ', green(file), '.'))
    return
  }
}
