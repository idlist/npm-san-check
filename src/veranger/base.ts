import type { SetRequired } from 'type-fest'
import type { PrereleaseIdentifier, SemVer } from 'verkit'
import { comparePrerelease } from './utils'
import { isWildcard, type NumberOrWildcard, parseIntOrWildcard } from './wildcard'

import {
  bgRed,
  black,
  compose,
  cyan,
  type DeclourAtom,
  type DeclourPiece,
  green,
  noop,
  red,
  yellow,
} from '@src/declour'

export interface Verbase {
  major: NumberOrWildcard
  minor?: NumberOrWildcard
  patch?: NumberOrWildcard
  prerelease?: PrereleaseIdentifier[]
  build?: string[]
}

export function parseVerbase(raw: string) {
  const [rest, rawBuild] = raw.split('+', 2)
  const [main, rawPrerelease] = rest.split('-', 2)

  const parts = main.split('.')
  const major = parseIntOrWildcard(parts[0])
  if (Number.isNaN(major)) return

  const verbase: Verbase = { major }

  if (parts.length >= 2) {
    const minor = parseIntOrWildcard(parts[1])
    if (!Number.isNaN(minor)) verbase.minor = minor
  }

  if (parts.length >= 3) {
    const patch = parseIntOrWildcard(parts[2])
    if (!Number.isNaN(patch)) verbase.patch = patch
  }

  if (rawPrerelease) {
    const prerelease = rawPrerelease
      .split('.')
      .filter((s) => /^[0-9A-Za-z-]+$/.test(s))
      .map((s) => /^\d+$/.test(s) ? parseInt(s) : s)
    verbase.prerelease = prerelease
  }

  if (rawBuild) {
    const build = rawBuild
      .split('.')
      .filter((s) => /^[0-9A-Za-z-]+$/.test(s))
    verbase.build = build
  }

  return verbase
}

export function isPrerelease(
  base: Verbase | SemVer,
): base is SetRequired<Verbase | SemVer, 'prerelease'> {
  return base.prerelease != null && base.prerelease.length > 0
}

export function takeVerbaseFromSemVer(from: SemVer): Verbase {
  const verbase: Verbase = {
    major: from.major,
    minor: from.minor,
    patch: from.patch,
  }

  if (from.prerelease?.length) verbase.prerelease = [...from.prerelease]
  if (from.build?.length) verbase.build = [...from.build]

  return verbase
}

export function formatVerbase(base: Verbase) {
  const { major, minor, patch, prerelease, build } = base
  let formatted = String(major)

  if (minor != null) formatted += `.${minor}`
  if (patch != null) formatted += `.${patch}`
  if (prerelease?.length) formatted += `-${prerelease.join('.')}`
  if (build?.length) formatted += `+${build.join('.')}`

  return formatted
}

type SemVerPart = 'major' | 'minor' | 'patch' | 'prerelease'

const affectsMinor = new Set(['major', 'minor'])
const affectsPatch = new Set(['major', 'minor', 'patch'])

function alignVerbase(source: Verbase, target: SemVer, from: SemVerPart) {
  const aligned: Verbase = structuredClone(source)

  if (from === 'major' && !isWildcard(aligned.major)) {
    aligned.major = target.major
  }

  if (
    affectsMinor.has(from)
    && aligned.minor != null
    && !isWildcard(aligned.minor)
  ) {
    aligned.minor = target.minor
  }

  if (
    affectsPatch.has(from)
    && aligned.patch != null
    && !isWildcard(aligned.patch)
  ) {
    aligned.patch = target.patch
  }

  if (isPrerelease(target)) {
    aligned.prerelease = [...target.prerelease]
  } else {
    delete aligned.prerelease
  }

  return aligned
}

export function updateVerbase(source: Verbase, target: SemVer): Verbase | null {
  const majorMaybeUpdated = tryUpdateMajor(source, target)
  if (majorMaybeUpdated) return majorMaybeUpdated

  const minorMaybeUpdated = tryUpdateMinor(source, target)
  if (minorMaybeUpdated) return minorMaybeUpdated

  const patchMaybeUpdated = tryUpdatePatch(source, target)
  if (patchMaybeUpdated) return patchMaybeUpdated

  const prereleaseMaybeUpdated = tryUpdatePrerelease(source, target)
  if (prereleaseMaybeUpdated) return prereleaseMaybeUpdated

  return null
}

