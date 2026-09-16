/**
 * Emphasis inside a description: bold and italic.
 *
 * A description stays one plain string, with the emphasis written into it as
 * Markdown — `**bold**`, `*italic*`. Nobody is meant to see those markers: the
 * box shows the words already bold and the resting text does too, and this is
 * only how they are written down. Keeping it to markers is what keeps a
 * description ordinary text rather than a document format of its own, so
 * nothing saved has to change shape and it stays readable anywhere.
 *
 * `parseEmphasis` reads the markers and `writeEmphasis` puts them back. The two
 * are a pair: anything written here reads back as what it was.
 */

const MARKER = '*'
const ESCAPE = '\\'

/** A stretch of a description that reads one way throughout. */
export interface EmphasisSpan {
  readonly text: string
  readonly bold: boolean
  readonly italic: boolean
}

/**
 * A description split into the runs it reads as. Markers that never close are
 * left as the characters they are, and a marker written as `\*` is a marker
 * that was typed rather than one that means anything — a description is
 * ordinary text first.
 */
export function parseEmphasis(description: string): EmphasisSpan[] {
  return spansOf(tokenize(description), false, false)
}

/**
 * The runs written back down as one string. Runs that read the same way are
 * joined first, so `**a****b**` — which would read as neither — is never
 * written in the first place.
 */
export function writeEmphasis(spans: readonly EmphasisSpan[]): string {
  return joined(spans).map(markedUp).join('')
}

function markedUp(span: EmphasisSpan): string {
  const markers = MARKER.repeat((span.bold ? 2 : 0) + (span.italic ? 1 : 0))
  // Markers bind to words, never to the space beside them: `** bold **` is
  // emphasis in no reading of it, so whitespace at the ends of a run is written
  // outside the markers rather than inside.
  const opening = span.text.slice(0, span.text.length - span.text.trimStart().length)
  const closing = span.text.slice(span.text.trimEnd().length)
  const words = span.text.slice(opening.length, span.text.length - closing.length)

  return words === '' || markers === ''
    ? escaped(span.text)
    : opening + markers + escaped(words) + markers + closing
}

/** Markers that were typed rather than meant, kept as what they were. */
function escaped(text: string): string {
  return text.replaceAll(ESCAPE, ESCAPE + ESCAPE).replaceAll(MARKER, ESCAPE + MARKER)
}

function joined(spans: readonly EmphasisSpan[]): EmphasisSpan[] {
  const runs: EmphasisSpan[] = []

  for (const span of spans) {
    if (span.text === '') continue

    const last = runs.at(-1)
    if (last !== undefined && last.bold === span.bold && last.italic === span.italic) {
      runs[runs.length - 1] = { ...last, text: last.text + span.text }
      continue
    }

    runs.push(span)
  }

  return runs
}

/**
 * A run of markers, or a stretch of text with none. A run knows whether there
 * is a word on each side of it, which is what decides whether it can open or
 * close emphasis — and is what keeps `2 * 3 * 4` arithmetic.
 */
type Token =
  | { readonly kind: 'text', readonly text: string }
  | { readonly kind: 'run', readonly markers: number, readonly opens: boolean, readonly closes: boolean }

function tokenize(description: string): Token[] {
  const tokens: Token[] = []
  let text = ''
  let previous: string | undefined
  let at = 0

  while (at < description.length) {
    const character = description[at]

    if (character === ESCAPE && at + 1 < description.length) {
      text += description[at + 1]
      previous = description[at + 1]
      at += 2
      continue
    }

    if (character !== MARKER) {
      text += character
      previous = character
      at++
      continue
    }

    let markers = 0
    while (description[at + markers] === MARKER) {
      markers++
    }

    if (text !== '') {
      tokens.push({ kind: 'text', text })
      text = ''
    }
    tokens.push({ kind: 'run', markers, opens: isWord(description[at + markers]), closes: isWord(previous) })
    previous = MARKER
    at += markers
  }

  if (text !== '') {
    tokens.push({ kind: 'text', text })
  }

  return tokens
}

/** Whether there is a word here for a marker to hold on to. */
function isWord(character: string | undefined): boolean {
  return character !== undefined && character.trim() !== ''
}

/**
 * Splits around the first run that opens and is closed again, then does the
 * same inside it and after it. Emphasis inside emphasis adds to what it is
 * inside, which is what makes `**bold with *a word* in it**` read as written.
 */
function spansOf(tokens: readonly Token[], bold: boolean, italic: boolean): EmphasisSpan[] {
  for (let opening = 0; opening < tokens.length; opening++) {
    const open = tokens[opening]
    if (open.kind !== 'run' || !open.opens) continue

    const closing = tokens.findIndex(
      (token, at) => at > opening + 1 && token.kind === 'run' && token.markers === open.markers && token.closes,
    )
    if (closing === -1) continue

    return [
      ...asTyped(tokens.slice(0, opening), bold, italic),
      ...spansOf(tokens.slice(opening + 1, closing), bold || open.markers >= 2, italic || open.markers % 2 === 1),
      ...spansOf(tokens.slice(closing + 1), bold, italic),
    ]
  }

  return asTyped(tokens, bold, italic)
}

/** Every token as the characters it is, markers that meant nothing included. */
function asTyped(tokens: readonly Token[], bold: boolean, italic: boolean): EmphasisSpan[] {
  const text = tokens.map((token) => (token.kind === 'text' ? token.text : MARKER.repeat(token.markers))).join('')

  return text === '' ? [] : [{ text, bold, italic }]
}
