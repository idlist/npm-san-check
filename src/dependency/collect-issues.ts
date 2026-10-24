import type { CheckResult, Dependency, NetworkIssue, SemVerIssue } from '@src/types'
import { tryParseVerange } from '@src/veranger'
import { isValidRange } from 'verkit'

export function collectSemverIssues(
  deps: Dependency[],
): Record<string, SemVerIssue> {
  const issues: Record<string, SemVerIssue> = {}

  for (const dep of deps) {
    const valid = isValidRange(dep.range, { loose: true })
    if (!valid) {
      issues[dep.name] = 'invalid'
      continue
    }

    const verange = tryParseVerange(dep.range)
    if (verange == null || verange.type === 'compound') {
      issues[dep.name] = 'complex'
      continue
    }
  }

  return issues
}

export function collectNetworkIssues(
  checkResult: Record<string, CheckResult>,
): Record<string, NetworkIssue> {
  const issues: Record<string, NetworkIssue> = {}

  for (const [name, result] of Object.entries(checkResult)) {
    if (result.network !== 'ok') {
      issues[name] = result.network
    }
  }

  return issues
}
