import type { DeclourPiece } from '@src/declour'
import type { SemVer } from 'verkit'
import { colorizeVerbaseDiff, formatVerbase, isPrerelease, parseVerbase, updateVerbase, type Verbase } from './base'

type VerangeUnaryOp = '^' | '~' | '>' | '>=' | '<' | '<=' | '=' | ''

export interface VerangeUnary {
  type: 'unary'
  op: VerangeUnaryOp
  base: Verbase
}

// TODO: support multiple unary ranges
export interface VerangeMultiple {
  type: 'multiple'
  bases: VerangeUnary[]
}

export interface VerangeHyphen {
  type: 'hyphen'
  bases: [Verbase, Verbase]
}

export interface VerangeCompound {
  type: 'compound'
}

export type Verange =
  | VerangeUnary
  | VerangeMultiple
  | VerangeHyphen
  | VerangeCompound

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

export function formatVerange(range: VerangeUnary | VerangeHyphen): string
export function formatVerange(range: VerangeCompound): null
export function formatVerange(range: Verange): string | null
export function formatVerange(range: Verange): string | null {
  switch (range.type) {
    case 'unary':
      return `${range.op}${formatVerbase(range.base)}`
    case 'hyphen':
      return `${formatVerbase(range.bases[0])} - ${formatVerbase(range.bases[1])}`
    default:
      return null
  }
}

export const newableOps = new Set<VerangeUnaryOp>(['^', '~', '>', '>='])

function updateUnaryVerangeToNewer(
  unary: VerangeUnary,
  target: SemVer,
): VerangeUnary | null {
  if (!newableOps.has(unary.op)) return null

  const base = updateVerbase(unary.base, target)
  if (base == null) return null

  return { type: 'unary', op: unary.op, base }
}

function updateHyphenVerangeToNewer(
  hyphen: VerangeHyphen,
  target: SemVer,
): VerangeHyphen | null {
  const [left, right] = hyphen.bases

  // The left side is the lower bound, so it stays untouched.
  const rightUpdated = updateVerbase(right, target)
  if (rightUpdated == null) return null

  return { type: 'hyphen', bases: [left, rightUpdated] }
}

export function updateVerangeToNewer(
  range: Verange,
  target: SemVer,
): Verange | null {
  switch (range.type) {
    case 'unary':
      return updateUnaryVerangeToNewer(range, target)
    case 'hyphen':
      return updateHyphenVerangeToNewer(range, target)
    default:
      return null
  }
}

function updateUnaryVerangeToLatest(
  unary: VerangeUnary,
  target: SemVer,
): VerangeUnary | null {
  const base = updateVerbase(unary.base, target)
  if (base == null) return null

  return { type: 'unary', op: unary.op, base }
}

function updateHyphenVerangeToLatest(
  hyphen: VerangeHyphen,
  target: SemVer,
): VerangeHyphen | null {
  const [left, right] = hyphen.bases

  // The left side is the lower bound, so it stays untouched.
  const alignedRight = updateVerbase(right, target)
  if (alignedRight == null) return null

  return { type: 'hyphen', bases: [left, alignedRight] }
}

export function updateVerangeToLatest(
  range: Verange,
  target: SemVer,
): Verange | null {
  switch (range.type) {
    case 'unary':
      return updateUnaryVerangeToLatest(range, target)
    case 'hyphen':
      return updateHyphenVerangeToLatest(range, target)
    default:
      return null
  }
}

function colorizeUnaryVerangeDiff(
  unary: VerangeUnary,
  ref: SemVer,
): DeclourPiece[] {
  return [unary.op, ...colorizeVerbaseDiff(unary.base, ref)]
}

function colorizeHyphenVerangeDiff(
  hyphen: VerangeHyphen,
  ref: SemVer,
): DeclourPiece[] {
  const [left, right] = hyphen.bases

  return [
    formatVerbase(left),
    ' - ',
    ...colorizeVerbaseDiff(right, ref),
  ]
}

export function colorizeVerangeDiff(
  range: VerangeUnary | VerangeHyphen,
  ref: SemVer,
): DeclourPiece[]
export function colorizeVerangeDiff(
  range: VerangeCompound,
  ref: SemVer,
): null
export function colorizeVerangeDiff(
  range: Verange,
  ref: SemVer,
): DeclourPiece[] | null
export function colorizeVerangeDiff(
  range: Verange,
  ref: SemVer,
): DeclourPiece[] | null {
  switch (range.type) {
    case 'unary':
      return colorizeUnaryVerangeDiff(range, ref)
    case 'hyphen':
      return colorizeHyphenVerangeDiff(range, ref)
    default:
      return null
  }
}
