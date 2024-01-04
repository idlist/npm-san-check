export const Wildcards = ['*', 'x', 'X'] as const

export type WildcardChar = typeof Wildcards[number]

export const isWildcard = (part: number | string) => {
  return Wildcards.includes(part as WildcardChar)
}

export const isWildcardOrNumber = (part: number | WildcardChar): part is WildcardChar => {
  return typeof part == 'string'
}

export const parseIntOrWildcard = (raw: string): number | WildcardChar => {
  return isWildcard(raw) ? raw as WildcardChar : parseInt(raw)
}

export const compareWithWildcard = (a: number | WildcardChar, b: number | WildcardChar): -1 | 0 | 1 => {
  const aw = isWildcardOrNumber(a)
  const bw = isWildcardOrNumber(b)

  if (aw && bw) {
    return 0
  } else if (aw) {
    return 1
  } else if (bw) {
    return -1
  } else {
    return a == b ? 0 : (a < b ? -1 : 1)
  }
}
