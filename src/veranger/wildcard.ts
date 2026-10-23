export const wildcards = ['*', 'x', 'X'] as const

export type Wildcard = typeof wildcards[number]

export type NumberOrWildcard = number | Wildcard

const possibleWildcards: Set<string> = new Set(wildcards)

export function isWildcard(part: number | string): part is Wildcard {
  return possibleWildcards.has(part as Wildcard)
}

export function parseIntOrWildcard(raw: string): NumberOrWildcard {
  return isWildcard(raw) ? raw : parseInt(raw)
}

export function compareWithWildcard(a: NumberOrWildcard, b: NumberOrWildcard): number {
  const aIsWildcard = isWildcard(a)
  const bIsWildcard = isWildcard(b)

  if (aIsWildcard && bIsWildcard) {
    return 0
  } else if (aIsWildcard) {
    return 1
  } else if (bIsWildcard) {
    return -1
  } else {
    return a - b
  }
}
