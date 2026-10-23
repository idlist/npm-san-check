import { cyan, declour, green } from '@declour/index'
import { clamp, remove } from 'es-toolkit'
import { stdout as output } from 'node:process'
import { Readline } from 'node:readline/promises'

interface ProgressBarOptions {
  nOfDeps: number
}

function hideCursor() {
  output.write('\u001B[?25l')
}

function showCursor() {
  output.write('\u001B[?25h')
}

export function createProgressBar(options: ProgressBarOptions) {
  const rl = new Readline(output)
  const charChecked = '*'
  const charChecking = '?'
  const charRemain = '-'

  const total = options.nOfDeps
  const size = Math.min(total, 40)
  const ratio = size / total
  let checked = 0
  const checking: string[] = []
  let done = false

  const render = () => {
    const nChecked = Math.ceil(checked * ratio)
    const nChecking = Math.ceil(checking.length * ratio)
    const nRemain = Math.max(size - nChecked - nChecking, 0)

    const more = done
      ? ['  ', green('done!')]
      : ['  → ', cyan(checking.join(','))]

    return declour(
      '[',
      charChecked.repeat(nChecked),
      charChecking.repeat(nChecking),
      charRemain.repeat(nRemain),
      '] ',
      String(checked),
      '/',
      String(total),
      ...more,
    )
  }

  const updateDisplay = async () => {
    rl.cursorTo(0)
    rl.clearLine(0)
    await rl.commit()

    output.write(render())
  }

  return {
    begin: async () => {
      hideCursor()
      await updateDisplay()
    },
    startChecking: async (name: string) => {
      checking.push(name)
      await updateDisplay()
    },
    finishChecking: async (name: string) => {
      remove(checking, (value) => value === name)
      checked = clamp(checked + 1, 0, total)
      await updateDisplay()
    },
    done: async () => {
      done = true
      checked = total
      await updateDisplay()

      showCursor()
      output.write('\n')
    },
  }
}