function tryUpdateMajor(source: Verbase, target: SemVer): Verbase | null {
  if (isWildcard(source.major)) return null
  if (source.major === target.major) return null
  return alignVerbase(source, target, 'major')
}

function tryUpdateMinor(source: Verbase, target: SemVer): Verbase | null {
  if (source.minor == null) return null
  if (isWildcard(source.minor)) return null
  if (source.minor === target.minor) return null
  return alignVerbase(source, target, 'minor')
}

function tryUpdatePatch(source: Verbase, target: SemVer): Verbase | null {
  if (source.patch == null) return null
  if (isWildcard(source.patch)) return null
  if (source.patch === target.patch) return null
  return alignVerbase(source, target, 'patch')
}

function tryUpdatePrerelease(source: Verbase, target: SemVer): Verbase | null {
  if (!isPrerelease(source) || !isPrerelease(target)) return null
  const compared = comparePrerelease(source.prerelease, target.prerelease)
  if (compared.result === 0) return null
  return alignVerbase(source, target, 'prerelease')
}

interface ColorizeOptions {
  base: Verbase
  color: DeclourAtom
  from: SemVerPart
  fromPreIndex?: number
}

function colorizeVerbase(options: ColorizeOptions): DeclourPiece[] {
  const { base, color, from, fromPreIndex } = options
  const declour: DeclourPiece[] = []

  const majorColor = from === 'major' ? color : noop
  declour.push(majorColor(String(base.major)))

  if (base.minor != null) {
    const minorColor = affectsMinor.has(from) ? color : noop
    declour.push(minorColor('.', String(base.minor)))
  }

  if (base.patch != null) {
    const patchColor = affectsPatch.has(from) ? color : noop
    declour.push(patchColor('.', String(base.patch)))
  }

  if (base.prerelease != null) {
    // The identifiers before the differing one are left uncoloured.
    const index = fromPreIndex ?? 0
    const same = base.prerelease.slice(0, index).join('.')
    const diff = base.prerelease.slice(index).join('.')
    const preColor = from !== 'prerelease' ? color : noop

    declour.push(preColor('-'))
    if (same.length > 0) declour.push(preColor(same))
    if (same.length > 0 && diff.length > 0) declour.push(preColor('.'))
    if (diff.length > 0) declour.push(color(diff))
  }

  return declour
}

export function colorizeVerbaseDiff(base: Verbase, from: Verbase): DeclourPiece[] {
  if (isWildcard(base.major) || isWildcard(from.major)) {
    return [formatVerbase(base)]
  }
  if (base.major > from.major) {
    return colorizeVerbase({
      base,
      color: red,
      from: 'major',
    })
  } else if (base.major < from.major) {
    return colorizeVerbase({
      base,
      color: compose(black, bgRed),
      from: 'major',
    })
  }

  if (base.minor != null && from.minor != null) {
    if (isWildcard(base.minor) || isWildcard(from.minor)) {
      return [formatVerbase(base)]
    } else if (base.minor > from.minor) {
      return colorizeVerbase({
        base,
        color: base.major === 0 ? red : cyan,
        from: 'minor',
      })
    } else if (base.minor < from.minor) {
      return colorizeVerbase({
        base,
        color: compose(black, bgRed),
        from: 'minor',
      })
    }
  }

  if (base.patch != null && from.patch != null) {
    if (isWildcard(base.patch) || isWildcard(from.patch)) {
      return [formatVerbase(base)]
    } else if (base.patch > from.patch) {
      let color: DeclourAtom

      if (base.major === 0 && base.minor === 0) {
        color = red
      } else if (base.major === 0) {
        color = cyan
      } else {
        color = green
      }

      return colorizeVerbase({
        base,
        color,
        from: 'patch',
      })
    } else if (base.patch < from.patch) {
      return colorizeVerbase({
        base,
        color: compose(black, bgRed),
        from: 'patch',
      })
    }
  }

  if (isPrerelease(base) && isPrerelease(from)) {
    const compared = comparePrerelease(base.prerelease, from.prerelease)

    if (compared.result > 0) {
      return colorizeVerbase({
        base,
        color: yellow,
        from: 'prerelease',
        fromPreIndex: compared.differFromIndex,
      })
    } else if (compared.result < 0) {
      return colorizeVerbase({
        base,
        color: compose(black, bgRed),
        from: 'prerelease',
        fromPreIndex: compared.differFromIndex,
      })
    }
  }

  return [formatVerbase(base)]
}
