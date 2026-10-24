import { blue, cyan, type DeclourPiece, green, red, yellow } from '@src/declour'
import print from '@src/print'
import type { Dependency, DependencyType, NetworkIssue, SanCheckOptions, SemVerIssue, UpdatePlan } from '@src/types'
import { interpose, Latest, Name, Newer } from '@src/utils'
import { colorizeVerangeDiff, formatVerange } from '@src/veranger'

function head(type: DependencyType): DeclourPiece[] {
  switch (type) {
    case 'dependencies':
      return [' ']
    case 'devDependencies':
      return yellow('d')
    case 'optionalDependencies':
      return cyan('o')
  }
}

const titles = ['name', 'current', 'newer', 'latest'] as const
type Title = typeof titles[number]

export function displayUpdatePlan(
  plan: UpdatePlan,
  depsMap: Record<string, Dependency>,
  semverIssues: Record<string, SemVerIssue>,
  networkIssues: Record<string, NetworkIssue>,
  options: SanCheckOptions,
) {
  const hasNetworkIssue = Object.keys(networkIssues).length > 0
  const hasSemverIssue = Object.keys(semverIssues).length > 0
  const size = getColumnSize(plan, depsMap)

  if (hasNetworkIssue) {
    displayNetworkIssues(networkIssues, options)
  }

  if (hasSemverIssue) {
    displayListsWithSemverIssue(semverIssues, plan, depsMap, size)
  }

  const nameOfNewer = Object.keys(plan.toNewer)
  const hasNewer = nameOfNewer.length !== 0

  if (!hasNewer && !hasNetworkIssue && !hasSemverIssue) {
    print.di('\nAll packages are ', green('up to date'), '!')
  }

  if (!options.checkLatest) {
    if (hasNewer) {
      print.di('\nPackage(s) having ', ...Newer, ' versions:')
      displayList(nameOfNewer, plan, depsMap, size)
    }

    const nameOfLatest = Object.keys(plan.toLatest)
      .filter((name) => {
        if (name in plan.toNewer) return false
        if (name in semverIssues) return false
        if (name in networkIssues) return false
        return true
      })

    if (nameOfLatest.length > 0) {
      print.di('\nOther package(s) having ', ...Latest, ' versions:')
      displayList(nameOfLatest, plan, depsMap, size, { showNewer: false })
    }
  } else {
    const nameOfLatest = Object.keys(plan.toLatest)
      .filter((name) => {
        if (name in semverIssues) return false
        if (name in networkIssues) return false
        return true
      })

    if (nameOfLatest.length > 0) {
      print.di('\nPackage(s) having ', ...Latest, ' versions:')
      displayList(nameOfLatest, plan, depsMap, size, { useDitto: 'newer' })
    }
  }
}

function getColumnSize(
  plan: UpdatePlan,
  depsMap: Record<string, Dependency>,
): Record<Title, number> {
  const stats: Record<Title, number> = {
    name: 4,
    current: 0,
    newer: 5,
    latest: 6,
  }

  for (const [name, verange] of Object.entries(plan.toNewer)) {
    const dep = depsMap[name]
    if (dep == null) continue

    stats.name = Math.max(stats.name, name.length)

    const from = plan.from[stats.name]
    const current = from ? formatVerange(from) : dep.rangeClean
    stats.current = Math.max(stats.current, current.length)

    const newer = formatVerange(verange).length
    stats.newer = Math.max(stats.newer, newer)
  }

  for (const [name, verange] of Object.entries(plan.toLatest)) {
    if (name in plan.toNewer) continue

    const dep = depsMap[name]
    if (dep == null) continue

    stats.name = Math.max(stats.name, name.length)

    const from = plan.from[stats.name]
    const current = from ? formatVerange(from) : dep.rangeClean
    stats.current = Math.max(stats.current, current.length)

    const latest = formatVerange(verange).length
    stats.latest = Math.max(stats.latest, latest)
  }

  return stats
}

interface DisplayListOptions {
  showNewer: boolean
  useDitto: 'newer' | 'latest'
}

const ditto = '..'

