import Bottleneck from 'bottleneck'
import semver from 'semver'
import c from 'kleur'
import { SingleBar } from 'cli-progress'
import type { Dependency, DependencyChecked } from './types.js'

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

const depsCheck = async (deps: Dependency[]): Promise<DependencyChecked[]> => {
  const bar = new SingleBar({
    format: '[{bar}] {value}/{total} {rest}',
    barsize: Math.min(deps.length, 40),
    barCompleteChar: '*',
    barIncompleteChar: '-',
    hideCursor: true,
  })

  bar.start(deps.length, 0, { rest: '' })

  const updateCheck = (name: string) => {
    bar.increment({ rest: `→ ${c.cyan(name)}` })
  }

  await Promise.all(deps.map(async (dep): Promise<void> => {
    // Clear redundant spaces for loose validation.
    dep.current = dep.current.replace(/(?<!-) (?![-=<>])/g, '')

    if (!semver.validRange(dep.current, { loose: true })) {
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

    updateCheck(dep.name)

    const latest = json['dist-tags'].latest
    dep.latest = latest

    const versions = semver.sort(Object.keys(json.versions).map((s) => semver.parse(s)!))

    for (let i = versions.length - 1; i >= 0; i--) {
      const version = versions[i]
      const value = version.version

      if (json.versions[value].deprecated) {
        continue
      }

      if (version.prerelease.length != 0) {
        continue
      }
      if (!semver.satisfies(version, dep.current)) {
        continue
      }

      dep.newer = value
      break
    }

    if (!dep.newer) {
      dep.newer = versions[versions.length - 1].version
    }
  }))

  bar.update({ rest: c.green('Done!') })
  bar.stop()

  return deps as DependencyChecked[]
}

export default depsCheck
