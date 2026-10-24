import { declour, type DeclourPiece, red } from '@src/declour'

/** Distinguish terminal output from debug logging. */
const print = {
  i(...content: unknown[]) {
    console.log(...content)
  },
  e(...content: unknown[]) {
    console.log(declour(red('Error: ')), ...content)
  },
  di(...content: DeclourPiece[]) {
    console.log(declour(...content))
  },
  de(...content: DeclourPiece[]) {
    console.log(declour(red('Error: '), ...content))
  },
}

export default print
