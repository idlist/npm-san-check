import type { CheckResult, Dependency, SanCheckOptions, UpdateTarget } from '@src/types'
import { hasPrerelease, newableOps, tryParseVerange } from '@src/veranger'
import PQueue from 'p-queue'
import { findMaxSatisfying, isLessThanRange, isStable, parse, type SemVer, sort, tryParseRange } from 'verkit'
import { getPackageMeta, type PackageMeta } from './get-meta'
import { createProgressBar } from './progress-bar'

async function checkDependency(
  dep: Dependency,
  options: SanCheckOptions,
): Promise<CheckResult> {
  let meta: PackageMeta | null = null

  const getMetaResult = await getPackageMeta(dep.name, options)
  if (typeof getMetaResult === 'string') {
    return { network: getMetaResult }
  }

  meta = getMetaResult
  const range = tryParseRange(dep.version)
  const verange = tryParseVerange(dep.version)

  let includePrerelease = options.checkPrerelease
  if (verange != null && hasPrerelease(verange)) {
    includePrerelease = true
  }

  const semvers = meta.versions
    .map((v) => parse(v))
    .filter((v) => includePrerelease || (isStable(v) ?? false))

  sort(semvers)

  const latest = includePrerelease
    ? parse(meta.latest)
    : semvers[semvers.length - 1]

  let newer: SemVer | null = null

  if (verange?.type === 'unary' && newableOps.has(verange.op)) {
    newer = findMaxSatisfying(semvers, dep.version, {
      loose: true,
      includePrerelease,
    })

    // Possible downgrade of dependency (due to deprecation or unpublishing).
    if (newer == null && range != null && isLessThanRange(latest, range)) {
      newer = latest
    }
  }

  const target: UpdateTarget = { latest }
  if (newer != null) target.newer = newer

  return { network: 'ok', target }
}

export async function checkDependencies(
  deps: Dependency[],
  options: SanCheckOptions,
): Promise<Record<string, CheckResult>> {
  const queue = new PQueue({
    concurrency: 5,
    interval: 100,
    intervalCap: 1,
  })

  const bar = createProgressBar({ nOfDeps: deps.length })
  await bar.begin()
  const results: Record<string, CheckResult> = {}

  for (const dep of deps) {
    queue.add(async () => {
      await bar.startChecking(dep.name)

      const result = await checkDependency(dep, options)
      results[dep.name] = result

      await bar.finishChecking(dep.name)
    })
  }

  await queue.onIdle()
  await bar.done()
  return results
}
