import { Fragment, type ReactNode } from 'react'
import { parseDescription, type EmphasisSpan } from '../../core'

/**
 * Lists read the same at rest as in the box that writes them: the bullet or
 * number sits outside the text, so an item that wraps lines up under its own
 * first word. Set on the container rather than on each list, because in the box
 * the lists are the browser's to make.
 */
export const formattedLists = '[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5'

/**
 * Text written with emphasis and lists — a task's description, a note — as it
 * reads: words already bold and lists already bulleted, never the markers they
 * are written down as (TASK-33, TASK-48). Laid out the way the box lays it out:
 * a line to an element, and a list as a list. A line with nothing on it holds a
 * `<br>`, so a blank line keeps its height here as it does there.
 *
 * Drawn inside an element that keeps white space (`whitespace-pre-wrap`) and
 * carries `formattedLists`, as the box does.
 */
export function FormattedText({ text }: { text: string }) {
  return parseDescription(text).map((block, index) => {
    const lines = block.lines.map((line, at) => {
      const words = line.length === 0 ? <br /> : emphasised(line)
      return block.kind === 'lines' ? <div key={at}>{words}</div> : <li key={at}>{words}</li>
    })

    if (block.kind === 'bullets') return <ul key={index}>{lines}</ul>
    if (block.kind === 'numbers') return <ol key={index}>{lines}</ol>
    return <Fragment key={index}>{lines}</Fragment>
  })
}

/**
 * One line's words. `<strong>` and `<em>` rather than styled spans: bold here
 * means these words matter more, which is something a screen reader should
 * hear too.
 */
function emphasised(line: readonly EmphasisSpan[]): ReactNode[] {
  return line.map((span, index) => {
    const text = span.italic ? <em className="italic">{span.text}</em> : span.text

    return span.bold
      ? <strong key={index} className="font-semibold">{text}</strong>
      : <Fragment key={index}>{text}</Fragment>
  })
}
