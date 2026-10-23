import { styleText } from 'node:util'
import { type DeclorPiece, fg, type TextStyle } from './atoms'

export {
  black,
  blackBright,
  blue,
  blueBright,
  cyan,
  cyanBright,
  gray,
  green,
  greenBright,
  grey,
  magenta,
  magentaBright,
  red,
  redBright,
  white,
  whiteBright,
  yellow,
  yellowBright,
} from './atoms.js'

export {
  bgBlack,
  bgBlackBright,
  bgBlue,
  bgBlueBright,
  bgCyan,
  bgCyanBright,
  bgGray,
  bgGreen,
  bgGreenBright,
  bgGrey,
  bgMagenta,
  bgMagentaBright,
  bgRed,
  bgRedBright,
  bgWhite,
  bgWhiteBright,
  bgYellow,
  bgYellowBright,
} from './atoms.js'

export {
  blink,
  bold,
  dim,
  doubleunderline,
  framed,
  hidden,
  inverse,
  italic,
  none,
  overlined,
  reset,
  strikethrough,
  underline,
} from './atoms.js'

export function fgHex(hex: `#${string}`) {
  return fg(hex)
}

export function declour(...pieces: DeclorPiece[]): string {
  const flattened = pieces.flat()
  let rendered: string = ''

  for (const piece of flattened) {
    if (typeof piece === 'string') {
      rendered += piece
    } else {
      const format: TextStyle[] = []
      if (piece.fg) format.push(piece.fg)
      if (piece.bg) format.push(piece.bg)
      if (piece.styles) format.push(...piece.styles)
      rendered += styleText(format, piece.text)
    }
  }

  return rendered
}