function displayList(
  names: string[],
  plan: UpdatePlan,
  depsMap: Record<string, Dependency>,
  size: Record<Title, number>,
  options?: Partial<DisplayListOptions>,
) {
  const showNewer = options?.showNewer ?? true
  const useDitto = options?.useDitto ?? 'latest'

  print.di(
    '\n    ',
    ...Name,
    ' '.repeat(size.name + size.current + 2),
    ...(showNewer
      ? [' '.repeat(size.newer - 5), ...Newer, '  ']
      : [' '.repeat(size.newer + 2)]),
    ' '.repeat(size.latest - 6),
    ...Latest,
  )

  for (const name of names) {
    const dep = depsMap[name]
    if (!dep) continue

    const from = plan.from[dep.name]
    const current = from ? formatVerange(from) : dep.rangeClean

    const pieces: DeclourPiece[] = [
      ' ',
      ...head(dep.type),
      '  ',
      dep.name,
      ' '.repeat(size.name - dep.name.length),
      ' ',
      ' '.repeat(size.current - current.length),
      current,
      '  →  ',
    ]

    const newer = plan.toNewer[dep.name]
    let newerText: string | null = null

    const latest = plan.toLatest[dep.name]
    let latestText = formatVerange(latest)

    if (newer && showNewer) {
      newerText = formatVerange(newer)

      if (useDitto === 'newer' && newerText === latestText) {
        pieces.push(
          ' '.repeat(size.newer - ditto.length),
          ditto,
        )
      } else {
        const newerDeclour = colorizeVerangeDiff(newer, from)!
        pieces.push(
          ' '.repeat(size.newer - newerText.length),
          ...newerDeclour,
        )
      }

      pieces.push('  ')
    } else {
      pieces.push(' '.repeat(size.newer + 2))
    }

    if (
      newerText != null
      && useDitto === 'latest'
      && latestText === newerText
    ) {
      pieces.push(
        ' '.repeat(size.latest - ditto.length),
        ditto,
      )
    } else {
      pieces.push(' '.repeat(size.latest - latestText.length))

      if (from) {
        const latestDeclour = colorizeVerangeDiff(latest, from)!
        pieces.push(...latestDeclour)
      } else {
        pieces.push(formatVerange(latest))
      }
    }

    print.di(...pieces)
  }
}

function displayNetworkIssues(
  networkIssues: Record<string, NetworkIssue>,
  options: SanCheckOptions,
) {
  const byIssue: Record<NetworkIssue, string[]> = {
    'no-provider': [],
    failed: [],
    invalid: [],
  }

  for (const [name, issue] of Object.entries(networkIssues)) {
    byIssue[issue].push(name)
  }

  if (byIssue['no-provider'].length > 0) {
    print.di('\nThe provider', blue(options.provider), 'is not available.')
  }

  if (byIssue.failed.length > 0) {
    print.i(`\nPackage(s) not checked due to network issue:`)
    print.di('  ', interpose(red(byIssue.failed), ', '))
  }

  if (byIssue.invalid.length > 0) {
    print.i(`\nPackage(s) whose version cannot be retrieved:`)
    print.di('  ', interpose(red(byIssue.invalid), ', '))
  }
}

function displayListsWithSemverIssue(
  semverIssues: Record<string, SemVerIssue>,
  plan: UpdatePlan,
  depsMap: Record<string, Dependency>,
  size: Record<Title, number>,
) {
  const byIssue: Record<SemVerIssue, string[]> = {
    invalid: [],
    complex: [],
  }

  for (const [name, issue] of Object.entries(semverIssues)) {
    byIssue[issue].push(name)
  }

  if (byIssue.invalid.length > 0) {
    print.di('\nPackage(s) having ', red('invalid'), ' semvers:')
    displayList(byIssue.invalid, plan, depsMap, size, { showNewer: false })
  }

  if (byIssue.complex.length > 0) {
    print.di('\nPackage(s) having ', yellow('complex'), ' semvers (for you to take care):')
    displayList(byIssue.complex, plan, depsMap, size, { showNewer: false })
  }
}
