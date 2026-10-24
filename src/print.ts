import { declour, red } from '@src/declour'

/** Distinguish terminal output from debug logging. */
const print = {
  info(...content: unknown[]) {
    console.log(...content)
  },
  error(...content: unknown[]) {
    console.log(declour(red('Error:')), ...content)
  },
}

export default print
