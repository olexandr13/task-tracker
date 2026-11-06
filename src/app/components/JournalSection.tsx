import { useId, useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from 'react'
import {
  isJournalText,
  JOURNAL_GOAL,
  MAX_JOURNAL_TEXT_LENGTH,
  type JournalEntry,
  type JournalEntryId,
  type JournalSection as Section,
} from '../../core'
import { describeGoal, JOURNAL_SECTION_LABELS } from '../journalLabels'
import { deleteControl } from '../rowControls'

const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'

/** One numbered line: the number in a narrow column, so the text of every line starts in one place. */
const row = 'flex items-baseline gap-3 border-b border-neutral-100 last:border-b-0 dark:border-neutral-800'
const number = 'w-4 shrink-0 text-right text-sm text-neutral-400 tabular-nums dark:text-neutral-500'
/**
 * A line's text, wrapped to show it whole. A phone's a size that does not zoom
 * the page on focus (UI-47); a wide screen's the list's.
 */
const lineText = 'col-start-1 row-start-1 py-2.5 text-base break-words whitespace-pre-wrap md:py-1.5 md:text-sm'
const lineBox = `${lineText} resize-none overflow-hidden bg-transparent text-neutral-800 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500`

/** Where the caret goes in a line it is moved to. */
type Caret = 'end' | 'keep'

type LineBoxProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'className' | 'rows'> & {
  value: string
  boxRef: (box: HTMLTextAreaElement | null) => void
}

/**
 * A line's box, as tall as its text: a copy of the text, unseen, sits in the
 * same place and sets the height, so a long line wraps rather than running out
 * of sight.
 */
function LineBox({ value, boxRef, placeholder, ...props }: LineBoxProps) {
  return (
    <div className="grid min-w-0 flex-1">
      <span aria-hidden="true" className={`invisible ${lineText}`}>{`${value === '' ? (placeholder ?? '') : value} `}</span>
      <textarea ref={boxRef} rows={1} value={value} placeholder={placeholder} className={lineBox} {...props} />
    </div>
  )
}

/** Whether ↑ or ↓ leaves the box: at once in a line on one row, from the first or last character in one wrapped. */
function leavesBox(box: HTMLTextAreaElement, key: 'ArrowUp' | 'ArrowDown'): boolean {
  const style = getComputedStyle(box)
  const rows = (box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / parseFloat(style.lineHeight)
  if (!(rows >= 1.5)) return true
  if (box.selectionStart !== box.selectionEnd) return false
  return key === 'ArrowUp' ? box.selectionStart === 0 : box.selectionEnd === box.value.length
}

interface JournalSectionProps {
  section: Section
  /** The section's lines for today, in the order they were written. */
  lines: readonly JournalEntry[]
  onAdd: (section: Section, text: string) => void
  onChange: (id: JournalEntryId, text: string) => void
  onRemove: (entry: JournalEntry) => void
}

/**
 * One section of today's journal (JRN-2, JRN-3): its lines, numbered, each
 * changed in place, and under them a line waiting for the next — then, until
 * there are as many as it asks for, the numbers still to fill, faint. The dots
 * by the heading say how far it has come. Enter goes on down the lines.
 */
export function JournalSection({ section, lines, onAdd, onChange, onRemove }: JournalSectionProps) {
  const labels = JOURNAL_SECTION_LABELS[section]
  const headingId = useId()
  // Every line's box, the waiting one last, so the caret can be handed up and down.
  const boxes = useRef<(HTMLTextAreaElement | null)[]>([])
  const count = lines.length
  const reached = count >= JOURNAL_GOAL
  const still = Math.max(0, JOURNAL_GOAL - count - 1)

  /** Moves the caret to the line at `index`, the waiting line past the last. */
  function moveTo(index: number, caret: Caret = 'keep') {
    const box = boxes.current[Math.max(0, Math.min(index, count))]
    if (box === null || box === undefined) return
    box.focus()
    if (caret === 'end') box.setSelectionRange(box.value.length, box.value.length)
  }

  return (
    <section aria-labelledby={headingId} className={`${card} flex flex-col gap-1 px-4 pt-3 pb-1.5`}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={headingId} className="flex items-center gap-2 text-base text-neutral-900 dark:text-neutral-100">
          <span aria-hidden="true">{labels.emoji}</span>
          {labels.title}
        </h3>
        <span role="img" aria-label={describeGoal(count)} title={describeGoal(count)} className="flex items-center gap-1">
          {Array.from({ length: JOURNAL_GOAL }, (_, index) => (
            <span
              key={index}
              className={`size-1.5 rounded-full ${
                index >= count
                  ? 'bg-neutral-200 dark:bg-neutral-700'
                  : reached
                    ? 'bg-green-500 dark:bg-green-400'
                    : 'bg-blue-500 dark:bg-blue-400'
              }`}
            />
          ))}
          {count > JOURNAL_GOAL && (
            <span className="ml-0.5 text-xs text-green-700 tabular-nums dark:text-green-500">
              +{count - JOURNAL_GOAL}
            </span>
          )}
        </span>
      </div>

      <ol className="flex flex-col">
        {lines.map((entry, index) => (
          <JournalLine
            key={entry.id}
            entry={entry}
            number={index + 1}
            label={`${labels.line} ${String(index + 1)}`}
            boxRef={(box) => { boxes.current[index] = box }}
            onUp={() => { moveTo(index - 1, 'end') }}
            onDown={() => { moveTo(index + 1) }}
            onChange={onChange}
            onRemove={onRemove}
          />
        ))}

        <JournalNewLine
          number={count + 1}
          label={labels.add}
          placeholder={labels.placeholder}
          boxRef={(box) => { boxes.current[count] = box }}
          onUp={() => { moveTo(count - 1, 'end') }}
          onAdd={(text) => { onAdd(section, text) }}
        />

        {/* The lines still to fill towards the goal, a press on any one opening the waiting line. */}
        {Array.from({ length: still }, (_, index) => (
          <li key={`still-${String(index)}`} aria-hidden="true" onClick={() => { moveTo(count) }} className={`${row} cursor-text`}>
            <span className={`${number} text-neutral-300 dark:text-neutral-600`}>{count + 2 + index}</span>
            <span className="flex-1 py-2.5 text-base md:py-1.5 md:text-sm">{'\u00a0'}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

interface JournalLineProps {
  entry: JournalEntry
  number: number
  label: string
  boxRef: (box: HTMLTextAreaElement | null) => void
  onUp: () => void
  onDown: () => void
  onChange: (id: JournalEntryId, text: string) => void
  onRemove: (entry: JournalEntry) => void
}

/**
 * A line written (JRN-4, JRN-5): a box that reads as text until it is pressed.
 * What is typed is kept here until the caret leaves, so a line is saved once,
 * not a keystroke at a time; leaving it empty deletes it. Escape puts it back as
 * it was.
 */
function JournalLine({ entry, number: shown, label, boxRef, onUp, onDown, onChange, onRemove }: JournalLineProps) {
  // Null while nothing is typed, so a change from another device shows as it arrives.
  const [draft, setDraft] = useState<string | null>(null)
  // Set by Escape for the blur that follows it, which must not keep the edit.
  const dropping = useRef(false)

  function commit() {
    const typed = draft
    setDraft(null)
    if (dropping.current) {
      dropping.current = false
      return
    }
    if (typed === null) return
    if (isJournalText(typed)) onChange(entry.id, typed)
    else onRemove(entry)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' || (event.key === 'ArrowDown' && leavesBox(event.currentTarget, 'ArrowDown'))) {
      // Leaving the line keeps it, by its blur.
      event.preventDefault()
      onDown()
      return
    }
    if (event.key === 'ArrowUp' && leavesBox(event.currentTarget, 'ArrowUp')) {
      event.preventDefault()
      onUp()
      return
    }
    if (event.key === 'Escape') {
      event.stopPropagation()
      dropping.current = true
      event.currentTarget.blur()
    }
  }

  return (
    <li className={`group ${row}`}>
      <span className={number}>{shown}</span>
      <LineBox
        boxRef={boxRef}
        name="journal-line"
        value={draft ?? entry.text}
        maxLength={MAX_JOURNAL_TEXT_LENGTH}
        onChange={(event) => { setDraft(event.target.value) }}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        aria-label={label}
        autoComplete="off"
        enterKeyHint="next"
      />
      <button
        type="button"
        onClick={() => { onRemove(entry) }}
        aria-label={`Delete “${entry.text}”`}
        // A thumb's size on a phone (UI-47); on a wide screen it shows on the line pointed at or being written.
        className={`-mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-lg leading-none md:mr-0 md:size-6 md:rounded md:text-base md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${deleteControl}`}
      >
        ×
      </button>
    </li>
  )
}

interface JournalNewLineProps {
  number: number
  label: string
  placeholder: string
  boxRef: (box: HTMLTextAreaElement | null) => void
  onUp: () => void
  onAdd: (text: string) => void
}

/**
 * The line under the last, waiting for the next (JRN-2). Nothing is written
 * until there is something on it: Enter writes it and leaves the caret here for
 * the one after, and clicking away keeps what was typed, as a rename does.
 * Escape empties it.
 */
function JournalNewLine({ number: shown, label, placeholder, boxRef, onUp, onAdd }: JournalNewLineProps) {
  const [text, setText] = useState('')
  const dropping = useRef(false)

  function write() {
    if (isJournalText(text)) onAdd(text)
    setText('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      write()
      return
    }
    if (event.key === 'ArrowUp' && leavesBox(event.currentTarget, 'ArrowUp')) {
      event.preventDefault()
      onUp()
      return
    }
    if (event.key === 'Escape') {
      event.stopPropagation()
      dropping.current = true
      setText('')
      event.currentTarget.blur()
    }
  }

  return (
    <li className={row}>
      <span className={number}>{shown}</span>
      <LineBox
        boxRef={boxRef}
        name="journal-line"
        value={text}
        maxLength={MAX_JOURNAL_TEXT_LENGTH}
        onChange={(event) => { setText(event.target.value) }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (dropping.current) {
            dropping.current = false
            return
          }
          write()
        }}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="next"
      />
    </li>
  )
}
