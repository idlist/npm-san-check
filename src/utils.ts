import { cyan, type DeclourPiece, green, magenta } from '@src/declour'

export function justCompare<T extends string | number>(a: T, b: T) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function interpose<T, U>(array: T[], separator: U) {
  return array.flatMap((item, i) => i === 0 ? [item] : [separator, item])
}

export const DeclName: DeclourPiece[] = [cyan('n'), 'ame']
export const DeclNewer: DeclourPiece[] = [green('n'), 'ewer']
export const DeclLatest: DeclourPiece[] = [magenta('l'), 'atest']
