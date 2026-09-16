import {
  listMarker,
  listStartedBy,
  parseDescription,
  writeEmphasis,
  type DescriptionBlock,
  type EmphasisSpan,
  type ListKind,
} from '../core'

/**
 * The box a description is written in, on the DOM's side.
 *
 * The box shows emphasis and lists rather than markers, which a text box cannot
 * do — so it is an editable element holding real `<strong>`, `<em>`, `<ul>` and
 * `<ol>`, and this is the bridge between that and the plain string ../core
 * writes down. Filling the box and reading it back are the two halves of that
 * bridge; everything either side of them deals in descriptions, never in
 * elements.
 */

/**
 * Puts a description into the box, as formatted words rather than as markers.
 * Every line is an element of its own, as the browser makes one when Enter is
 * pressed: turning a line into a list item works on the element it is in, and
 * would take its neighbours with it if they shared one.
 */
export function fillBox(element: HTMLElement, description: string): void {
  element.replaceChildren(...parseDescription(description).flatMap(asBlock))
}

/** Reads the box back out as a description. */
export function readBox(element: HTMLElement): string {
  const spans: EmphasisSpan[] = []
  collect(element, false, false, spans)

  return writeEmphasis(spans)
}

/** Puts the caret at the end, as clicking into a title does. */
export function placeCaretAtEnd(element: HTMLElement): void {
  const range = document.createRange()
  range.selectNodeContents(element)
  range.collapse(false)

  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/**
 * Turns the line being written into a list item if all that is on it before
 * the caret is a list marker — `- ` or `1. ` — taking the marker off as it does.
 * Called on every change to the box, so it happens as the space goes in.
 *
 * Both steps go through the browser's own editing commands rather than moving
 * elements by hand, so the list is one the browser made and knows how to carry
 * on: Enter continuing it, Enter on an empty item ending it.
 */
export function startListIfTyped(box: HTMLElement): void {
  const selection = window.getSelection()
  if (selection === null || selection.rangeCount === 0 || !selection.isCollapsed) return

  const caret = selection.getRangeAt(0)
  if (!box.contains(caret.startContainer)) return

  const typed = typedOnLine(box, caret)
  const kind = typed === null ? null : listStartedBy(typed)
  if (typed === null || kind === null) return

  // The line first and the marker second: a box emptied of its marker before
  // there is a list in it is an empty box, and ../components/TaskDescription
  // clears those out from under the caret. A browser can refuse — Chrome does
  // while another command is still running — and a marker taken off a line that
  // never became an item is a lost marker.
  if (!document.execCommand(kind === 'bullets' ? 'insertUnorderedList' : 'insertOrderedList')) return

  // Where the caret is left afterwards differs by browser — Chrome puts it back
  // at the start of the item — so the marker is found from where the item
  // starts rather than from where the caret happens to be.
  const item = itemAround(selection.anchorNode, box)
  if (item === null) return

  selection.collapse(item, 0)
  for (let left = typed.length; left > 0; left--) {
    selection.modify('extend', 'forward', 'character')
  }
  document.execCommand('delete')
}

function itemAround(node: Node | null, box: HTMLElement): HTMLElement | null {
  for (let at = node; at !== null && at !== box; at = at.parentNode) {
    if (at instanceof HTMLElement && at.tagName === 'LI') return at
  }

  return null
}

/**
 * What is on the caret's line before the caret — or nothing, where that line
 * is already a list item and there is no list to start.
 */
function typedOnLine(box: HTMLElement, caret: Range): string | null {
  let line: Node = box
  for (let node: Node | null = caret.startContainer; node !== null && node !== box; node = node.parentNode) {
    if (node instanceof HTMLElement && node.tagName === 'LI') return null
    if (line === box && node instanceof HTMLElement && startsALine(node)) line = node
  }

  const before = document.createRange()
  before.setStart(line, 0)
  before.setEnd(caret.startContainer, caret.startOffset)

  // Read the way the box is read, so a `<br>` ends a line here as it does there.
  const spans: EmphasisSpan[] = []
  for (const node of before.cloneContents().childNodes) {
    collect(node, false, false, spans)
  }
  const text = spans.map((span) => span.text).join('')

  return text.slice(text.lastIndexOf('\n') + 1)
}

function asBlock(block: DescriptionBlock): HTMLElement | HTMLElement[] {
  if (block.kind === 'lines') {
    return block.lines.map((line) => asLine('div', line))
  }

  const list = document.createElement(block.kind === 'bullets' ? 'ul' : 'ol')
  list.append(...block.lines.map((line) => asLine('li', line)))

  return list
}

function asLine(tag: 'div' | 'li', spans: readonly EmphasisSpan[]): HTMLElement {
  const element = document.createElement(tag)
  // A line with nothing on it holds a `<br>`, as the browser's own do: without
  // one it has no height, and a blank line would vanish from the box.
  element.append(...(spans.length === 0 ? [document.createElement('br')] : spans.map(asElement)))

  return element
}

function asElement(span: EmphasisSpan): Node {
  let node: Node = document.createTextNode(span.text)

  // `<em>` inside `<strong>` rather than a styled element either way: bold here
  // means these words matter more, which a screen reader should hear too.
  if (span.italic) {
    node = wrap('em', node)
  }
  if (span.bold) {
    node = wrap('strong', node)
  }

  return node
}

function wrap(tag: 'em' | 'strong', node: Node): HTMLElement {
  const element = document.createElement(tag)
  element.append(node)

  return element
}

/**
 * Walks what the box holds into runs. Browsers differ on what they leave behind
 * — `<b>` or `<strong>`, a styled element, a line in its own `<div>` — so this
 * reads what the element means rather than which one it is.
 */
function collect(node: Node, bold: boolean, italic: boolean, into: EmphasisSpan[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    into.push({ text: node.nodeValue ?? '', bold, italic })
    return
  }

  if (!(node instanceof HTMLElement)) return

  if (node.tagName === 'BR') {
    // A browser ends a line with a `<br>` that is only there to give the line a
    // height. One with nothing after it breaks nothing.
    if (node.nextSibling !== null) {
      into.push({ text: '\n', bold, italic })
    }
    return
  }

  const list = listKind(node)
  if (list !== null) {
    collectList(node, list, bold, italic, into)
    return
  }

  if (startsALine(node) && breaksLine(node, into)) {
    into.push({ text: '\n', bold, italic })
  }

  const nowBold = bold || isBold(node)
  const nowItalic = italic || isItalic(node)
  for (const child of node.childNodes) {
    collect(child, nowBold, nowItalic, into)
  }
}

/**
 * A list, item by item, each written down as a line starting with its marker.
 * Numbers are counted here rather than read off the screen: the browser draws
 * them, and they are whatever place an item is in.
 */
function collectList(list: HTMLElement, kind: ListKind, bold: boolean, italic: boolean, into: EmphasisSpan[]): void {
  let position = 0

  for (const child of list.childNodes) {
    if (!(child instanceof HTMLElement) || child.tagName !== 'LI') {
      collect(child, bold, italic, into)
      continue
    }

    position++
    // The line break and the marker are never emphasis, whatever the item is in.
    if (position === 1 ? breaksLine(list, into) : into.length > 0) {
      into.push({ text: '\n', bold: false, italic: false })
    }
    into.push({ text: listMarker(kind, position), bold: false, italic: false })

    const itemBold = bold || isBold(child)
    const itemItalic = italic || isItalic(child)
    for (const part of child.childNodes) {
      collect(part, itemBold, itemItalic, into)
    }
  }

  // Text left straight after a list, rather than in an element of its own, is
  // still on a line of its own. An element of its own brings its break with it.
  const next = list.nextSibling
  if (next !== null && !(next instanceof HTMLElement && (startsALine(next) || listKind(next) !== null))) {
    into.push({ text: '\n', bold: false, italic: false })
  }
}

/**
 * Whether a line of its own starts a new line here. Not at the start of the
 * box, which is an element like these and does not start with a break; and not
 * as the first thing inside another line, which has already broken it — Chrome
 * leaves a list made from a line inside that line's `<div>`.
 */
function breaksLine(element: HTMLElement, into: readonly EmphasisSpan[]): boolean {
  const parent = element.parentElement
  const opensItsParent = element.previousSibling === null && parent !== null && startsALine(parent)

  return into.length > 0 && !opensItsParent
}

function listKind(element: HTMLElement): ListKind | null {
  if (element.tagName === 'UL') return 'bullets'
  if (element.tagName === 'OL') return 'numbers'

  return null
}

function startsALine(element: HTMLElement): boolean {
  return element.tagName === 'DIV' || element.tagName === 'P' || element.tagName === 'LI'
}

function isBold(element: HTMLElement): boolean {
  if (element.tagName === 'B' || element.tagName === 'STRONG') return true

  const weight = element.style.fontWeight
  return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600
}

function isItalic(element: HTMLElement): boolean {
  return element.tagName === 'I' || element.tagName === 'EM' || element.style.fontStyle === 'italic'
}
