import { describe, expect, it, vi } from 'vitest'
import { bold, declor, fgHex, red } from './index'

vi.stubEnv('FORCE_COLOR', '1')

describe('fgHex', () => {
  it('sets a custom foreground colour', () => {
    expect(fgHex('#ff8800')('a')).toEqual([{ text: 'a', fg: '#ff8800' }])
  })
})

describe('declor', () => {
  it('returns an empty string for no pieces', () => {
    expect(declor()).toBe('')
  })

  it('joins plain strings', () => {
    expect(declor('a', 'b')).toBe('ab')
  })

  it('renders a colored declaration', () => {
    const decl = red('a')
    const expected = '\u001b[31ma\u001b[39m'

    expect(declor(decl)).toBe(expected)
  })

  it('joins pieces in order', () => {
    const decl = [red('a'), 'b', bold('c')]
    const expected = '\u001b[31ma\u001b[39mb\u001b[1mc\u001b[22m'

    expect(declor(...decl)).toBe(expected)
  })

  it('flattens an array piece', () => {
    const decl = red('a', 'b')
    const expected = '\u001b[31ma\u001b[39m\u001b[31mb\u001b[39m'

    expect(declor(decl)).toBe(expected)
  })

  it('writes colors before styles', () => {
    const decl = bold(red('a'))
    const expected = '\u001b[31m\u001b[1ma\u001b[22m\u001b[39m'

    expect(declor(decl)).toBe(expected)
  })
})
