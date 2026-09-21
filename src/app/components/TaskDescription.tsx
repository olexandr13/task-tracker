import {
  Fragment,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { parseDescription, suggestTags, type EmphasisSpan, type TagSuggestion } from '../../core'
import {
  caretPosition,
  fillBox,
  placeCaretAtEnd,
  readBox,
  startListIfTyped,
  tagTypedAtCaret,
  takeTypedTag,
} from '../descriptionBox'
import { panelItem } from '../panelControls'

/**
 * A step dimmer than a title, and smaller, so a description reads as what it is:
 * something about the task rather than the task. The same on both sides — the
 * text must not brighten just because it is being edited.
 */
const descriptionText = 'text-base text-neutral-500 md:text-sm dark:text-neutral-400'

/**
 * Lists read the same on both sides too: the bullet or number sits outside the
 * text, so an item that wraps lines up under its own first word. Set on the
 * container rather than on each list, because in the box the lists are the
 * browser's to make.
 */
const listText = '[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5'

/** How close to the window's edge the tag suggestions may come, and how far they sit from the caret. */
const margin = 8
const gap = 4

const suggestion = `${panelItem} cursor-pointer`
const suggestionOn = 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const suggestionOff = 'text-neutral-700 dark:text-neutral-200'

/** A tag being typed after a `#`, and where the caret is drawn, while there is one. */
interface TypedTag {
  query: string
  left: number
  top: number
  bottom: number
}

interface TaskDescriptionProps {
  description: string
  /** The task this belongs to, so the box says which one it is writing about. */
  title: string
  /** The tags the task carries, which typing `#` does not offer again. */
  tags: readonly string[]
  /** Every tag there is, which typing `#` offers. */
  knownTags: readonly string[]
  onChange: (description: string) => void
  /** Puts a tag chosen after typing `#` on the task. */
  onAddTag: (name: string) => void
}

/**
 * The description as it reads, and the box that replaces it while it is being
 * written. Both show the same thing: words already bold and lists already
 * bulleted, never the markers they are written down as. That is why the box is
 * an editable element rather than a text box — a text box can only hold
 * characters, and `**` or `- ` on screen is a detail of how a description is
 * saved leaking into how it is read.
 *
 * Typing `#` in the box offers the tags there are to put on the task, narrowed
 * as a name is typed after it, and a new tag of that name when there is none.
 * Choosing one takes the `#name` out of the text and puts the tag on the task:
 * a tag is something the task carries, not something written in it.
 */
export function TaskDescription({ description, title, tags, knownTags, onChange, onAddTag }: TaskDescriptionProps) {
  // The box is uncontrolled, which a box holding formatted words has to be: the
  // browser is what puts emphasis on a selection, and rewriting its contents
  // under it on every keystroke would take the caret with it. So the element
  // holds the text while it is open and this holds what it last said, which is
  // what an edit is kept from — no element needed by then.
  const [isEditing, setIsEditing] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const written = useRef(description)
  // The tag being typed, and which suggestion is picked out. Escape puts the
  // suggestions away until the caret leaves that `#` behind.
  const [typing, setTyping] = useState<TypedTag | null>(null)
  const [highlighted, setHighlighted] = useState(0)
  const dismissed = useRef(false)
  const list = useRef<HTMLUListElement>(null)
  const listId = useId()
  const suggestions = typing === null ? [] : suggestTags(knownTags, typing.query, tags)
  const isSuggesting = suggestions.length > 0
  const active = Math.min(highlighted, suggestions.length - 1)

  useEffect(() => {
    const element = box.current
    if (element === null) return

    fillBox(element, written.current)
    element.focus()
    // Caret at the end: writing more is the common case, rewriting is not.
    placeCaretAtEnd(element)
  }, [isEditing])

  /**
   * Whether a tag is being typed where the caret now is, and where to offer it:
   * after every change to the box and every move of the caret.
   */
  function followCaret() {
    const element = box.current
    const query = element === null ? null : tagTypedAtCaret(element)
    if (element === null || query === null) {
      dismissed.current = false
      if (typing !== null) setTyping(null)
      return
    }
    if (dismissed.current) return

    const { left, top, bottom } = caretPosition(element)
    if (typing?.query === query && typing.left === left && typing.top === top) return
    if (typing?.query !== query) setHighlighted(0)
    setTyping({ query, left, top, bottom })
  }

  const onCaretMove = useEffectEvent(followCaret)

  useEffect(() => {
    if (!isEditing) return

    function handleMove() {
      onCaretMove()
    }

    // The caret moves with arrow keys and clicks as well as typing, and the page
    // scrolls under it; capturing, so a scroll inside any part of the page counts.
    document.addEventListener('selectionchange', handleMove)
    window.addEventListener('scroll', handleMove, true)
    return () => {
      document.removeEventListener('selectionchange', handleMove)
      window.removeEventListener('scroll', handleMove, true)
    }
  }, [isEditing])

  // Under the caret, or above it where the window runs out; never past either side.
  useLayoutEffect(() => {
    const element = list.current
    if (element === null || typing === null) return

    const { width, height } = element.getBoundingClientRect()
    const below = typing.bottom + gap
    element.style.left = `${String(Math.max(margin, Math.min(typing.left, window.innerWidth - margin - width)))}px`
    element.style.top = `${String(below + height > window.innerHeight - margin ? Math.max(margin, typing.top - gap - height) : below)}px`
  })

  /** Puts the chosen tag on the task, taking the `#name` it was typed as out of the text. */
  function pick({ name }: TagSuggestion) {
    const element = box.current
    if (element === null || typing === null) return

    takeTypedTag(element, typing.query)
    handleInput()
    setTyping(null)
    onAddTag(name)
  }

  /** What the box now says, read back after every change to it. */
  function handleInput() {
    const element = box.current
    if (element === null) return

    // A marker typed at the start of a line makes that line a list item.
    startListIfTyped(element)

    // A box emptied by hand can be left holding the line break the browser put
    // there, which is not nothing as far as the line inviting you to write is
    // concerned. A list with nothing in it yet is something, though: it is
    // where the next word goes.
    if (element.textContent === '' && element.querySelector('ul, ol') === null) {
      element.replaceChildren()
    }
    written.current = readBox(element)
    followCaret()
  }

  /** Keeping the edit. An empty box clears the description, unlike an empty title. */
  function commitEdit() {
    // The rule in ../../core ignores an unchanged description anyway; not asking
    // at all also saves a pointless write to storage.
    if (written.current.trim() !== description) {
      onChange(written.current)
    }
    setTyping(null)
    setIsEditing(false)
  }

  // Resting a row puts this box away with it, and removing a focused box is not
  // reliably a blur. Keeping the edit on the way out makes clicking off the row
  // the same as clicking off the box: what was written is kept either way.
  const commit = useRef(commitEdit)
  useEffect(() => {
    commit.current = commitEdit
  })
  useEffect(() => () => { commit.current() }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isSuggesting && handleSuggestionKey(event)) return

    // Enter makes a new line here, so keeping the edit has a shortcut of its own.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      commitEdit()
      return
    }

    const command = emphasisShortcut(event)
    if (command !== null) {
      // The browser would do this itself in an editable element, but not
      // everywhere and not without Ctrl+B opening a sidebar behind it.
      event.preventDefault()
      document.execCommand(command)
      handleInput()
      return
    }

    if (event.key === 'Escape') {
      // Dropping the edit unmounts the box, so nothing is left to keep it from.
      event.stopPropagation()
      written.current = description
      setTyping(null)
      setIsEditing(false)
    }
  }

  /**
   * The keys that work the suggestions while they are up: the arrows move
   * between them, Enter or Tab chooses one, and Escape puts them away without
   * dropping the edit. Returns whether the key was theirs.
   */
  function handleSuggestionKey(event: KeyboardEvent<HTMLDivElement>): boolean {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setHighlighted((active + step + suggestions.length) % suggestions.length)
      return true
    }

    if ((event.key === 'Enter' && !event.metaKey && !event.ctrlKey) || (event.key === 'Tab' && !event.shiftKey)) {
      event.preventDefault()
      pick(suggestions[active])
      return true
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      dismissed.current = true
      setTyping(null)
      return true
    }

    return false
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    // Text arrives as text. A description is not somewhere another app's fonts
    // and colours belong, and what is pasted has to be something ../core can
    // write down.
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
    handleInput()
  }

  function startEditing() {
    written.current = description
    setIsEditing(true)
  }

  if (!isEditing) {
    return (
      // A button in all but element: a `<button>` may only hold words, and a
      // description holds lines and lists. Keyed apart from the box, which is a
      // `<div>` too: reused, it would still hold what was typed into it.
      <div
        key="reading"
        role="button"
        tabIndex={0}
        onClick={startEditing}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          // Space would scroll the page as well, being pressed on no real button.
          event.preventDefault()
          startEditing()
        }}
        aria-label={`Edit the description of "${title}"`}
        className={`${descriptionText} ${listText} w-full cursor-text break-words whitespace-pre-wrap`}
      >
        {description === '' ? (
          <span className="text-neutral-400 dark:text-neutral-500">Add a description</span>
        ) : (
          formatted(description)
        )}
      </div>
    )
  }

  return (
    <>
      <div
        key="box"
        ref={box}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={`Description of "${title}"`}
        aria-autocomplete="list"
        aria-controls={isSuggesting ? listId : undefined}
        aria-activedescendant={isSuggesting ? `${listId}-${String(active)}` : undefined}
        data-placeholder="Add a description"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={commitEdit}
        // Grows with what is written rather than sitting at a fixed height, up to
        // a point: past that the box scrolls instead of pushing the list around.
        className={`${descriptionText} ${listText} max-h-64 w-full overflow-y-auto break-words whitespace-pre-wrap focus:outline-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)] dark:empty:before:text-neutral-500`}
      />

      {/* Beside the box rather than in it, so the box never reads it as text, and at the
          caret rather than under the box, where the eye already is. A press on it keeps
          the caret in the box, so choosing a tag does not end the edit. */}
      {isSuggesting && typing !== null && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label="Tags"
          style={{ left: typing.left, top: typing.bottom + gap }}
          onMouseDown={(event) => { event.preventDefault() }}
          className="fixed z-30 flex max-h-60 w-56 flex-col gap-0.5 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          {suggestions.map((option, index) => (
            <li
              key={option.name}
              id={`${listId}-${String(index)}`}
              role="option"
              aria-selected={index === active}
              onClick={() => { pick(option) }}
              onMouseEnter={() => { setHighlighted(index) }}
              className={index === active ? `${suggestion} ${suggestionOn}` : `${suggestion} ${suggestionOff}`}
            >
              <span className="min-w-0 truncate">{option.isNew ? `Create “${option.name}”` : option.name}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** Cmd/Ctrl+B and Cmd/Ctrl+I, and nothing else that happens to be held down. */
function emphasisShortcut(event: KeyboardEvent<HTMLDivElement>): 'bold' | 'italic' | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return null

  const key = event.key.toLowerCase()
  if (key === 'b') return 'bold'
  if (key === 'i') return 'italic'

  return null
}

/**
 * The resting text, laid out the way the box lays it out: a line to an element,
 * and a list as a list. A line with nothing on it holds a `<br>`, so a blank
 * line keeps its height here as it does there.
 */
function formatted(description: string): ReactNode[] {
  return parseDescription(description).map((block, index) => {
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
