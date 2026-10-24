import type { Dependency, NetworkIssue, SanCheckOptions, SemVerIssue, UpdatePlan } from '@src/types'

export function displayUpdatePlan(
  plan: UpdatePlan,
  depsMap: Map<string, Dependency>,
  semverIssues: Record<string, SemVerIssue>,
  networkIssues: Record<string, NetworkIssue>,
  options: SanCheckOptions,
) {
}
