import type { SetRequired } from 'type-fest'
import type { PrereleaseIdentifier, SemVer } from 'verkit'
import { comparePrereleases } from './utils'
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
} from '@declour/index'

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

type SemVerPart = 'major' | 'minor' | 'patch' | 'prerelease'

const applyForMinor = new Set(['major', 'minor'])
const applyForPatch = new Set(['major', 'minor', 'patch'])

export function mimicVerbase(
  source: Verbase,
  target: SemVer,
  from: SemVerPart,
) {
  const mimicked: Verbase = structuredClone(source)

  if (from === 'major' && !isWildcard(mimicked.major)) {
    mimicked.major = target.major
  }

  if (
    applyForMinor.has(from)
    && mimicked.minor != null
    && !isWildcard(mimicked.minor)
  ) {
    mimicked.minor = target.minor
  }

  if (
    applyForPatch.has(from)
    && mimicked.patch != null
    && !isWildcard(mimicked.patch)
  ) {
    mimicked.patch = target.patch
  }

  if (isPrerelease(target)) {
    mimicked.prerelease = [...target.prerelease]
  } else {
    delete mimicked.prerelease
  }

  return mimicked
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

interface ColorizeOptions {
  base: Verbase
  color: DeclourAtom
  fromPart: SemVerPart
  fromPreIndex?: number
}

export function colorizeVerbase(options: ColorizeOptions): DeclourPiece[] {
  const { base, color, fromPart, fromPreIndex } = options
  const decloured: DeclourPiece[] = []

  const majorColor = fromPart === 'major' ? color : noop
  decloured.push(majorColor(String(base.major)))

  if (base.minor != null) {
    const minorColor = applyForMinor.has(fromPart) ? color : noop
    decloured.push(minorColor('.', String(base.minor)))
  }

  if (base.patch != null) {
    const patchColor = applyForPatch.has(fromPart) ? color : noop
    decloured.push(patchColor('.', String(base.patch)))
  }

  if (base.prerelease != null) {
    // The identifiers before the differing one are left uncoloured.
    const index = fromPreIndex ?? 0
    const same = base.prerelease.slice(0, index).join('.')
    const diff = base.prerelease.slice(index).join('.')
    const preColor = fromPart !== 'prerelease' ? color : noop

    if (same.length > 0) decloured.push(preColor(same))
    if (same.length > 0 && diff.length > 0) decloured.push(preColor('.'))
    if (diff.length > 0) decloured.push(color(diff))
  }

  return decloured
}

interface AlignResult {
  needAlign: boolean
  aligned: string
  decloured: DeclourPiece[]
}

function createUnchangedResult(base: Verbase): AlignResult {
  const formatted = formatVerbase(base)

  return {
    needAlign: false,
    aligned: formatted,
    decloured: [formatted],
  }
}

function createAlignedResult(
  base: Verbase,
  color: DeclourAtom,
  fromPart: SemVerPart,
  fromPreIndex?: number,
): AlignResult {
  return {
    needAlign: true,
    aligned: formatVerbase(base),
    decloured: colorizeVerbase({ base, color, fromPart, fromPreIndex }),
  }
}

function alignMajor(source: Verbase, target: SemVer): AlignResult | null {
  if (isWildcard(source.major)) {
    return createUnchangedResult(source)
  }

  if (source.major === target.major) return null
  const mimicked = mimicVerbase(source, target, 'major')

  if (source.major < target.major) {
    return createAlignedResult(mimicked, red, 'major')
  } else {
    return createAlignedResult(mimicked, compose(black, bgRed), 'major')
  }
}

function alignMinor(source: Verbase, target: SemVer): AlignResult | null {
  if (source.minor == null) return null

  if (isWildcard(source.minor)) {
    return createUnchangedResult(source)
  }

  if (source.minor === target.minor) return null
  const mimicked = mimicVerbase(source, target, 'minor')

  if (source.minor < target.minor) {
    const color = source.major === 0 ? red : cyan
    return createAlignedResult(mimicked, color, 'minor')
  } else {
    return createAlignedResult(mimicked, compose(black, bgRed), 'minor')
  }
}

function alignPatch(source: Verbase, target: SemVer): AlignResult | null {
  if (source.patch == null) return null

  if (isWildcard(source.patch)) {
    return createUnchangedResult(source)
  }

  if (source.patch === target.patch) return null
  const mimicked = mimicVerbase(source, target, 'patch')

  if (source.patch < target.patch) {
    let color: DeclourAtom

    if (source.major === 0 && source.minor === 0) {
      color = red
    } else if (source.major === 0) {
      color = cyan
    } else {
      color = green
    }

    return createAlignedResult(mimicked, color, 'patch')
  } else {
    return createAlignedResult(mimicked, compose(black, bgRed), 'patch')
  }
}

function alignPrerelease(source: Verbase, target: SemVer): AlignResult | null {
  if (!isPrerelease(source) || !isPrerelease(target)) return null

  const compared = comparePrereleases(source.prerelease, target.prerelease)
  if (compared.result === 0) return null
  const mimicked = mimicVerbase(source, target, 'prerelease')
  const index = compared.differFromIndex

  if (compared.result < 0) {
    return createAlignedResult(mimicked, yellow, 'prerelease', index)
  } else {
    return createAlignedResult(mimicked, compose(black, bgRed), 'prerelease', index)
  }
}

export function alignVerbase(source: Verbase, target: SemVer): AlignResult {
  const majorAligned = alignMajor(source, target)
  if (majorAligned) return majorAligned

  const minorAligned = alignMinor(source, target)
  if (minorAligned) return minorAligned

  const patchAligned = alignPatch(source, target)
  if (patchAligned) return patchAligned

  const prereleaseAligned = alignPrerelease(source, target)
  if (prereleaseAligned) return prereleaseAligned

  return createUnchangedResult(source)
}
