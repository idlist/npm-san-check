const Wildcards = ['*', 'x', 'X']

type WildcardChar = '*' | 'x' | 'X'

const parseIntOrWildcard = (raw: string): number | WildcardChar => {
  return Wildcards.includes(raw) ? raw as WildcardChar : parseInt(raw)
}

export interface RangeBase {
  major: number | WildcardChar
  minor: number | WildcardChar
  includeMinor: boolean
  patch: number | WildcardChar
  includePatch: boolean
  prerelease: string[]
  includePrerelease: boolean
  build: string[]
  includeBuild: boolean
}

export const parseRangeBase = (raw: string) => {
  const [rest, buildRaw] = raw.split('+', 2)
  const [main, prereleaseRaw] = rest.split('-', 2)

  const parts = main.split('.')
  const major = parseIntOrWildcard(parts[0])

  let minor: number | WildcardChar = 0
  let includeMinor = false
  if (parts.length >= 2) {
    minor = parseIntOrWildcard(parts[1])
    includeMinor = true
  }

  let patch: number | WildcardChar = 0
  let includePatch = false
  if (parts.length >= 3) {
    patch = parseIntOrWildcard(parts[2])
    includePatch = true
  }

  let prerelease: string[] = []
  let includePrerelease = false
  if (prereleaseRaw) {
    prerelease = prereleaseRaw.split('.')
    includePrerelease = true
  }

  let build: string[] = []
  let includeBuild = false
  if (buildRaw) {
    build = buildRaw.split('.')
    includeBuild = true
  }

  return {
    major,
    minor,
    includeMinor,
    patch,
    includePatch,
    prerelease,
    includePrerelease,
    build,
    includeBuild,
  }
}

export const formatRangeBase = (base: RangeBase) => {
  return `${base.major}`
  + (base.includeMinor ? `.${base.minor}` : '')
  + (base.includePatch ? `.${base.patch}` : '')
  + (base.includePrerelease ? `-${base.prerelease.join('.')}` : '')
  + (base.includeBuild ? `+${base.build.join('.')}` : '')
}
