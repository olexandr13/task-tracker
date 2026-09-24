import { useState, type KeyboardEvent } from 'react'
import { firstDueDay, type LocalDay, type LocalTime, type Repeat } from '../../core'
import { emptyDraft, toDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { ABOVE_PHONE_BAR } from '../usePhoneLayout'
import { PlusIcon } from './PlusIcon'
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
  /**
   * The day picked: the task is due on it, or its rule starts there (DUE-6) —
   * and the hour on that day, where one was picked too (DUE-19).
   */
  onAdd: (title: string, repeat: Repeat | null, day: LocalDay | null, time: LocalTime | null) => void
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
  const [day, setDay] = useState(defaultDueDate)
  const [time, setTime] = useState<LocalTime | null>(null)
  const repeat = toRepeat(draft)

  /**
   * The day goes with the shape it was picked for, as it does on a task
   * (`setRepeat`): a date belongs to a one-off, a start to a rule, so turning
   * one into the other starts again with no day. A rule swapped for another
   * keeps the day it starts on.
   */
  function handleRepeatChange(next: RepeatDraft) {
    setDraft(next)
    if ((toRepeat(next) === null) !== (repeat === null)) setDay(null)
  }

  /**
   * An hour hangs on a day (`setDueTime`), so a day taken away here takes the
   * hour with it rather than leaving it to be inherited by the next day picked.
   * A repeating task keeps its hour: its rule is still giving it days.
   */
  function handleDayChange(next: LocalDay | null) {
    setDay(next)
    if (next === null && repeat === null) setTime(null)
  }

  // There is no Add button: Enter is the only way to submit. Handling the key
  // directly (rather than leaning on a form's implicit submission, which needs
  // a submit button to be reliable) keeps that the single path.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed.length === 0) return
    onAdd(trimmed, repeat, day, time)
    setTitle('')
    // Back to the default state: daily for habits, once for tasks.
    setDraft(defaultRepeat !== undefined ? toDraft(defaultRepeat ?? null, now) : emptyDraft(now))
    setDay(defaultDueDate)
    setTime(null)
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

        {/* A rule says which days the task is due, so the button reads the rule with the
            first day it comes round on. A day picked is the task's date, or the day its
            rule starts on, as it is on a task row (DUE-6). */}
        <SchedulePicker
          dueDate={repeat === null || day === null ? day : firstDueDay(repeat, day)}
          startDay={repeat === null ? null : day}
          draft={draft}
          now={now}
          onChangeDay={handleDayChange}
          dueTime={time}
          onChangeTime={setTime}
          onChangeRepeat={handleRepeatChange}
          showSummary
        />
      </div>

      {/* The detailed add sheet is a stretch from the one-line box (UI-54). On a phone it
          also sits in reach of a thumb, above the bottom bar (UI-4). */}
      <button
        type="button"
        aria-label={label}
        onClick={onOpenSheet}
        className={`fixed right-[max(1rem,env(safe-area-inset-right))] ${ABOVE_PHONE_BAR} z-30 grid size-14 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-95 md:right-6 md:bottom-6 dark:bg-blue-500 dark:shadow-black/40 dark:hover:bg-blue-400`}
      >
        <PlusIcon className="size-7" />
      </button>
    </>
  )
}
