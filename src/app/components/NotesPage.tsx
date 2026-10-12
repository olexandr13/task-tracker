import { useState } from 'react'
import { isBlankNoteText, type Note, type NoteId } from '../../core'
import {
  describeDeleteNote,
  describeEditNote,
  describeNoteBox,
  describeNoteTime,
  NEW_NOTE,
  NEW_NOTE_BOX,
  NO_NOTES,
  NOTES_HEADING,
  NOTES_INTRO,
} from '../notesLabels'
import { deleteControl } from '../rowControls'
import { FormattedText, formattedLists } from './FormattedText'
import { InfoButton } from './InfoButton'
import { NoteEditor, noteText } from './NoteEditor'
import { PlusIcon } from './PlusIcon'

const card = 'rounded-xl border bg-white dark:bg-neutral-900'
const cardAtRest = `${card} border-neutral-200 dark:border-neutral-800`
/** The note being written: picked out, so it is plain which one the buttons work on. */
const cardWriting = `${card} border-blue-300 px-4 pt-2 pb-3 shadow-sm dark:border-blue-500/50`

const newNote =
  'flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-700 md:h-8 dark:bg-blue-500 dark:hover:bg-blue-400'

/** Which note is being written: a new one, one of them by its id, or none. */
type Writing = 'new' | NoteId | null

interface NotesPageProps {
  /** Every note, in the order they are listed (NOTE-2). */
  notes: readonly Note[]
  now: Date
  onAdd: (text: string) => void
  onChange: (id: NoteId, text: string) => void
  onRemove: (note: Note) => void
}

/**
 * The notes (NOTE-1): a button for a new one, then every note as a card,
 * newest first, each reading as it was written — bold, italic and lists
 * already drawn — and changed in place when pressed (NOTE-5). One note is
 * written at a time: pressing another keeps the first and opens that one.
 */
export function NotesPage({ notes, now, onAdd, onChange, onRemove }: NotesPageProps) {
  const [writing, setWriting] = useState<Writing>(null)

  /** A note left: kept as changed, or deleted when it was emptied (NOTE-6). */
  function keep(note: Note, text: string) {
    setWriting(null)
    if (isBlankNoteText(text)) onRemove(note)
    else onChange(note.id, text)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{NOTES_HEADING}</h2>
          <InfoButton label={NOTES_HEADING}>
            {NOTES_INTRO.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </InfoButton>
        </div>
        {writing !== 'new' && (
          <button type="button" onClick={() => { setWriting('new') }} className={newNote}>
            <PlusIcon />
            {NEW_NOTE}
          </button>
        )}
      </div>

      {writing === 'new' && (
        <div className={cardWriting}>
          <NoteEditor
            text=""
            label={NEW_NOTE_BOX}
            onCommit={(text) => {
              setWriting(null)
              // A note left with nothing in it was never written (NOTE-4).
              if (!isBlankNoteText(text)) onAdd(text)
            }}
            onCancel={() => { setWriting(null) }}
          />
        </div>
      )}

      {notes.length === 0 && writing !== 'new' && (
        <p className="px-2 text-sm text-neutral-500 dark:text-neutral-400">{NO_NOTES}</p>
      )}

      {notes.length > 0 && (
        <ul aria-label={NOTES_HEADING} className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id}>
              {writing === note.id ? (
                <div className={cardWriting}>
                  <NoteEditor
                    text={note.text}
                    label={describeNoteBox(note)}
                    onCommit={(text) => { keep(note, text) }}
                    onCancel={() => { setWriting(null) }}
                  />
                </div>
              ) : (
                <NoteCard
                  note={note}
                  now={now}
                  onOpen={() => { setWriting(note.id) }}
                  onRemove={() => { onRemove(note) }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface NoteCardProps {
  note: Note
  now: Date
  onOpen: () => void
  onRemove: () => void
}

/** A note at rest: what it says, as it reads, when it last changed, and its ×. */
function NoteCard({ note, now, onOpen, onRemove }: NoteCardProps) {
  return (
    <article className={`group ${cardAtRest}`}>
      {/* A button in all but element: a `<button>` may only hold words, and a note
          holds lines and lists. */}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          // Space would scroll the page as well, being pressed on no real button.
          event.preventDefault()
          onOpen()
        }}
        aria-label={describeEditNote(note)}
        className={`${noteText} ${formattedLists} block w-full cursor-text px-4 pt-3 break-words whitespace-pre-wrap`}
      >
        <FormattedText text={note.text} />
      </div>
      <div className="flex items-center justify-between gap-3 py-1 pr-2 pl-4 md:pr-2.5">
        <span className="text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
          {describeNoteTime(note.updatedAt, now)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={describeDeleteNote(note)}
          title={describeDeleteNote(note)}
          // A thumb's size on a phone (UI-47); on a wide screen it shows on the note pointed at.
          className={`grid size-10 shrink-0 place-items-center rounded-lg text-lg leading-none md:size-6 md:rounded md:text-base md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${deleteControl}`}
        >
          ×
        </button>
      </div>
    </article>
  )
}
