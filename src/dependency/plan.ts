import type { CheckResult, Dependency, SemVerIssue, UpdatePlan } from '@src/types'
import { tryParseVerange, updateVerangeToLatest, updateVerangeToNewer } from '@src/veranger'

export function planDependencyUpdate(
  deps: Dependency[],
  semverIssues: Record<string, SemVerIssue>,
  checkResult: Record<string, CheckResult>,
): UpdatePlan {
  const plan: UpdatePlan = {
    toNewer: {},
    toLatest: {},
  }

  for (const dep of deps) {
    const result = checkResult[dep.name]
    if (result == null || result.network !== 'ok') continue

    const { newer, latest } = result.target
    const verange = tryParseVerange(dep.version)
    if (verange == null) continue

    if (semverIssues[dep.name] == null && newer != null) {
      const newerUpdated = updateVerangeToNewer(verange, newer)
      if (newerUpdated != null) {
        plan.toNewer[dep.name] = newerUpdated
      }
    }

    const latestUpdated = updateVerangeToLatest(verange, latest)
    if (latestUpdated != null) {
      plan.toLatest[dep.name] = latestUpdated
    }
  }

  return plan
}
