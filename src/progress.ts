import { Readline } from 'node:readline/promises'
import { stdout as output } from 'node:process'
import clamp from 'lodash-es/clamp.js'

interface ProgressOptions {
  numberOfDeps: number
}

export const createProgress = (options: ProgressOptions) => {
  const rlControl = new Readline(output)
  const complete = '*'
  const remain = '-'

  const total = options.numberOfDeps
  const size = Math.min(total, 40)
  let current = 0

  const hideCursor = () => {
    output.write('\u001B[?25l')
  }

  const showCursor = () => {
    output.write('\u001B[?25h')
  }

  const bar = (info: string) => {
    const charsComplete = Math.ceil(current / total * size)
    const charsRemain = size - charsComplete
    return `[${complete.repeat(charsComplete)}${remain.repeat(charsRemain)}] ${current}/${total}  ${info}`
  }

  const updateDisplay = async (info: string) => {
    rlControl.cursorTo(0)
    rlControl.clearLine(0)
    await rlControl.commit()

    output.write(bar(info))
  }

  const start = async () => {
    hideCursor()
    await updateDisplay('')
  }

  const increment = async (info: string) => {
    current = clamp(current + 1, 0, total)
    await updateDisplay(info)
  }

  const stop = () => {
    showCursor()
    output.write('\n')
  }

  return {
    start,
    increment,
    stop,
  }
}
