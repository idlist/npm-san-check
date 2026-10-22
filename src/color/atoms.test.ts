import { describe, expect, it } from 'vitest'
import { atom, type AtomAction, bg, type Declor, type DeclorPiece, fg, style, toDecl } from './atoms'

describe('toDecl', () => {
  it('wraps a string into a text-only declaration', () => {
    expect(toDecl('hello')).toEqual({ text: 'hello' })
  })

  it('returns the same object for a declaration', () => {
    const decl: Declor = { text: 'x', fg: 'red' }
    expect(toDecl(decl)).toBe(decl)
  })
})

function createMarker(tag: string): AtomAction {
  return (decl) => ({ ...decl, text: `${tag}:${decl.text}` })
}

describe('atom', () => {
  it('returns an empty array for no pieces', () => {
    expect(atom(createMarker('m'), [])).toEqual([])
  })

  it('applies the action to every piece', () => {
    const pieces: DeclorPiece[] = ['a', { text: 'b' }, { text: 'c', fg: 'red' }]
    const expected: Declor[] = [{ text: 'm:a' }, { text: 'm:b' }, { text: 'm:c', fg: 'red' }]

    expect(atom(createMarker('m'), pieces)).toEqual(expected)
  })

  it('flattens array pieces', () => {
    const pieces: DeclorPiece[] = [[{ text: 'a' }, { text: 'b' }]]
    const expected: Declor[] = [{ text: 'm:a' }, { text: 'm:b' }]

    expect(atom(createMarker('m'), pieces)).toEqual(expected)
  })

  it('does not modify the input declaration', () => {
    const decl: Declor = { text: 'a', fg: 'red', styles: ['bold'] }
    const expected: Declor = { text: 'a', fg: 'red', styles: ['bold'] }

    atom((d) => ({ ...d, bg: 'bgBlue' }), [decl])
    expect(decl).toEqual(expected)
  })
})

describe('fg', () => {
  it('sets the foreground colour', () => {
    const pieces: DeclorPiece[] = ['a']
    const expected: Declor[] = [{ text: 'a', fg: 'red' }]

    expect(fg('red')(...pieces)).toEqual(expected)
  })

  it('overwrites an existing foreground colour', () => {
    const pieces: DeclorPiece[] = [{ text: 'a', fg: 'red' }]
    const expected: Declor[] = [{ text: 'a', fg: 'blue' }]

    expect(fg('blue')(...pieces)).toEqual(expected)
  })
})

describe('bg', () => {
  it('sets the background colour', () => {
    const pieces: DeclorPiece[] = ['a']
    const expected: Declor[] = [{ text: 'a', bg: 'bgRed' }]

    expect(bg('bgRed')(...pieces)).toEqual(expected)
  })

  it('overwrites an existing background colour', () => {
    const pieces: DeclorPiece[] = [{ text: 'a', bg: 'bgRed' }]
    const expected: Declor[] = [{ text: 'a', bg: 'bgBlue' }]

    expect(bg('bgBlue')(...pieces)).toEqual(expected)
  })
})

describe('style', () => {
  it('appends the styles', () => {
    const pieces: DeclorPiece[] = ['a']
    const expected: Declor[] = [{ text: 'a', styles: ['bold'] }]

    expect(style('bold')(...pieces)).toEqual(expected)
  })

  it('keeps the existing styles', () => {
    const pieces: DeclorPiece[] = [{ text: 'a', styles: ['bold'] }]
    const expected: Declor[] = [{ text: 'a', styles: ['bold', 'underline'] }]

    expect(style('underline')(...pieces)).toEqual(expected)
  })
})
