import { pRateLimit } from 'p-ratelimit'
import semver from 'semver'
import c from 'kleur'
import { SingleBar } from 'cli-progress'
import type { CheckerOptions, Dependency, DependencyChecked } from './types.js'
import { parseRange, type RangeUnary } from './semver/range.js'
import { formatRangeBase } from './semver/range-base.js'

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

const limit = pRateLimit({
  interval: 50,
  rate: 1,
  concurrency: 5,
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
      dep.status = 'semverInvalid'
    }

    const range = parseRange(dep.current)
    if (range?.type == '||') {
      dep.status = 'semverComplex'
    }

    let json: NpmPackagePartial

    try {
      json = await limit(async () => {
        const res = await fetch(`${options.registry}${dep.name}`)
        return res.json()
      }) as NpmPackagePartial
    } catch {
      dep.status = 'network'
      updateChecking(dep.name)
      return
    }

    let versions = Object.keys(json.versions)
      .filter((v) => !json.versions[v].deprecated)
      .map((s) => semver.parse(s)!)

    const includePrerelease = options.prerelease
      || (range?.type != '-' && range?.type != '||' && range?.operand.includePrerelease)
      || (range?.type == '-' && (range.operands[0].includePrerelease || range.operands[1].includePrerelease))

    if (!includePrerelease) {
      versions = versions.filter((v) => !v.prerelease.length)
    }

    versions = semver.sort(versions)

    let latest

    if (includePrerelease) {
      latest = versions[versions.length - 1].version
    } else {
      latest = json['dist-tags'].latest
    }

    dep.latest = latest

    if (dep.status == 'ok' && range && ['^', '~', '>', '>='].includes(range.type)) {
      let newer = semver.maxSatisfying(versions, dep.current, {
        loose: true,
        includePrerelease,
      })?.version

      // Possible downgrade of dependency (due to deprecating or unpublishing)
      if (!newer && semver.ltr(latest, formatRangeBase((range as RangeUnary).operand))) {
        newer = latest
      }

      dep.newer = newer
    }

    updateChecking(dep.name)
  }))

  bar.update({ rest: c.green('Done!') })
  bar.stop()

  return deps
}

export default checkDependencies
