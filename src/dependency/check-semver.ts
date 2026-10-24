import type { Dependency, SemVerIssue } from '@src/types'
import { tryParseVerange } from '@src/veranger'
import { isValidRange } from 'verkit'

export function checkSemver(deps: Dependency[]): Record<string, SemVerIssue> {
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
