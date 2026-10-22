import { styleText } from 'node:util'

type TextStyleFormat = Parameters<typeof styleText>[0]

export type TextStyle = Exclude<TextStyleFormat, unknown[]>

export interface Declor {
  text: string
  fg?: TextStyle
  bg?: TextStyle
  styles?: TextStyle[]
}

export type DeclorPiece = string | Declor | (string | Declor)[]

export function toDecl(piece: string | Declor) {
  return typeof piece === 'string' ? { text: piece } : piece
}

export type AtomAction = (decl: Declor) => Declor

export function atom(action: AtomAction, pieces: DeclorPiece[]): Declor[] {
  return pieces.flatMap((piece) => {
    if (Array.isArray(piece)) {
      return piece.map(p => action(toDecl(p)))
    } else {
      return action(toDecl(piece))
    }
  })
}

export function fg(color: TextStyle) {
  return (...pieces: DeclorPiece[]) => {
    return atom((piece) => {
      return { ...piece, fg: color }
    }, pieces)
  }
}

export function bg(color: TextStyle) {
  return (...pieces: DeclorPiece[]) => {
    return atom((piece) => {
      return { ...piece, bg: color }
    }, pieces)
  }
}

export function style(...styles: TextStyle[]) {
  return (...pieces: DeclorPiece[]) => {
    return atom((piece) => {
      return { ...piece, styles: [...(piece.styles ?? []), ...styles] }
    }, pieces)
  }
}

export const black = fg('black')
export const blackBright = fg('blackBright')
export const blue = fg('blue')
export const blueBright = fg('blueBright')
export const cyan = fg('cyan')
export const cyanBright = fg('cyanBright')
export const gray = fg('gray')
export const green = fg('green')
export const greenBright = fg('greenBright')
export const grey = fg('grey')
export const magenta = fg('magenta')
export const magentaBright = fg('magentaBright')
export const red = fg('red')
export const redBright = fg('redBright')
export const white = fg('white')
export const whiteBright = fg('whiteBright')
export const yellow = fg('yellow')
export const yellowBright = fg('yellowBright')

export const bgBlack = bg('bgBlack')
export const bgBlackBright = bg('bgBlackBright')
export const bgBlue = bg('bgBlue')
export const bgBlueBright = bg('bgBlueBright')
export const bgCyan = bg('bgCyan')
export const bgCyanBright = bg('bgCyanBright')
export const bgGray = bg('bgGray')
export const bgGreen = bg('bgGreen')
export const bgGreenBright = bg('bgGreenBright')
export const bgGrey = bg('bgGrey')
export const bgMagenta = bg('bgMagenta')
export const bgMagentaBright = bg('bgMagentaBright')
export const bgRed = bg('bgRed')
export const bgRedBright = bg('bgRedBright')
export const bgWhite = bg('bgWhite')
export const bgWhiteBright = bg('bgWhiteBright')
export const bgYellow = bg('bgYellow')
export const bgYellowBright = bg('bgYellowBright')

export const blink = style('blink')
export const bold = style('bold')
export const dim = style('dim')
export const doubleunderline = style('doubleunderline')
export const framed = style('framed')
export const hidden = style('hidden')
export const inverse = style('inverse')
export const italic = style('italic')
export const none = style('none')
export const overlined = style('overlined')
export const reset = style('reset')
export const strikethrough = style('strikethrough')
export const underline = style('underline')
