import c, { Color } from 'kleur'
import { SemverParts, type Prerelease, type Semver, type SemverPart, takeSemverFrom } from './semver.js'
import { isWildcard, isWildcardOrNumber, parseIntOrWildcard, type WildcardChar } from './wildcard.js'
import { SemVer } from 'semver'

export interface RangeBase {
  major: number | WildcardChar
  minor: number | WildcardChar
  includeMinor: boolean
  patch: number | WildcardChar
  includePatch: boolean
  prerelease: Prerelease
  includePrerelease: boolean
  build: string[]
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

  let prerelease: Prerelease = []
  let includePrerelease = false
  if (prereleaseRaw) {
    prerelease = prereleaseRaw
      .split('.')
      .filter((s) => /^[0-9A-Za-z-]+$/.test(s))
      .map((s) => /^\d+$/.test(s) ? parseInt(s) : s)
    includePrerelease = true
  }

  let build: string[] = []
  if (buildRaw) {
    build = buildRaw.split('.').filter((s) => /^[0-9A-Za-z-]+$/.test(s))
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
  }
}

interface ComparedPrereleaseEqual {
  result: 0
}

interface ComparedPrereleaseInequal {
  result: -1 | 1
  index: number
}

type ComparedPrerelease = ComparedPrereleaseEqual | ComparedPrereleaseInequal

export const comparePrerelease = (a: Prerelease, b: Prerelease): ComparedPrerelease => {
  const length = a.length < b.length ? a.length : b.length

  for (let i = 0; i < length; i++) {
    if (typeof a[i] == typeof b[i] && a[i] != b[i]) {
      return {
        result: a[i] < b[i] ? -1 : 1,
        index: i,
      }
    } else if (typeof a[i] == 'number' && typeof b[i] == 'string') {
      return {
        result: -1,
        index: i,
      }
    } else if (typeof a[i] == 'string' && typeof b[i] == 'number') {
      return {
        result: 1,
        index: i,
      }
    }
  }

  if (a.length == b.length) {
    return {
      result: 0,
    }
  } else {
    return {
      result: a.length < b.length ? -1 : 1,
      index: length,
    }
  }
}

const ColoredParts = ['major', 'minor', 'patch', 'prereleaseA', 'prereleaseB'] as const

type ColoredPart = typeof ColoredParts[number]

type RangeBaseColor = Partial<Record<ColoredPart, Color>>

const none = (a: string) => a

const useColor = (part: number | WildcardChar, color?: Color) => {
  return !isWildcard(part) && color ? color : none
}

interface FormatRangeOptions {
  index: number
  build: boolean
}

export const formatRangeBase = (
  base: RangeBase,
  color: RangeBaseColor = {},
  options: Partial<FormatRangeOptions> = {},
) => {
  const v = {
    index: 0,
    build: false,
    ...options,
  }

  const is = (cond: unknown, content: string) => cond ? content : ''
  const major = useColor(base.major, color.major)
  const minor = useColor(base.minor, color.minor)
  const patch = useColor(base.patch, color.patch)
  const preA = color.prereleaseA ?? none
  const preB = color.prereleaseB ?? none
  const preSegmentA = base.prerelease.slice(0, v.index)
  const preSegmentB = base.prerelease.slice(v.index)

  return major(`${base.major}`)
    + is(base.includeMinor, major('.') + minor(`${base.minor}`))
    + is(base.includePatch, minor('.') + patch(`${base.patch}`))
    + is(base.includePrerelease, patch('-') + preA(preSegmentA.join('.')))
    + is(base.includePrerelease, is(preSegmentA.length, preA('.')) + preB(preSegmentB.join('.')))
    + is(v.build, `+${base.build.join('.')}`)
}

