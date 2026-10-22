import { clamp } from 'es-toolkit'
import { stdout as output } from 'node:process'
import { Readline } from 'node:readline/promises'

interface ProgressOptions {
  numberOfDeps: number
}

function hideCursor() {
  output.write('\u001B[?25l')
}

function showCursor() {
  output.write('\u001B[?25h')
}

function stop() {
  showCursor()
  output.write('\n')
}

export const createProgress = (options: ProgressOptions) => {
  const rlControl = new Readline(output)
  const complete = '*'
  const remain = '-'

  const total = options.numberOfDeps
  const size = Math.min(total, 40)
  let current = 0

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

  return {
    start,
    increment,
    stop,
  }
}
