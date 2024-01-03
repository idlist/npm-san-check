import { parseRangeBase, type RangeBase } from './range-base.js'

type RangeUnaryOp = '^' | '~' | '>' | '>=' | '<' | '<=' | '=' | ''

interface RangeUnary {
  type: RangeUnaryOp
  operand: RangeBase
}

type RangeHyphenOp = '-'

interface RangeHyphen {
  type: RangeHyphenOp
  operand: [RangeBase, RangeBase]
}

type Range = RangeUnary | RangeHyphen

export const parseRange = (raw: string): Range | undefined => {
  const segments = raw.split('||')

  // Skip parsing range if the range is a composed range.
  // Let user handle the specific case by themselves.
  if (segments.length >= 2) {
    return
  }

  const segment = segments[0]

  // Hyphen.
  const sides = segment.split(' - ')

  if (sides.length == 2) {
    return {
      type: '-',
      operand: [parseRangeBase(sides[0]), parseRangeBase(sides[1])],
    }
  }

  // Unary ranges.
  if (segment.startsWith('>=') || segment.startsWith('<=')) {
    return {
      type: segment.slice(0, 2) as RangeUnaryOp,
      operand: parseRangeBase(segment.slice(2)),
    }
  } else if (['^', '~', '>', '<', '='].includes(segment[0])) {
    return {
      type: segment[0] as RangeUnaryOp,
      operand: parseRangeBase(segment.slice(1)),
    }
  } else if (/[\d\*xX]/.test(segment[0])) {
    return {
      type: '',
      operand: parseRangeBase(segment),
    }
  }
}
