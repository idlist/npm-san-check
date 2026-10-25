import type { DeclourPiece } from '@src/declour'
import type { SemVer } from 'verkit'

import {
  colorizeVerbaseDiff,
  formatVerbase,
  isPrerelease,
  parseVerbase,
  takeVerbaseFromSemVer,
  updateVerbase,
  type Verbase,
} from './base'

type VerangeUnaryOp = '^' | '~' | '>' | '>=' | '<' | '<=' | '=' | ''

export interface VerangeUnary {
  type: 'unary'
  op: VerangeUnaryOp
  base: Verbase
}

// TODO: support multiple unary ranges
export interface VerangeMultiple {
  type: 'multiple'
  ranges: VerangeUnary[]
}

export interface VerangeHyphen {
  type: 'hyphen'
  bases: [Verbase, Verbase]
}

export interface VerangeCompound {
  type: 'compound'
}

export type VerangeUpdatable =
  | VerangeUnary
  | VerangeHyphen

export type VerangeIgnored =
  | VerangeMultiple
  | VerangeCompound

export type Verange = VerangeUpdatable | VerangeIgnored

const ops2char = new Set(['>=', '<='])
const ops1char = new Set(['^', '~', '>', '<', '='])

export function tryParseVerange(from: string): Verange | null {
  const segments = from.split('||')

  // Skip parsing range if it is a compound range.
  if (segments.length >= 2) {
    return { type: 'compound' }
  }

  const segment = from.trim()

  // Hyphen range. Only supports single hyphen range.
  const sides = segment.split(' - ')

  if (sides.length === 2) {
    const left = parseVerbase(sides[0].trim())
    const right = parseVerbase(sides[1].trim())
    if (left == null || right == null) return null
    return { type: 'hyphen', bases: [left, right] }
  }

  const maybeOps2char = segment.slice(0, 2)
  const maybeOps1char = segment[0]

  // Unary range.
  if (ops2char.has(maybeOps2char)) {
    const op = maybeOps2char as VerangeUnaryOp
    const base = parseVerbase(segment.slice(2).trim())
    if (base == null) return null
    return { type: 'unary', op, base }
  }
  if (ops1char.has(maybeOps1char)) {
    const op = maybeOps1char as VerangeUnaryOp
    const base = parseVerbase(segment.slice(1).trim())
    if (base == null) return null
    return { type: 'unary', op, base }
  }
  if (/[\d*xX]/.test(segment[0])) {
    const base = parseVerbase(segment)
    if (base == null) return null
    return { type: 'unary', op: '', base }
  }

  return null
}

export function hasPrerelease(range: Verange): boolean {
  switch (range.type) {
    case 'unary':
      return isPrerelease(range.base)
    case 'hyphen':
      return isPrerelease(range.bases[0]) || isPrerelease(range.bases[1])
    default:
      return false
  }
}

export function takeVerangeFromSemVer(from: SemVer): VerangeUnary {
  return {
    type: 'unary',
    op: '',
    base: takeVerbaseFromSemVer(from),
  }
}

export function tryFormatVerange(range: VerangeUpdatable): string
export function tryFormatVerange(range: VerangeIgnored): null
export function tryFormatVerange(range: Verange): string | null
export function tryFormatVerange(range: Verange): string | null {
  switch (range.type) {
    case 'unary':
      return `${range.op}${formatVerbase(range.base)}`
    case 'hyphen':
      return `${formatVerbase(range.bases[0])} - ${formatVerbase(range.bases[1])}`
    default:
      return null
  }
}

export const opsCanBeNewer = new Set<VerangeUnaryOp>(['^', '~', '>', '>='])

export function updateVerangeToNewer(
  range: Verange,
  target: SemVer,
): VerangeUpdatable | null {
  switch (range.type) {
    case 'unary':
      return toNewerUnary(range, target)
    case 'hyphen':
      return toNewerHyphen(range, target)
    default:
      return null
  }
}

function toNewerUnary(
  unary: VerangeUnary,
  target: SemVer,
): VerangeUnary | null {
  if (!opsCanBeNewer.has(unary.op)) return null

  const base = updateVerbase(unary.base, target)
  if (base == null) return null

  return { type: 'unary', op: unary.op, base }
}

function toNewerHyphen(
  hyphen: VerangeHyphen,
  target: SemVer,
): VerangeHyphen | null {
  const [left, right] = hyphen.bases

  const rightUpdated = updateVerbase(right, target)
  if (rightUpdated == null) return null

  return { type: 'hyphen', bases: [left, rightUpdated] }
}

export function updateVerangeToLatest(
  range: Verange,
  target: SemVer,
): VerangeUpdatable | null {
  switch (range.type) {
    case 'unary':
      return toLatestUnary(range, target)
    case 'hyphen':
      return toLatestHyphen(range, target)
    default:
      return null
  }
}

function toLatestUnary(
  unary: VerangeUnary,
  target: SemVer,
): VerangeUnary | null {
  const base = updateVerbase(unary.base, target)
  if (base == null) return null

  return { type: 'unary', op: unary.op, base }
}

function toLatestHyphen(
  hyphen: VerangeHyphen,
  target: SemVer,
): VerangeHyphen | null {
  const [left, right] = hyphen.bases

  // The left side is the lower bound, so it stays untouched.
  const alignedRight = updateVerbase(right, target)
  if (alignedRight == null) return null

  return { type: 'hyphen', bases: [left, alignedRight] }
}

export function colorizeVerangeDiff(
  range: Verange,
  from: Verange,
): DeclourPiece[] | null {
  switch (range.type) {
    case 'unary':
      if (from.type !== 'unary') return null
      return colorizeDiffUnary(range, from)
    case 'hyphen':
      if (from.type !== 'hyphen') return null
      return colorizeDiffHyphen(range, from)
    default:
      return null
  }
}

function colorizeDiffUnary(
  unary: VerangeUnary,
  from: VerangeUnary,
): DeclourPiece[] {
  return [
    unary.op,
    ...colorizeVerbaseDiff(unary.base, from.base),
  ]
}

function colorizeDiffHyphen(
  hyphen: VerangeHyphen,
  from: VerangeHyphen,
): DeclourPiece[] {
  const [left, right] = hyphen.bases

  return [
    formatVerbase(left),
    ' - ',
    ...colorizeVerbaseDiff(right, from.bases[1]),
  ]
}
