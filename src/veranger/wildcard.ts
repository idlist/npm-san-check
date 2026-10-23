export const wildcards = ['*', 'x', 'X'] as const

export type Wildcard = typeof wildcards[number]

const possibleWildcards: Set<string> = new Set(wildcards)

export function isWildcard(part: number | string): part is Wildcard {
  return possibleWildcards.has(part as Wildcard)
}

export function parseIntOrWildcard(raw: string): number | Wildcard {
  return isWildcard(raw) ? raw as Wildcard : parseInt(raw)
}

export function compareWithWildcard(a: number | Wildcard, b: number | Wildcard): number {
  const aw = isWildcard(a)
  const bw = isWildcard(b)

  if (aw && bw) {
    return 0
  } else if (aw) {
    return 1
  } else if (bw) {
    return -1
  } else {
    return a === b ? 0 : (a < b ? -1 : 1)
  }
}
