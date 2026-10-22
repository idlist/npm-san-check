import { declor, red } from '@declor/index'

/** Distinguish terminal output from debug logging. */
const print = {
  info(...content: unknown[]) {
    console.log(...content)
  },
  error(...content: unknown[]) {
    console.log(declor(red('Error:')), ...content)
  },
}

export default print
