import { useState, type KeyboardEvent } from 'react'
import type { LocalDay, Repeat } from '../../core'
import { emptyDraft, toRepeat } from '../repeatDraft'
import { SchedulePicker } from './SchedulePicker'

interface AddTaskFormProps {
  now: Date
  /** The day a new task starts with — today in the Today list, none in the full one. */
  defaultDueDate: LocalDay | null
  /** `dueDate` is always null alongside a rule, which says which days the task is due itself. */
  onAdd: (title: string, repeat: Repeat | null, dueDate: LocalDay | null) => void
}

export function AddTaskForm({ now, defaultDueDate, onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
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
    // Back to a one-off on the list's own day, so neither a repeat nor a date
    // picked for one task is inherited by the next unnoticed.
    setDraft(emptyDraft())
    setDueDate(defaultDueDate)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 focus-within:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-blue-500">
      <span aria-hidden="true" className="shrink-0 text-lg leading-none text-neutral-400 dark:text-neutral-500">
        +
      </span>

      <input
        type="text"
        value={title}
        onChange={(event) => { setTitle(event.target.value) }}
        onKeyDown={handleKeyDown}
        placeholder="Add task"
        aria-label="Add task"
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
  )
}
