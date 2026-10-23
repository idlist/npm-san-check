import { parseVerbase, type Verbase } from './base'

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

export type Verange = VerangeUnary | VerangeMultiple | VerangeHyphen | VerangeCompound

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
    const baseL = parseVerbase(sides[0].trim())
    const baseR = parseVerbase(sides[1].trim())
    if (baseL == null || baseR == null) return null
    return { type: 'hyphen', bases: [baseL, baseR] }
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

export function containsPrerelease(range: Verange): boolean {
  switch (range.type) {
    case 'unary':
      return range.base.prerelease != null
    case 'hyphen':
      return range.bases[0].prerelease != null || range.bases[1].prerelease != null
    default:
      return false
  }
}
