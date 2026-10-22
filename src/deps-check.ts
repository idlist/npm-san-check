import c from 'kleur'
import semver from 'semver'
import { fetch, ProxyAgent } from 'undici'
import { createProgress } from './progress.js'
import { formatRangeBase } from './semver/range-base.js'
import { parseRange, type RangeUnary } from './semver/range.js'
import type { CheckerOptions, Dependency, DependencyChecked } from './types.js'

interface NpmPackagePartial {
  'dist-tags': {
    latest: string
    [prop: string]: string
  }
  versions: {
    [prop: string]: {
      deprecated: string
      [prop: string]: string
    }
  }
}

const checkDependencies = async (
  deps: Dependency[],
  options: CheckerOptions,
): Promise<DependencyChecked[]> => {
  let proxyAgent: ProxyAgent | undefined

  if (options.proxy) {
    proxyAgent = new ProxyAgent(options.proxy)
  }

  const bar = createProgress({
    numberOfDeps: deps.length,
  })

  await bar.start()

  const updateChecking = async (name: string) => {
    await bar.increment(`→ ${c.cyan(name)}`)
  }

  for await (const dep of deps) {
    if (!semver.validRange(dep.current, { loose: true })) {
      dep.status = 'semverInvalid'
    }

    const range = parseRange(dep.current)
    if (range?.type === '||') {
      dep.status = 'semverComplex'
    }

    let json: NpmPackagePartial

    try {
      const response = await fetch(`${options.registry}${dep.name}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        dispatcher: proxyAgent,
      })
      json = await response.json() as NpmPackagePartial
    } catch {
      dep.status = 'network'
      await updateChecking(dep.name)
      continue
    }

    let versions = Object.keys(json.versions)
      .filter((v) => !json.versions[v].deprecated)
      .map((s) => semver.parse(s)!)

    const includePrerelease = options.prerelease
      || (range?.type !== '-' && range?.type !== '||' && range?.operand.includePrerelease)
      || (range?.type === '-' && (range.operands[0].includePrerelease || range.operands[1].includePrerelease))

    if (!includePrerelease) {
      versions = versions.filter((v) => !v.prerelease.length)
    }

    semver.sort(versions)

    let latest

    if (includePrerelease) {
      latest = versions[versions.length - 1].version
    } else {
      latest = json['dist-tags'].latest
    }

    dep.latest = latest

    if (dep.status === 'ok' && range && ['^', '~', '>', '>='].includes(range.type)) {
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

    await updateChecking(dep.name)
  }

  await bar.increment(c.green('Done!'))
  bar.stop()

  return deps
}

export default checkDependencies
