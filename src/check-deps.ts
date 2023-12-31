import Bottleneck from 'bottleneck'
import semver from 'semver'
import c from 'kleur'
import { SingleBar } from 'cli-progress'
import type { Dependency } from './index.js'

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

const limiter = new Bottleneck({
  minTime: 50,
  maxConcurrent: 5,
})

const checkDeps = async (deps: Dependency[]): Promise<Dependency[]> => {
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

  await Promise.all(deps.map(async (dep) => {
    if (!semver.validRange(dep.current)) {
      dep.status = 'semver'
      updateCheck(dep.name)
      return
    }

    let json: NpmPackagePartial

    try {
      json = await limiter.schedule(async () => {
        const res = await fetch(`https://registry.npmjs.org/${dep.name}`)
        return res.json()
      }) as NpmPackagePartial
    } catch {
      dep.status = 'network'
      updateCheck(dep.name)
      return
    }

    const latest = json['dist-tags'].latest
    if (semver.neq(semver.minVersion(dep.current)!, latest)) {
      dep.latest = latest
    }

    const versions = semver.sort(Object.keys(json.versions))

    for (let i = versions.length - 1; i >= 0; i--) {
      const version = versions[i]

      if (json.versions[version].deprecated) {
        continue
      }
      if (!semver.satisfies(version, dep.current)) {
        continue
      }

      if (semver.neq(semver.minVersion(dep.current)!, latest)) {
        dep.newer = version
      }
      break
    }

    updateCheck(dep.name)
  }))

  bar.update({ rest: c.green('Done!') })
  bar.stop()

  return deps
}

export default checkDeps
