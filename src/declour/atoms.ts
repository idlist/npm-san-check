import { styleText } from 'node:util'

type TextStyleFormat = Parameters<typeof styleText>[0]

export type TextStyle = Exclude<TextStyleFormat, unknown[]>

export interface Declour {
  text: string
  fg?: TextStyle
  bg?: TextStyle
  styles?: TextStyle[]
}

export type DeclourPiece = string | Declour | (string | Declour)[]

export function toDecl(piece: string | Declour) {
  return typeof piece === 'string' ? { text: piece } : piece
}

export type DeclourAtom = (...pieces: DeclourPiece[]) => Declour[]

export type AtomAction = (decl: Declour) => Declour

export function atom(action: AtomAction, pieces: DeclourPiece[]): Declour[] {
  return pieces.flatMap((piece) => {
    if (Array.isArray(piece)) {
      return piece.map(p => action(toDecl(p)))
    } else {
      return action(toDecl(piece))
    }
  })
}

export function fg(color: TextStyle): DeclourAtom {
  return (...pieces) => {
    return atom((piece) => {
      return { ...piece, fg: color }
    }, pieces)
  }
}

export function bg(color: TextStyle): DeclourAtom {
  return (...pieces) => {
    return atom((piece) => {
      return { ...piece, bg: color }
    }, pieces)
  }
}

export function styles(style: TextStyle): DeclourAtom {
  return (...pieces) => {
    return atom((piece) => {
      return { ...piece, styles: [...(piece.styles ?? []), style] }
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

export const blink = styles('blink')
export const bold = styles('bold')
export const dim = styles('dim')
export const doubleunderline = styles('doubleunderline')
export const framed = styles('framed')
export const hidden = styles('hidden')
export const inverse = styles('inverse')
export const italic = styles('italic')
export const none = styles('none')
export const overlined = styles('overlined')
export const reset = styles('reset')
export const strikethrough = styles('strikethrough')
export const underline = styles('underline')

export const noop: DeclourAtom = (...pieces) => {
  return atom((piece) => piece, pieces)
}

export const compose = (...atoms: DeclourAtom[]): DeclourAtom => {
  return (...pieces) => {
    let applied = pieces
    for (const apply of atoms) {
      applied = apply(...pieces)
    }
    return applied as Declour[]
  }
}
