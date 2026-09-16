import { describe, expect, it } from 'vitest'
import { parseEmphasis, writeEmphasis, type EmphasisSpan } from './emphasis'

function plain(text: string): EmphasisSpan {
  return { text, bold: false, italic: false }
}

function bold(text: string): EmphasisSpan {
  return { text, bold: true, italic: false }
}

function italic(text: string): EmphasisSpan {
  return { text, bold: false, italic: true }
}

describe('parseEmphasis', () => {
  it('reads text with no markers as one plain run', () => {
    expect(parseEmphasis('just a note')).toEqual([plain('just a note')])
  })

  it('has nothing to say about an empty description', () => {
    expect(parseEmphasis('')).toEqual([])
  })

  it('reads a pair of markers as bold, and the text around it as plain', () => {
    expect(parseEmphasis('make this **bold** please')).toEqual([
      plain('make this '),
      bold('bold'),
      plain(' please'),
    ])
  })

  it('reads a single marker as italic', () => {
    expect(parseEmphasis('*this*')).toEqual([italic('this')])
  })

  it('reads three markers as both at once', () => {
    expect(parseEmphasis('***this***')).toEqual([{ text: 'this', bold: true, italic: true }])
  })

  it('keeps the emphasis it is already inside when one nests in another', () => {
    expect(parseEmphasis('**bold with *a word* in it**')).toEqual([
      bold('bold with '),
      { text: 'a word', bold: true, italic: true },
      bold(' in it'),
    ])
  })

  it('reads two runs on one line as two runs', () => {
    expect(parseEmphasis('**one** and **two**')).toEqual([bold('one'), plain(' and '), bold('two')])
  })

  it('leaves a marker that never closes as the character it is', () => {
    expect(parseEmphasis('half *open')).toEqual([plain('half *open')])
  })

  it('leaves arithmetic alone, markers being about words rather than spaces', () => {
    expect(parseEmphasis('2 * 3 * 4')).toEqual([plain('2 * 3 * 4')])
  })

  it('reads a marker that was typed rather than meant as that character', () => {
    expect(parseEmphasis('2 \\* 3 and \\*\\*not bold\\*\\*')).toEqual([plain('2 * 3 and **not bold**')])
  })

  it('reads an escaped backslash as one backslash', () => {
    expect(parseEmphasis('a \\\\ b')).toEqual([plain('a \\ b')])
  })

  it('reads emphasis that runs across a line break', () => {
    expect(parseEmphasis('**one\ntwo**')).toEqual([bold('one\ntwo')])
  })
})

describe('writeEmphasis', () => {
  it('writes plain text as itself', () => {
    expect(writeEmphasis([plain('just a note')])).toBe('just a note')
  })

  it('writes nothing for nothing', () => {
    expect(writeEmphasis([])).toBe('')
  })

  it('wraps a bold run in a pair of markers', () => {
    expect(writeEmphasis([plain('make this '), bold('bold')])).toBe('make this **bold**')
  })

  it('wraps an italic run in one marker, and one that is both in three', () => {
    expect(writeEmphasis([italic('this')])).toBe('*this*')
    expect(writeEmphasis([{ text: 'this', bold: true, italic: true }])).toBe('***this***')
  })

  it('leaves the space at the ends of a run outside the markers', () => {
    expect(writeEmphasis([bold('bold '), plain('and plain')])).toBe('**bold** and plain')
  })

  it('writes a run that is nothing but space without markers at all', () => {
    expect(writeEmphasis([bold(' ')])).toBe(' ')
  })

  it('joins runs that read the same way, so the markers between them are not written', () => {
    expect(writeEmphasis([bold('one'), bold(' two')])).toBe('**one two**')
  })

  it('drops runs with nothing in them', () => {
    expect(writeEmphasis([bold('one'), plain(''), bold(' two')])).toBe('**one two**')
  })

  it('marks up markers that were typed, so they read back as typed', () => {
    expect(writeEmphasis([plain('2 * 3')])).toBe('2 \\* 3')
    expect(writeEmphasis([plain('a \\ b')])).toBe('a \\\\ b')
  })
})

describe('the two together', () => {
  const descriptions = [
    'plain words',
    '**bold** and *italic* and ***both***',
    'a line\nand another',
    'stars 2 * 3 and a slash \\ in the text',
    '**bold with *a word* in it**',
    '**bold** then **bold again**',
  ]

  it.each(descriptions)('reads back the same words: %s', (description) => {
    const words = (spans: readonly EmphasisSpan[]) => spans.map((span) => span.text).join('')

    expect(words(parseEmphasis(writeEmphasis(parseEmphasis(description))))).toBe(words(parseEmphasis(description)))
  })

  it.each(descriptions)('settles rather than drifting on each pass: %s', (description) => {
    // Emphasis on nothing but a space is emphasis on nothing, so a run ending in
    // one is written as two — which reads the same and is then written the same
    // way for good. What must never happen is markers piling up edit on edit.
    const once = writeEmphasis(parseEmphasis(description))

    expect(writeEmphasis(parseEmphasis(once))).toBe(once)
  })
})
