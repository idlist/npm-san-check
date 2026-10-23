export function justCompare<T extends string | number>(a: T, b: T) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
