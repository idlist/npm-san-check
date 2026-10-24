import type { CheckResult, Dependency, SemVerIssue, UpdatePlan } from '@src/types'

import {
  takeVerangeFromSemVer,
  tryParseVerange,
  updateVerangeToLatest,
  updateVerangeToNewer,
  type VerangeUpdatable,
} from '@src/veranger'

export function planDependencyUpdate(
  deps: Dependency[],
  checkResult: Record<string, CheckResult>,
  semverIssues: Record<string, SemVerIssue>,
): UpdatePlan {
  const plan: UpdatePlan = {
    from: {},
    toNewer: {},
    toLatest: {},
  }

  for (const dep of deps) {
    const result = checkResult[dep.name]
    if (result == null || result.network !== 'ok') continue

    const { newer, latest } = result.target
    const verange = tryParseVerange(dep.range)

    if (!(dep.name in semverIssues) && verange != null && newer != null) {
      const newerUpdated = updateVerangeToNewer(verange, newer)

      if (newerUpdated != null) {
        plan.toNewer[dep.name] = newerUpdated
        plan.from[dep.name] = verange as VerangeUpdatable
      }
    }

    if (verange != null) {
      const latestUpdated = updateVerangeToLatest(verange, latest)

      if (latestUpdated != null) {
        plan.toLatest[dep.name] = latestUpdated
        plan.from[dep.name] = verange as VerangeUpdatable
      }
    } else {
      plan.toLatest[dep.name] = takeVerangeFromSemVer(latest)
    }
  }

  return plan
}
