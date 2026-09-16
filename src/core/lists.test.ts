import { describe, expect, it } from 'vitest'
import type { EmphasisSpan } from './emphasis'
import { listMarker, listStartedBy, parseDescription } from './lists'

function plain(text: string): EmphasisSpan {
  return { text, bold: false, italic: false }
}

function bold(text: string): EmphasisSpan {
  return { text, bold: true, italic: false }
}

describe('parseDescription', () => {
  it('has nothing to say about an empty description', () => {
    expect(parseDescription('')).toEqual([])
  })

  it('reads text with no markers as ordinary lines', () => {
    expect(parseDescription('one\ntwo')).toEqual([{ kind: 'lines', lines: [[plain('one')], [plain('two')]] }])
  })

  it('keeps a blank line as a line with nothing on it', () => {
    expect(parseDescription('one\n\ntwo')).toEqual([{ kind: 'lines', lines: [[plain('one')], [], [plain('two')]] }])
  })

  it('reads lines starting "- " as bullets, markers taken off', () => {
    expect(parseDescription('- milk\n- bread')).toEqual([{ kind: 'bullets', lines: [[plain('milk')], [plain('bread')]] }])
  })

  it('reads lines starting with a number and a dot as numbered', () => {
    expect(parseDescription('1. wake\n2. run')).toEqual([{ kind: 'numbers', lines: [[plain('wake')], [plain('run')]] }])
  })

  it('does not keep the numbers items were written with', () => {
    expect(parseDescription('3. wake\n7. run')).toEqual([{ kind: 'numbers', lines: [[plain('wake')], [plain('run')]] }])
  })

  it('splits a description into its lists and the lines around them', () => {
    expect(parseDescription('buy:\n- milk\n- bread\nthen home')).toEqual([
      { kind: 'lines', lines: [[plain('buy:')]] },
      { kind: 'bullets', lines: [[plain('milk')], [plain('bread')]] },
      { kind: 'lines', lines: [[plain('then home')]] },
    ])
  })

  it('reads a bullet list straight after a numbered one as two lists', () => {
    expect(parseDescription('1. one\n- two')).toEqual([
      { kind: 'numbers', lines: [[plain('one')]] },
      { kind: 'bullets', lines: [[plain('two')]] },
    ])
  })

  it('reads a blank line between items as the end of one list and the start of another', () => {
    expect(parseDescription('- one\n\n- two')).toEqual([
      { kind: 'bullets', lines: [[plain('one')]] },
      { kind: 'lines', lines: [[]] },
      { kind: 'bullets', lines: [[plain('two')]] },
    ])
  })

  it('reads a marker with nothing after it as an empty item, trimmed or not', () => {
    expect(parseDescription('- one\n- \n-')).toEqual([{ kind: 'bullets', lines: [[plain('one')], [], []] }])
  })

  it('leaves a dash or a number that is part of the words alone', () => {
    expect(parseDescription('-5 degrees\n1.5 kg\na - b')).toEqual([
      { kind: 'lines', lines: [[plain('-5 degrees')], [plain('1.5 kg')], [plain('a - b')]] },
    ])
  })

  it('keeps the emphasis inside an item', () => {
    expect(parseDescription('- **milk** first')).toEqual([{ kind: 'bullets', lines: [[bold('milk'), plain(' first')]] }])
  })

  it('keeps emphasis that runs across a line break on both lines', () => {
    expect(parseDescription('**one\ntwo**')).toEqual([{ kind: 'lines', lines: [[bold('one')], [bold('two')]] }])
  })

  it('takes a marker off even where it sits inside emphasis', () => {
    expect(parseDescription('**- milk**')).toEqual([{ kind: 'bullets', lines: [[bold('milk')]] }])
  })
})

describe('listMarker', () => {
  it('writes every bullet the same way', () => {
    expect(listMarker('bullets', 1)).toBe('- ')
    expect(listMarker('bullets', 4)).toBe('- ')
  })

  it('writes a numbered item with its place', () => {
    expect(listMarker('numbers', 1)).toBe('1. ')
    expect(listMarker('numbers', 12)).toBe('12. ')
  })

  it('writes what reads back as the same list', () => {
    const written = [1, 2].map((position) => `${listMarker('numbers', position)}item`).join('\n')

    expect(parseDescription(written)).toEqual([{ kind: 'numbers', lines: [[plain('item')], [plain('item')]] }])
  })
})

describe('listStartedBy', () => {
  it('starts a bullet list on a dash and a space', () => {
    expect(listStartedBy('- ')).toBe('bullets')
  })

  it('starts a numbered list on any number, a dot and a space', () => {
    expect(listStartedBy('1. ')).toBe('numbers')
    expect(listStartedBy('12. ')).toBe('numbers')
  })

  it('counts a non-breaking space as the space', () => {
    expect(listStartedBy('- ')).toBe('bullets')
  })

  it('waits for the space', () => {
    expect(listStartedBy('-')).toBeNull()
    expect(listStartedBy('1.')).toBeNull()
  })

  it('starts nothing once there is more on the line than the marker', () => {
    expect(listStartedBy('- milk')).toBeNull()
    expect(listStartedBy('a - ')).toBeNull()
    expect(listStartedBy(' - ')).toBeNull()
  })
})