export const useRangeColorByPart = (key: ColoredPart, color: Color): RangeBaseColor => {
  let currentColor: Color | undefined
  const used: RangeBaseColor = {}

  for (const part of ColoredParts) {
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

export const overrideRangeBaseFrom = (from: RangeBase, to: Semver, part: SemverPart): RangeBase => {
  const cloned = clone(from)
  const pos = SemverParts.findIndex((value) => value == part)

  for (let i = pos; i < SemverParts.length; i++) {
    const key = SemverParts[i]
    cloned[key] = clone(to[key]) as never

    if (key == 'prerelease' && to.prerelease.length) {
      cloned.includePrerelease = to.prerelease.length ? true : false
    }
  }

  return cloned
}

interface UpdateRangeBaseOptions {
  prerelease: boolean
}

interface UpdatedRangeBase {
  result: -1 | 0 | 1
  to: string
  toColored: string
}

export const updateRangeBase = (
  a: RangeBase,
  b: Semver | SemVer,
  options: Partial<UpdateRangeBaseOptions>,
): UpdatedRangeBase => {
  if (b instanceof SemVer) {
    b = takeSemverFrom(b)
  }

  const v: UpdateRangeBaseOptions = {
    prerelease: false,
    ...options,
  }

  if (isWildcardOrNumber(a.major)) {
    const to = a.major

    return {
      result: 0,
      to,
      toColored: to,
    }
  } else if (a.major != b.major) {
    const to = overrideRangeBaseFrom(a, b, 'major')

    if (a.major > b.major) {
      return {
        result: -1,
        to: formatRangeBase(to),
        toColored: formatRangeBase(to, useRangeColorByPart('major', c.bgRed().black)),
      }
    } else {
      return {
        result: 1,
        to: formatRangeBase(to),
        toColored: formatRangeBase(to, useRangeColorByPart('major', c.red)),
      }
    }
  }

  if (a.includeMinor) {
    if (isWildcardOrNumber(a.minor)) {
      const to = `${a.major}.${a.minor}`

      return {
        result: 0,
        to,
        toColored: to,
      }
    } else if (a.minor != b.minor) {
      const to = overrideRangeBaseFrom(a, b, 'minor')

      if (a.minor > b.minor) {
        return {
          result: -1,
          to: formatRangeBase(to),
          toColored: formatRangeBase(to, useRangeColorByPart('minor', c.bgRed().black)),
        }
      } else {
        let color: Color

        if (a.major == 0) {
          color = c.red
        } else {
          color = c.cyan
        }

        return {
          result: 1,
          to: formatRangeBase(to),
          toColored: formatRangeBase(to, useRangeColorByPart('minor', color)),
        }
      }
    }
  }

  if (a.includePatch) {
    if (isWildcardOrNumber(a.patch)) {
      const to = `${a.major}.${a.minor}.${a.patch}`

      return {
        result: 0,
        to,
        toColored: to,
      }
    } else if (a.patch != b.patch) {
      const to = overrideRangeBaseFrom(a, b, 'patch')

      if (a.patch > b.patch) {
        return {
          result: -1,
          to: formatRangeBase(to),
          toColored: formatRangeBase(to, useRangeColorByPart('patch', c.bgRed().black)),
        }
      } else {
        let color: Color

        if (a.minor == 0) {
          color = c.red
        } else if (a.major == 0) {
          color = c.cyan
        } else {
          color = c.green
        }

        return {
          result: 1,
          to: formatRangeBase(to),
          toColored: formatRangeBase(to, useRangeColorByPart('patch', color)),
        }
      }
    }
  }

  if (v.prerelease && a.includePrerelease) {
    const compared = comparePrerelease(a.prerelease, b.prerelease)

    if (compared.result != 0) {
      const to = overrideRangeBaseFrom(a, b, 'prerelease')

      if (compared.result > 0) {
        return {
          result: -1,
          to: formatRangeBase(to),
          toColored: formatRangeBase(
            to,
            useRangeColorByPart('prereleaseB', c.bgRed().black),
            { index: compared.index },
          ),
        }
      } else {
        return {
          result: 1,
          to: formatRangeBase(to),
          toColored: formatRangeBase(
            to,
            useRangeColorByPart('prereleaseB', c.yellow),
            { index: compared.index },
          ),
        }
      }
    }
  }

  const to = formatRangeBase(clone(a))

  return {
    result: 0,
    to,
    toColored: to,
  }
}
