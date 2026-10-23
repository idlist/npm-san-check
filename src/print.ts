import { declour, red } from '@declour/index'

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
