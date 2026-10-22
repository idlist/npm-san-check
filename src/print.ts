import { red } from 'colorette'

const print = {
  info(...content: unknown[]) {
    console.log(...content)
  },
  error(...content: unknown[]) {
    console.log(red('Error:'), ...content)
  },
}

export default print
