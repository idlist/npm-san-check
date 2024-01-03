import c, { Color } from 'kleur'
import { SemverParts, type SemverPart, type Semver } from './semver.js'
import { isWildcard, isWildcardOrNumber, parseIntOrWildcard, type WildcardChar } from './wildcard.js'

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

type RangeBaseColor = Partial<Record<SemverPart, Color>>

const none = c.white

const useColor = (part: number | WildcardChar, color?: Color) => {
  return isWildcard(part) && color ? color : none
}

export const formatRangeBase = (base: RangeBase, color: RangeBaseColor = {}) => {
  const major = useColor(base.major, color.major)
  const minor = useColor(base.minor, color.minor)
  const patch = useColor(base.patch, color.patch)
  const prerelease = color.prerelease ?? none
  const build = color.build ?? none

  return major(`${base.major}`)
    + (base.includeMinor ? major('.') + minor(`${base.minor}`) : '')
    + (base.includePatch ? minor('.') + patch(`${base.patch}`) : '')
    + (base.includePrerelease ? patch('-') + prerelease(base.prerelease.join('.')) : '')
    + (base.includeBuild ? prerelease('+') + build(base.build.join('.')) : '')
}

export const useRangeColorByPart = (key: SemverPart, color: Color): RangeBaseColor => {
  let currentColor: Color | undefined
  const used: RangeBaseColor = {}

  for (const part of SemverParts) {
    if (part == key) {
      currentColor = color
    }
    if (currentColor) {
      used[part] = currentColor
    }
  }

  return used
}

const clone = structuredClone

interface UpdatedRangeBase {
  result: -1 | 0 | 1
  to: string
  toColored: string
}

export const overrideRangeBaseFrom = (lhs: RangeBase, rhs: Semver, part: SemverPart): RangeBase => {
  const cloned = clone(lhs)
  const pos = SemverParts.findIndex((value) => value == part)

  for (let i = pos; i < SemverParts.length; i++) {
    const key = SemverParts[i]
    cloned[key] = clone(rhs[key]) as never
  }

  return cloned
}

export const updateRangeBase = (lhs: RangeBase, rhs: Semver): UpdatedRangeBase => {
  if (isWildcardOrNumber(lhs.major)) {
    const to = lhs.major

    return {
      result: 0,
      to,
      toColored: to,
    }
  } else if (lhs.major != rhs.major) {
    const to = overrideRangeBaseFrom(lhs, rhs, 'major')

    if (lhs.major > rhs.major) {
      return {
        result: 1,
        to: formatRangeBase(to),
        toColored: formatRangeBase(to, useRangeColorByPart('major', c.red)),
      }
    } else {
      return {
        result: -1,
        to: formatRangeBase(to),
        toColored: formatRangeBase(to, useRangeColorByPart('major', c.bgRed().black)),
      }
    }
  } else if (isWildcardOrNumber(lhs.minor)) {
    const to = `${lhs.major}.${lhs.minor}`

    return {
      result: 0,
      to,
      toColored: to,
    }
  } else if (lhs.minor != rhs.minor) {
    const to = overrideRangeBaseFrom(lhs, rhs, 'major')

  } else if (isWildcardOrNumber(lhs.patch)) {

  } else if (lhs.patch != rhs.patch) {

  } else {
    const to = formatRangeBase(clone(lhs))

    return {
      result: 0,
      to,
      toColored: to,
    }
  }
}
