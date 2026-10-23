import type { CheckResult, Dependency, SanCheckOptions } from '@src/types'
import { containsPrerelease, tryParseVerange } from '@src/veranger'
import type { Verange } from '@src/veranger/range'
import { findMaxSatisfying, isLessThanRange, isStable, parse, type SemVerRange, sort, tryParseRange } from 'verkit'
import { getPackageMeta, type PackageMeta } from './get-meta'
import { createProgressBar } from './progress-bar'

function createResult(): CheckResult {
  return { semver: 'ok', network: 'ok' }
}

const renewableOps = new Set(['^', '~', '>', '>='])

async function checkDependency(
  dep: Dependency,
  options: SanCheckOptions,
): Promise<CheckResult> {
  let result = createResult()
  let range: SemVerRange | null = null
  let verange: Verange | null = null

  range = tryParseRange(dep.version, { loose: true })
  if (range == null) {
    result.semver = 'invalid'
  } else {
    verange = tryParseVerange(dep.version)
    if (verange?.type === 'compound') {
      result.semver = 'complex'
    }
  }

  let meta: PackageMeta | null = null

  try {
    meta = await getPackageMeta(dep.name, options)
    if (meta == null) {
      result.network = 'failed'
      return result
    }
  } catch {
    result.network = 'failed'
    return result
  }

  let includePrerelease = options.checkPrerelease
  if (verange != null && containsPrerelease(verange)) {
    includePrerelease = true
  }

  const semvers = meta.versions
    .map((v) => parse(v))
    .filter((v) => includePrerelease || (isStable(v) ?? false))

  sort(semvers)

  const latest = includePrerelease
    ? parse(meta.latest)
    : semvers[semvers.length - 1]

  if (
    result.semver === 'ok'
    && verange?.type === 'unary'
    && renewableOps.has(verange.op)
  ) {
    let newer = findMaxSatisfying(semvers, dep.version, {
      loose: true,
      includePrerelease,
    })

    // Possible downgrade of dependency (due to deprecation or unpublishing).
    if (
      newer == null
      && latest != null
      && range != null
      && isLessThanRange(latest, range)
    ) {
      newer = latest
    }

    if (newer != null) {
      result.newer = newer
    }
  }

  return result
}

export async function checkDependencies(
  deps: Dependency[],
  options: SanCheckOptions,
): Promise<Record<string, CheckResult>> {
  const bar = createProgressBar({ nOfDeps: deps.length })
  await bar.begin()
  const results: Record<string, CheckResult> = {}

  for await (const dep of deps) {
    await bar.startChecking(dep.name)

    const result = await checkDependency(dep, options)
    results[dep.name] = result

    await bar.finishChecking(dep.name)
  }

  await bar.done()
  return results
}
