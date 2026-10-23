import { describe, expect, it } from 'vitest'
import { atom, type AtomAction, bg, type Declour, type DeclourPiece, fg, styles, toDecl } from './atoms'

describe('toDecl', () => {
  it('wraps a string into a text-only declaration', () => {
    expect(toDecl('hello')).toEqual({ text: 'hello' })
  })

  it('returns the same object for a declaration', () => {
    const decl: Declour = { text: 'x', fg: 'red' }
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
    const pieces: DeclourPiece[] = ['a', { text: 'b' }, { text: 'c', fg: 'red' }]
    const expected: Declour[] = [{ text: 'm:a' }, { text: 'm:b' }, { text: 'm:c', fg: 'red' }]

    expect(atom(createMarker('m'), pieces)).toEqual(expected)
  })

  it('flattens array pieces', () => {
    const pieces: DeclourPiece[] = [[{ text: 'a' }, { text: 'b' }]]
    const expected: Declour[] = [{ text: 'm:a' }, { text: 'm:b' }]

    expect(atom(createMarker('m'), pieces)).toEqual(expected)
  })

  it('does not modify the input declaration', () => {
    const decl: Declour = { text: 'a', fg: 'red', styles: ['bold'] }
    const expected: Declour = { text: 'a', fg: 'red', styles: ['bold'] }

    atom((d) => ({ ...d, bg: 'bgBlue' }), [decl])
    expect(decl).toEqual(expected)
  })
})

describe('fg', () => {
  it('sets the foreground colour', () => {
    const pieces: DeclourPiece[] = ['a']
    const expected: Declour[] = [{ text: 'a', fg: 'red' }]

    expect(fg('red')(...pieces)).toEqual(expected)
  })

  it('overwrites an existing foreground colour', () => {
    const pieces: DeclourPiece[] = [{ text: 'a', fg: 'red' }]
    const expected: Declour[] = [{ text: 'a', fg: 'blue' }]

    expect(fg('blue')(...pieces)).toEqual(expected)
  })
})

describe('bg', () => {
  it('sets the background colour', () => {
    const pieces: DeclourPiece[] = ['a']
    const expected: Declour[] = [{ text: 'a', bg: 'bgRed' }]

    expect(bg('bgRed')(...pieces)).toEqual(expected)
  })

  it('overwrites an existing background colour', () => {
    const pieces: DeclourPiece[] = [{ text: 'a', bg: 'bgRed' }]
    const expected: Declour[] = [{ text: 'a', bg: 'bgBlue' }]

    expect(bg('bgBlue')(...pieces)).toEqual(expected)
  })
})

describe('style', () => {
  it('appends the styles', () => {
    const pieces: DeclourPiece[] = ['a']
    const expected: Declour[] = [{ text: 'a', styles: ['bold'] }]

    expect(styles('bold')(...pieces)).toEqual(expected)
  })

  it('keeps the existing styles', () => {
    const pieces: DeclourPiece[] = [{ text: 'a', styles: ['bold'] }]
    const expected: Declour[] = [{ text: 'a', styles: ['bold', 'underline'] }]

    expect(styles('underline')(...pieces)).toEqual(expected)
  })
})
