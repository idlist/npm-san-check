import Bottleneck from 'bottleneck'
import semver from 'semver'
import c from 'kleur'
import { SingleBar } from 'cli-progress'
import type { PackageJson } from 'type-fest'
import type { CheckerOptions } from './types.js'

const limiter = new Bottleneck({ maxConcurrent: 5 })

type DependencyType = 'dep' | 'dev' | 'peer' | 'optional'
const DependencyTypes: DependencyType[] = ['dep', 'dev', 'peer', 'optional']

type CheckStatus = 'ok' | 'network' | 'semver'

interface Dependency {
  name: string
  type: DependencyType
  current: string
  updated?: string
  latest?: string
  status: CheckStatus
}

const collectDependency = (
  record: Record<string, string>,
  type: DependencyType,
): Dependency[] => Object.entries(record).flatMap(([name, version]) => ({
  name,
  type,
  current: version,
  status: 'ok',
}))

interface NpmPackagePartial {
  'dist-tags': {
    latest: string
    [prop: string]: string
  },
  versions: {
    [prop: string]: {
      deprecated: string
      [prop: string]: string
    }
  }
}

const check = async (json: PackageJson, options: CheckerOptions) => {
  const deps: Dependency[] = DependencyTypes.flatMap((type) => {
    const key = type === 'dep' ? 'dependencies' : (type + 'Dependencies')
    return json[key] ? collectDependency(json[key] as Record<string, string>, type) : []
  })

  const testDeps = deps
  let nameLength = 0

  const bar = new SingleBar({
    format: '[{bar}] {value}/{total} {rest}',
    barsize: Math.min(deps.length, 40),
    barCompleteChar: '*',
    barIncompleteChar: '-',
    hideCursor: true,
  })

  bar.start(deps.length, 0, { rest: '' })

  const updateCheck = (name: string) => {
    bar.increment({ rest: `-> ${c.cyan(name)}` })
  }

  await Promise.all(testDeps.map(async (dep) => {
    if (!semver.validRange(dep.current)) {
      dep.status = 'semver'
      updateCheck(dep.name)
      return
    }

    let result: NpmPackagePartial

    try {
      result = await limiter.schedule(async () => {
        const res = await fetch(`https://registry.npmjs.org/${dep.name}`)
        return res.json()
      }) as NpmPackagePartial
    } catch {
      dep.status = 'network'
      updateCheck(dep.name)
      return
    }

    if (dep.name.length > nameLength) {
      nameLength = dep.name.length
    }

    const latest = result['dist-tags'].latest
    dep.latest = latest

    const versions = semver.sort(Object.keys(result.versions))

    for (let i = versions.length - 1; i >= 0; i--) {
      const version = versions[i]

      if (result.versions[version].deprecated) {
        continue
      }
      if (!semver.satisfies(version, dep.current)) {
        continue
      }

      dep.updated = version
      break
    }

    updateCheck(dep.name)
  }))

  bar.update({ rest: c.green('Done!') })
  bar.stop()
}

export default check
