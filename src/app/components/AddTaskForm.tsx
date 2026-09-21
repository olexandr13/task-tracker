import { useState, type KeyboardEvent } from 'react'
import type { LocalDay, Repeat } from '../../core'
import { emptyDraft, toDraft, toRepeat } from '../repeatDraft'
import { SchedulePicker } from './SchedulePicker'

interface AddTaskFormProps {
  now: Date
  /** The day a new task starts with — today in the Today list, none in the full one. */
  defaultDueDate: LocalDay | null
  /** A default repeat rule, so a habit form starts with daily enabled. */
  defaultRepeat?: Repeat | null
  /** Placeholder and accessible name — "Add habit" on the Habits page. */
  label?: string
  /** Opens the detailed add sheet (UI-54). */
  onOpenSheet: () => void
  /** `dueDate` is always null alongside a rule, which says which days the task is due itself. */
  onAdd: (title: string, repeat: Repeat | null, dueDate: LocalDay | null) => void
}

export function AddTaskForm({
  now,
  defaultDueDate,
  defaultRepeat,
  label = 'Add task',
  onOpenSheet,
  onAdd,
}: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [draft, setDraft] = useState(() => defaultRepeat !== undefined ? toDraft(defaultRepeat ?? null, now) : emptyDraft(now))
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const repeat = toRepeat(draft)

  // There is no Add button: Enter is the only way to submit. Handling the key
  // directly (rather than leaning on a form's implicit submission, which needs
  // a submit button to be reliable) keeps that the single path.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed.length === 0) return
    onAdd(trimmed, repeat, repeat === null ? dueDate : null)
    setTitle('')
    // Back to the default state: daily for habits, once for tasks.
    setDraft(defaultRepeat !== undefined ? toDraft(defaultRepeat ?? null, now) : emptyDraft(now))
    setDueDate(defaultDueDate)
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 focus-within:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-blue-500">
        <span aria-hidden="true" className="shrink-0 text-lg leading-none text-neutral-400 dark:text-neutral-500">
          +
        </span>

        <input
          type="text"
          value={title}
          onChange={(event) => { setTitle(event.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder={label}
          aria-label={label}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />

        {/* A rule says which days the task is due, so while there is one the date gives way
            to it. A day picked ends the rule, as it does on a task row. */}
        <SchedulePicker
          dueDate={repeat === null ? dueDate : null}
          draft={draft}
          now={now}
          onChangeDueDate={(day) => {
            setDueDate(day)
            if (day !== null) setDraft({ ...draft, kind: 'once' })
          }}
          onChangeRepeat={setDraft}
          showSummary
        />
      </div>

      {/* The detailed add sheet is a stretch from the one-line box (UI-54). On a phone it
          also sits in reach of a thumb, above the bottom bar (UI-4). */}
      <button
        type="button"
        aria-label={label}
        onClick={onOpenSheet}
        className="fixed right-4 bottom-[max(5.5rem,calc(4.25rem+env(safe-area-inset-bottom)))] z-30 grid size-14 place-items-center rounded-full bg-blue-600 text-3xl leading-none text-white shadow-lg hover:bg-blue-700 md:right-6 md:bottom-6 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        <span aria-hidden="true">+</span>
      </button>
    </>
  )
}
