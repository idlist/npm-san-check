import Bottleneck from 'bottleneck'
import semver from 'semver'
import c from 'kleur'
import { SingleBar } from 'cli-progress'
import type { CheckerOptions, Dependency, DependencyChecked } from './types.js'
import { parseRange } from './semver/range.js'
import { RangeBase, formatRangeBase } from './semver/range-base.js'

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

const checkDependencies = async (
  deps: Dependency[],
  options: CheckerOptions,
): Promise<DependencyChecked[]> => {
  const bar = new SingleBar({
    format: '[{bar}] {value}/{total}  {rest}',
    barsize: Math.min(deps.length, 40),
    barCompleteChar: '*',
    barIncompleteChar: '-',
    hideCursor: true,
  })

  bar.start(deps.length, 0, { rest: '' })

  const updateChecking = (name: string) => {
    bar.increment({ rest: `→ ${c.cyan(name)}` })
  }

  await Promise.all(deps.map(async (dep): Promise<void> => {
    if (!semver.validRange(dep.current, { loose: true })) {
      dep.status = 'semver'
      updateChecking(dep.name)
      return
    }

    const range = parseRange(dep.current)
    if (range?.type == '||') {
      return
    }

    let json: NpmPackagePartial

    try {
      json = await limiter.schedule(async () => {
        const res = await fetch(`${options.registry}${dep.name}`)
        return res.json()
      }) as NpmPackagePartial
    } catch {
      dep.status = 'network'
      updateChecking(dep.name)
      return
    }

    updateChecking(dep.name)

    let versions = Object.keys(json.versions)
      .filter((v) => !json.versions[v].deprecated)
      .map((s) => semver.parse(s)!)

    const includePrerelease = options.prerelease
      || (range?.type != '-' && range?.operand.includePrerelease)
      || (range?.type == '-' && (range.operand[0].includePrerelease || range.operand[1].includePrerelease))

    if (!includePrerelease) {
      versions = versions.filter((v) => !v.prerelease.length)
    }

    versions = semver.sort(versions)

    let latest

    if (options.prerelease) {
      latest = versions[versions.length - 1].version
    } else {
      latest = json['dist-tags'].latest
    }

    if (options.latest) {
      dep.latest = latest
    }

    if (range && ['^', '~', '>', '>='].includes(range.type)) {
      let newer = semver.maxSatisfying(versions, dep.current, {
        loose: true,
        includePrerelease,
      })?.version

      if (!newer && semver.ltr(latest, formatRangeBase(range.operand as RangeBase))) {
        newer = latest
      }

      dep.newer = newer
    }
  }))

  bar.update({ rest: c.green('Done!') })
  bar.stop()

  return deps as DependencyChecked[]
}

export default checkDependencies
