import c, { Color } from 'kleur'
import { SemverParts, type Prerelease, type Semver, type SemverPart } from './semver.js'
import { isWildcard, isWildcardOrNumber, parseIntOrWildcard, type WildcardChar } from './wildcard.js'

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
      .filter((s) => /^[0-9A-Za-z]+$/.test(s))
      .map((s) => /^\d+$/.test(s) ? parseInt(s) : s)
    includePrerelease = true
  }

  let build: string[] = []
  if (buildRaw) {
    build = buildRaw.split('.').filter((s) => /^[0-9A-Za-z]+$/.test(s))
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
    if (typeof a[i] == typeof b[i]) {
      if (a[i] != b[i]) {
        return {
          result: a[i] < b[i] ? -1 : 1,
          index: i,
        }
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

const none = c.white

const useColor = (part: number | WildcardChar, color?: Color) => {
  return isWildcard(part) && color ? color : none
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

  const is = (cond: boolean, content: string) => cond ? content : ''
  const major = useColor(base.major, color.major)
  const minor = useColor(base.minor, color.minor)
  const patch = useColor(base.patch, color.patch)
  const preA = color.prereleaseA ?? none
  const preB = color.prereleaseB ?? none

  return major(`${base.major}`)
    + is(base.includeMinor, major('.') + minor(`${base.minor}`))
    + is(base.includePatch, minor('.') + patch(`${base.patch}`))
    + is(base.includePrerelease, patch('-') + preA(base.prerelease.slice(0, v.index).join('.')))
    + is(base.includePrerelease, preA('.') + preB(base.prerelease.slice(v.index).join('.')))
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
  }

  return cloned
}

interface UpdateRangeBaseOptions {
  prerelease: boolean
}

interface UpdatedRangeBase {
  result: -1 | 0 | 1
  updated: string
  updatedColored: string
}

export const updateRangeBase = (
  from: RangeBase,
  to: Semver,
  options: Partial<UpdateRangeBaseOptions>,
): UpdatedRangeBase => {
  const v: UpdateRangeBaseOptions = {
    prerelease: false,
    ...options,
  }

  if (isWildcardOrNumber(from.major)) {
    const updated = from.major

    return {
      result: 0,
      updated,
      updatedColored: updated,
    }
  } else if (from.major != to.major) {
    const updated = overrideRangeBaseFrom(from, to, 'major')

    if (from.major < to.major) {
      return {
        result: -1,
        updated: formatRangeBase(updated),
        updatedColored: formatRangeBase(updated, useRangeColorByPart('major', c.bgRed().black)),
      }
    } else {
      return {
        result: 1,
        updated: formatRangeBase(updated),
        updatedColored: formatRangeBase(updated, useRangeColorByPart('major', c.red)),
      }
    }
  } else if (from.includeMinor) {
    if (isWildcardOrNumber(from.minor)) {
      const updated = `${from.major}.${from.minor}`

      return {
        result: 0,
        updated,
        updatedColored: updated,
      }
    } else if (from.minor != to.minor) {
      const updated = overrideRangeBaseFrom(from, to, 'minor')

      if (from.minor < to.minor) {
        return {
          result: -1,
          updated: formatRangeBase(updated),
          updatedColored: formatRangeBase(updated, useRangeColorByPart('minor', c.bgRed().black)),
        }
      } else {
        let color: Color

        if (from.major == 0) {
          color = c.red
        } else {
          color = c.blue
        }

        return {
          result: 1,
          updated: formatRangeBase(updated),
          updatedColored: formatRangeBase(updated, useRangeColorByPart('minor', color)),
        }
      }
    }
  } else if (from.includePatch) {
    if (isWildcardOrNumber(from.patch)) {
      const updated = `${from.major}.${from.minor}.${from.patch}`

      return {
        result: 0,
        updated,
        updatedColored: updated,
      }
    } else if (from.patch != to.patch) {
      const updated = overrideRangeBaseFrom(from, to, 'minor')

      if (from.patch < to.patch) {
        return {
          result: -1,
          updated: formatRangeBase(updated),
          updatedColored: formatRangeBase(updated, useRangeColorByPart('patch', c.bgRed().black)),
        }
      } else {
        let color: Color

        if (from.minor == 0) {
          color = c.red
        } else if (from.major == 0) {
          color = c.blue
        } else {
          color = c.green
        }

        return {
          result: 0,
          updated: formatRangeBase(updated),
          updatedColored: formatRangeBase(updated, useRangeColorByPart('patch', color)),
        }
      }
    }
  } else if (v.prerelease && from.includePrerelease) {
    const compared = comparePrerelease(from.prerelease, to.prerelease)

    if (compared.result != 0) {
      const updated = overrideRangeBaseFrom(from, to, 'prerelease')

      if (compared.result < 0) {
        return {
          result: -1,
          updated: formatRangeBase(updated),
          updatedColored: formatRangeBase(updated, useRangeColorByPart('prereleaseB', c.bgRed().black)),
        }
      } else {
        return {
          result: 1,
          updated: formatRangeBase(updated),
          updatedColored: formatRangeBase(updated, useRangeColorByPart('prereleaseB', c.yellow)),
        }
      }
    }
  }

  const updated = formatRangeBase(clone(from))

  return {
    result: 0,
    updated,
    updatedColored: updated,
  }
}
