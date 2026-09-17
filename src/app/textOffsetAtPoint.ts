/** One character of an element's text, where it starts and ends in that text, and where it is drawn. */
interface CharacterBox {
  character: string
  start: number
  end: number
  box: DOMRect
}

/**
 * Where in an element's text a point falls, as the number of characters before
 * it — so a box that takes the text's place can put its caret where the text was
 * clicked. Null when the element shows no text to point at.
 *
 * Measured from the text's own layout rather than asked of the browser, whose
 * caret-from-point lookups are named and supported differently from one engine
 * to the next.
 */
export function textOffsetAtPoint(element: Element, x: number, y: number): number | null {
  const characters = characterBoxes(element)
  if (characters.length === 0) return null

  // The line the point is on, or nearest to it: a click in the leading between
  // lines, or beside the text, still means the line it is level with.
  const nearest = characters.reduce((best, character) =>
    verticalDistance(character.box, y) < verticalDistance(best.box, y) ? character : best,
  )
  const line = characters.filter(({ box }) => box.top < nearest.box.bottom && box.bottom > nearest.box.top)

  // Before the first character whose middle is past the point, or else at the end
  // of the line — before the space it wrapped at, if it did, where its words end.
  const next = line.find(({ box }) => x < box.left + box.width / 2)
  if (next !== undefined) return next.start

  const last = line[line.length - 1]
  return /\s/.test(last.character) ? last.start : last.end
}

function characterBoxes(element: Element): CharacterBox[] {
  const boxes: CharacterBox[] = []
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let before = 0

  for (let node = walker.nextNode() as Text | null; node !== null; node = walker.nextNode() as Text | null) {
    let start = 0
    // By code point: one outside the basic plane is two code units, and a caret never goes between them.
    for (const character of node.data) {
      const end = start + character.length
      range.setStart(node, start)
      range.setEnd(node, end)
      const box = range.getBoundingClientRect()
      // Whitespace the layout folded away takes no room, and is nowhere to point at.
      if (box.width > 0 || box.height > 0) boxes.push({ character, start: before + start, end: before + end, box })
      start = end
    }
    before += node.length
  }

  return boxes
}

function verticalDistance(box: DOMRect, y: number): number {
  if (y < box.top) return box.top - y
  if (y > box.bottom) return y - box.bottom
  return 0
}
