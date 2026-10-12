import { useEffect, useRef, useState, type ClipboardEvent, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import { emphasisCommand, fillBox, placeCaretAtEnd, readBox, startListIfTyped } from '../descriptionBox'
import { describeShortcut, FORMAT_LABELS, NOTE_DONE, NOTE_PLACEHOLDER, type FormatCommand } from '../notesLabels'
import { BulletListIcon } from './BulletListIcon'
import { formattedLists } from './FormattedText'
import { NumberedListIcon } from './NumberedListIcon'

/** The browser's own editing command behind each button, so what it makes is what Enter and Backspace know how to carry on. */
const COMMANDS: Readonly<Record<FormatCommand, string>> = {
  bold: 'bold',
  italic: 'italic',
  bullets: 'insertUnorderedList',
  numbers: 'insertOrderedList',
}

/** The key that does the same as a button, where one does (TASK-32). */
const SHORTCUTS: Readonly<Partial<Record<FormatCommand, string>>> = { bold: 'B', italic: 'I' }

/** A phone's text a size that does not zoom the page on focus (UI-47); a wide screen's the list's. */
export const noteText = 'text-base text-neutral-800 md:text-sm dark:text-neutral-100'

const tool =
  'grid size-9 shrink-0 place-items-center rounded-lg text-base leading-none transition-colors md:size-7 md:text-sm'
const toolOff =
  'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
const toolOn = 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/15 dark:bg-blue-400/15 dark:text-blue-300'
const done =
  'ml-auto flex h-9 items-center rounded-lg px-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600/10 md:h-7 md:px-2.5 dark:text-blue-400 dark:hover:bg-blue-400/10'

/** Whether shortcuts are spelled with ⌘ here. */
const onMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/u.test(navigator.userAgent)

interface NoteEditorProps {
  /** What the note says as the box opens: nothing, for a new one. */
  text: string
  /** The box's name, to a screen reader. */
  label: string
  /** Keeps what was written: on clicking away, Cmd/Ctrl+Enter or Done (NOTE-5). */
  onCommit: (text: string) => void
  /** Drops what was written: Escape (NOTE-5). */
  onCancel: () => void
}

/**
 * The box a note is written in (NOTE-5), with the formatting buttons over it
 * (NOTE-7). It is the description's box (TASK-32, TASK-44) with a row of
 * buttons for what the keys there do, so bold and lists are there to be found
 * and are there on a phone, which has no Cmd+B: an editable element holding
 * real `<strong>`, `<em>`, `<ul>` and `<ol>`, read back into the one plain
 * string ../../core writes down (../descriptionBox).
 *
 * The box is uncontrolled, as the description's is: the browser is what puts
 * emphasis on a selection, and rewriting its contents under it on every
 * keystroke would take the caret with it. A press on a button never takes the
 * caret out of the box, so a word can be selected and made bold without being
 * selected again.
 *
 * What was written is kept as the box is left. A box taken away without being
 * left — the page changing under it — keeps what was changed in it too.
 */
export function NoteEditor({ text, label, onCommit, onCancel }: NoteEditorProps) {
  const box = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  // What the box last said, and whether it has been kept or dropped already —
  // after which nothing more is said about it, however it goes.
  const written = useRef(text)
  const finished = useRef(false)
  // The selection last made in the box, put back if a button press took it away.
  const selected = useRef<Range | null>(null)
  const [formats, setFormats] = useState<ReadonlySet<FormatCommand>>(new Set())

  useEffect(() => {
    const element = box.current
    if (element === null) return

    fillBox(element, written.current)
    element.focus()
    // Caret at the end: writing more is the common case, rewriting is not.
    placeCaretAtEnd(element)
  }, [])

  // Which buttons stand for what is at the caret: pressed over bold words, or in a list.
  useEffect(() => {
    function follow() {
      const element = box.current
      const selection = window.getSelection()
      if (element === null || selection === null || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      if (!element.contains(range.commonAncestorContainer)) return

      selected.current = range.cloneRange()
      const now = formatsAtSelection()
      setFormats((before) => (sameFormats(before, now) ? before : now))
    }

    document.addEventListener('selectionchange', follow)
    return () => { document.removeEventListener('selectionchange', follow) }
  }, [])

  // Taken away without being left — the page changed under it — what was changed is kept.
  // Only what was changed: a box opened and closed again at once, as React does in
  // development to try an effect twice, has nothing to keep.
  const keepOnLeaving = useRef(() => {})
  useEffect(() => {
    keepOnLeaving.current = () => {
      if (!finished.current && written.current !== text) onCommit(written.current)
    }
  })
  useEffect(() => () => { keepOnLeaving.current() }, [])

  // The tab closed, or the page reloaded, with the box still open: nothing is
  // left to blur, so what was changed is kept on the way out.
  useEffect(() => {
    function handleLeave() {
      keepOnLeaving.current()
    }

    window.addEventListener('pagehide', handleLeave)
    return () => { window.removeEventListener('pagehide', handleLeave) }
  }, [])

  /** What the box now says, read back after every change to it. */
  function handleInput() {
    const element = box.current
    if (element === null) return

    // A marker typed at the start of a line makes that line a list item.
    startListIfTyped(element)

    // A box emptied by hand can be left holding the line break the browser put
    // there, which hides the placeholder. A list with nothing in it yet is
    // something, though: it is where the next word goes.
    if (element.textContent === '' && element.querySelector('ul, ol') === null) {
      element.replaceChildren()
    }
    written.current = readBox(element)
  }

  function commit() {
    if (finished.current) return
    finished.current = true
    onCommit(written.current)
  }

  function cancel() {
    finished.current = true
    onCancel()
  }

  /** A formatting button pressed: done to the selection, in the box, as its key would (NOTE-7). */
  function format(command: FormatCommand) {
    const element = box.current
    if (element === null) return

    element.focus()
    const selection = window.getSelection()
    if (selection !== null && selected.current !== null && !element.contains(selection.anchorNode)) {
      selection.removeAllRanges()
      selection.addRange(selected.current)
    }
    document.execCommand(COMMANDS[command])
    handleInput()
    setFormats(formatsAtSelection())
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    // Moving between the box and its own buttons is not leaving it. Another app
    // taking the window is: a phone may close the app behind it without a word.
    if (wrapper.current?.contains(event.relatedTarget) === true) return
    commit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Enter makes a new line here, so keeping the note has a shortcut of its own.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      commit()
      return
    }

    const command = emphasisCommand(event)
    if (command !== null) {
      // The browser would do this itself in an editable element, but not
      // everywhere and not without Ctrl+B opening a sidebar behind it.
      event.preventDefault()
      format(command)
      return
    }

    if (event.key === 'Escape') {
      // Whatever the page is over — a sheet, the back button's place — stays put.
      event.preventDefault()
      event.stopPropagation()
      cancel()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    // Text arrives as text: another app's fonts and colours are no part of a
    // note, and what is pasted has to be something ../../core can write down.
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
    handleInput()
  }

  return (
    <div ref={wrapper} onBlur={handleBlur} className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Formatting" className="-mx-1.5 flex items-center gap-0.5 md:-mx-1">
        <Tool command="bold" pressed={formats.has('bold')} onPress={format}>
          <span className="font-bold">B</span>
        </Tool>
        <Tool command="italic" pressed={formats.has('italic')} onPress={format}>
          <span className="font-serif italic">I</span>
        </Tool>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-neutral-200 md:h-4 dark:bg-neutral-700" />
        <Tool command="bullets" pressed={formats.has('bullets')} onPress={format}>
          <BulletListIcon className="size-5 md:size-4" />
        </Tool>
        <Tool command="numbers" pressed={formats.has('numbers')} onPress={format}>
          <NumberedListIcon className="size-5 md:size-4" />
        </Tool>
        <button
          type="button"
          onMouseDown={(event) => { event.preventDefault() }}
          onClick={commit}
          className={done}
        >
          {NOTE_DONE}
        </button>
      </div>

      <div
        ref={box}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        data-placeholder={NOTE_PLACEHOLDER}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={`${noteText} ${formattedLists} min-h-16 w-full break-words whitespace-pre-wrap focus:outline-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)] dark:empty:before:text-neutral-500`}
      />
    </div>
  )
}

interface ToolProps {
  command: FormatCommand
  pressed: boolean
  onPress: (command: FormatCommand) => void
  children: ReactNode
}

/**
 * One formatting button. A press never takes the caret out of the box — on a
 * phone it would put the keyboard away as well — and it says the key that
 * does the same, where there is one.
 */
function Tool({ command, pressed, onPress, children }: ToolProps) {
  const shortcut = SHORTCUTS[command]
  const name = FORMAT_LABELS[command]

  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={pressed}
      title={shortcut === undefined ? name : `${name} (${describeShortcut(shortcut, onMac)})`}
      onMouseDown={(event) => { event.preventDefault() }}
      onClick={() => { onPress(command) }}
      className={`${tool} ${pressed ? toolOn : toolOff}`}
    >
      {children}
    </button>
  )
}

/** What is on at the selection, as far as the browser can say: not every browser — nor jsdom — answers. */
function formatsAtSelection(): Set<FormatCommand> {
  const on = new Set<FormatCommand>()
  for (const command of Object.keys(COMMANDS) as FormatCommand[]) {
    try {
      if (document.queryCommandState(COMMANDS[command])) on.add(command)
    } catch {
      // Nothing known is nothing on.
    }
  }
  return on
}

function sameFormats(a: ReadonlySet<FormatCommand>, b: ReadonlySet<FormatCommand>): boolean {
  return a.size === b.size && [...a].every((format) => b.has(format))
}
