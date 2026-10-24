import { justCompare } from '@src/utils'
import type { PrereleaseIdentifier } from 'verkit'

interface PrereleaseCompareResult {
  result: number
  differFromIndex: number
}

export function comparePrerelease(
  a: PrereleaseIdentifier[],
  b: PrereleaseIdentifier[],
): PrereleaseCompareResult {
  const length = a.length < b.length ? a.length : b.length

  for (let i = 0; i < length; i++) {
    if (typeof a[i] === typeof b[i] && a[i] !== b[i]) {
      const result = justCompare(a[i], b[i])
      return { result, differFromIndex: i }
    } else if (typeof a[i] === 'number' && typeof b[i] === 'string') {
      return { result: -1, differFromIndex: i }
    } else if (typeof a[i] === 'string' && typeof b[i] === 'number') {
      return { result: 1, differFromIndex: i }
    }
  }

  if (a.length === b.length) {
    return { result: 0, differFromIndex: -1 }
  } else {
    const result = a.length < b.length ? -1 : 1
    return { result, differFromIndex: length }
  }
}
