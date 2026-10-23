import { declour, green } from '@src/declour/index'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { cwd, exit } from 'node:process'
import type { PackageJson } from 'type-fest'
import print from './print'
import type { SanCheckOptions } from './types'

export async function sanCheck(options: SanCheckOptions) {
  const packageData = await tryGetPackageFile(options.file)
  if (packageData == null) exit(1)

  const packageJson = await tryLoadPackageJson(options.file, packageData)
  if (packageJson == null) exit(1)
}

async function tryGetPackageFile(filePath: string) {
  try {
    const fullPath = path.resolve(cwd(), filePath)
    const packageData = await fsp.readFile(fullPath, { encoding: 'utf-8' })
    return packageData
  } catch {
    print.error(declour('there isn\'t a ', green(filePath), ' file under this directory'))
    return
  }
}

async function tryLoadPackageJson(filePath: string, packageData: string) {
  try {
    const packageJson = JSON.parse(packageData) as PackageJson
    return packageJson
  } catch {
    print.error(declour('failed to parse ', green(filePath), '.'))
    return
  }
}
