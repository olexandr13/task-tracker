/**
 * Lists inside a description: bulleted and numbered.
 *
 * Not the Lists a task is filed under (./list) — these are the bullets and
 * numbers written into one description's text.
 *
 * Like emphasis (./emphasis), a list is written into the one plain string as
 * Markdown — a line starting `- ` is a bullet, one starting `1. ` is numbered —
 * and nobody is meant to see those markers. The box and the resting text both
 * show real bullets and numbers; this is how they are written down and read
 * back, so a description stays ordinary text whatever it holds.
 *
 * Lists are one level deep: an item never holds a list of its own.
 */

import { parseEmphasis, type EmphasisSpan } from './emphasis'

export type ListKind = 'bullets' | 'numbers'

/**
 * A stretch of a description that reads one way throughout: ordinary lines, or
 * the items of one list. Either way each line is the runs it reads as, its
 * marker — if it had one — already taken off.
 */
export interface DescriptionBlock {
  readonly kind: 'lines' | ListKind
  readonly lines: readonly (readonly EmphasisSpan[])[]
}

/** A marker, then a space or the end of the line: `-5 degrees` and `1.5 kg` are not items. */
const BULLET = /^-(?: |$)/
const NUMBER = /^\d+\.(?: |$)/

/**
 * What typing a marker looks like at the moment it counts: the marker and the
 * space after it, with nothing else on the line before the caret. A browser may
 * write that space as a non-breaking one.
 */
const TYPED = /^(?:(-)|\d+\.)[  ]$/

/**
 * A description split into its lists and the lines between them. The number an
 * item was written with is not kept: a numbered list counts from 1 in the order
 * its items are in, so there is nothing for a stale number to disagree with.
 */
export function parseDescription(description: string): DescriptionBlock[] {
  if (description === '') return []

  const blocks: { kind: DescriptionBlock['kind'], lines: EmphasisSpan[][] }[] = []

  // Emphasis first and lines second: `**one\ntwo**` is bold on both lines, which
  // splitting first would leave as two markers that never close.
  for (const line of linesOf(parseEmphasis(description))) {
    const marker = markerOf(line.map((span) => span.text).join(''))
    const kind = marker?.kind ?? 'lines'
    const content = marker === null ? line : withoutFirst(line, marker.length)

    const last = blocks.at(-1)
    if (last?.kind === kind) {
      last.lines.push(content)
    } else {
      blocks.push({ kind, lines: [content] })
    }
  }

  return blocks
}

/** How an item is written down: `- ` for every bullet, its place for a number. */
export function listMarker(kind: ListKind, position: number): string {
  return kind === 'bullets' ? '- ' : `${position}. `
}

/**
 * The list a line starts, given what has been typed on it so far — or nothing.
 * Only a marker on its own counts, so the moment to turn a line into an item is
 * the moment the space after the marker goes in, and not every keystroke after.
 */
export function listStartedBy(typed: string): ListKind | null {
  const match = TYPED.exec(typed)
  if (match === null) return null

  return match[1] === undefined ? 'numbers' : 'bullets'
}

/** The marker a line starts with, and how many characters of it there are. */
function markerOf(text: string): { kind: ListKind, length: number } | null {
  const bullet = BULLET.exec(text)
  if (bullet !== null) return { kind: 'bullets', length: bullet[0].length }

  const number = NUMBER.exec(text)
  if (number !== null) return { kind: 'numbers', length: number[0].length }

  return null
}

/** The runs split at every line break, each line keeping the emphasis it was in. */
function linesOf(spans: readonly EmphasisSpan[]): EmphasisSpan[][] {
  const lines: EmphasisSpan[][] = [[]]

  for (const span of spans) {
    span.text.split('\n').forEach((text, at) => {
      if (at > 0) lines.push([])
      if (text !== '') lines[lines.length - 1].push({ ...span, text })
    })
  }

  return lines
}

/** The runs with their first `count` characters gone, whichever runs those were in. */
function withoutFirst(spans: readonly EmphasisSpan[], count: number): EmphasisSpan[] {
  const kept: EmphasisSpan[] = []
  let left = count

  for (const span of spans) {
    const text = span.text.slice(left)
    left = Math.max(0, left - span.text.length)
    if (text !== '') kept.push({ ...span, text })
  }

  return kept
}
