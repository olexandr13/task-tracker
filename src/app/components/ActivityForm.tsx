import { useId, useState, type KeyboardEvent, type RefObject } from 'react'
import {
  hasSlotStarted,
  isActivityName,
  isSessionLength,
  MAX_SESSION_MINUTES,
  suggestActivities,
  type ActivityChange,
  type ActivityEntry,
  type LocalDay,
} from '../../core'
import { ACTIVITY_REFUSALS, type ActivityRefusal } from '../activityLabels'
import { describeSlot } from '../checkInLabels'
import { describeDuration, parseDuration } from '../durationLabels'
import { ChevronIcon } from './ChevronIcon'

const field =
  'w-full min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const fieldRefused = 'border-red-400 dark:border-red-500/70'
const button =
  'shrink-0 rounded-lg px-3 py-2 text-base transition-colors md:px-2.5 md:py-1 md:text-sm'
const primary = `${button} bg-blue-600 font-medium text-white hover:bg-blue-700 active:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400`
const quiet = `${button} text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800`
const danger = `${button} text-red-600 hover:bg-red-50 active:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 dark:active:bg-red-950/40`
const stepper =
  'flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:size-7 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'
const option = 'flex cursor-pointer items-center rounded-lg px-2.5 py-2 text-base md:px-2 md:py-1.5 md:text-sm'
const optionOn = 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const optionOff = 'text-neutral-700 dark:text-neutral-200'

interface ActivityFormProps {
  day: LocalDay
  /** The hour of the day a record goes under, or the one being changed is moved to. */
  hour: number
  now: Date
  /** Every activity there is, the ones offered first first (`knownActivities`). */
  known: readonly string[]
  /** The record being changed, or null while adding. The form is keyed by it, so its boxes start from it. */
  editing: ActivityEntry | null
  onHourChange: (hour: number) => void
  onAdd: (activity: string, seconds: number, hour: number) => void
  onSave: (id: string, change: ActivityChange) => void
  onDelete: (entry: ActivityEntry) => void
  onCancel: () => void
  /** The activity box, for the page to put the caret in. */
  inputRef: RefObject<HTMLInputElement | null>
}

/**
 * The form a record is written in (ACT-2 to ACT-6, ACT-10): the hour it goes
 * under, stepped with ‹ and ›; what was done, with the activities used before
 * offered while typing; and how long, minutes unless hours are written.
 *
 * A record that will not do is refused under the boxes, saying why, rather than
 * the button being dimmed; what was typed stays to be put right.
 */
export function ActivityForm({
  day,
  hour,
  now,
  known,
  editing,
  onHourChange,
  onAdd,
  onSave,
  onDelete,
  onCancel,
  inputRef,
}: ActivityFormProps) {
  const listId = useId()
  const [activity, setActivity] = useState(editing?.activity ?? '')
  const [duration, setDuration] = useState(editing === null ? '' : describeDuration(Math.round(editing.seconds / 60)))
  const [refused, setRefused] = useState<ActivityRefusal | null>(null)
  // Whether the activities are offered, and which is picked out: none until an arrow says.
  const [offering, setOffering] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const suggestions = offering ? suggestActivities(known, activity) : []
  const isSuggesting = suggestions.length > 0
  const active = highlighted < suggestions.length ? highlighted : -1
  const durationId = `${listId}-duration`

  function refuse(refusal: ActivityRefusal) {
    setRefused(refusal)
  }

  function submit() {
    const name = activity.trim()
    if (name === '') return refuse('noActivity')
    if (!isActivityName(name)) return refuse('badActivity')
    if (duration.trim() === '') return refuse('noDuration')

    const minutes = parseDuration(duration)
    if (minutes === null || minutes < 1) return refuse('badDuration')
    if (!isSessionLength(minutes)) return refuse(minutes > MAX_SESSION_MINUTES ? 'tooLong' : 'badDuration')
    if (!hasSlotStarted({ day, hour }, now)) return refuse('notStarted')

    setRefused(null)
    if (editing === null) {
      onAdd(name, minutes * 60, hour)
      // Ready for the next record under the same hour.
      setActivity('')
      setDuration('')
      inputRef.current?.focus()
    } else {
      onSave(editing.id, { activity: name, seconds: minutes * 60, hour })
    }
  }

  function step(by: number) {
    const next = hour + by
    if (next < 0 || next > 23) return
    if (!hasSlotStarted({ day, hour: next }, now)) return refuse('notStarted')
    setRefused(null)
    onHourChange(next)
  }

  function pick(name: string) {
    setActivity(name)
    setOffering(false)
    setHighlighted(-1)
    setRefused(null)
    document.getElementById(durationId)?.focus()
  }

  function handleActivityKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const offered = suggestActivities(known, activity)
      const count = offered.length
      setOffering(true)
      if (count === 0) return
      const current = offering ? active : -1
      if (event.key === 'ArrowDown') setHighlighted(current === -1 ? 0 : (current + 1) % count)
      else setHighlighted(current <= 0 ? count - 1 : current - 1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      // A name picked out is the one meant; otherwise what was typed is.
      if (isSuggesting && active >= 0) pick(suggestions[active])
      else {
        setOffering(false)
        document.getElementById(durationId)?.focus()
      }
      return
    }

    if (event.key === 'Escape') {
      if (isSuggesting) {
        event.preventDefault()
        event.stopPropagation()
        setOffering(false)
        setHighlighted(-1)
      } else if (editing !== null) {
        event.preventDefault()
        onCancel()
      }
    }
  }

  function handleDurationKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    } else if (event.key === 'Escape' && editing !== null) {
      event.preventDefault()
      onCancel()
    }
  }

  const slot = describeSlot({ day, hour })

  return (
    <section aria-label={editing === null ? 'Add to the log' : 'Change a record'} className="flex flex-col gap-2">
      <div className="flex min-h-9 items-center gap-1">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {editing === null ? 'Add to' : 'Change'}
        </span>
        <button
          type="button"
          onClick={() => { step(-1) }}
          aria-label="The hour before"
          title="The hour before"
          className={`${stepper}${hour === 0 ? ' invisible' : ''}`}
        >
          <ChevronIcon className="size-4 rotate-90" />
        </button>
        <span aria-live="polite" className="min-w-[6.5rem] text-center text-sm font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
          {slot}
        </span>
        <button
          type="button"
          onClick={() => { step(1) }}
          aria-label="The hour after"
          title="The hour after"
          className={`${stepper}${hour === 23 ? ' invisible' : ''}`}
        >
          <ChevronIcon className="size-4 -rotate-90" />
        </button>

        {editing !== null && (
          <span className="ml-auto flex items-center gap-1">
            <button type="button" onClick={onCancel} className={quiet}>
              Cancel
            </button>
            <button type="button" onClick={() => { onDelete(editing) }} className={danger}>
              Delete
            </button>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 md:flex-row md:items-start">
        <div className="relative min-w-0 md:flex-1">
          <input
            ref={inputRef}
            type="text"
            name="activity-name"
            role="combobox"
            value={activity}
            onChange={(event) => {
              setActivity(event.target.value)
              setOffering(true)
              setHighlighted(-1)
              setRefused(null)
            }}
            onFocus={() => { setOffering(true) }}
            onBlur={() => { setOffering(false) }}
            onKeyDown={handleActivityKeys}
            placeholder="What did you do?"
            aria-label={`What you did, ${slot}`}
            aria-autocomplete="list"
            aria-expanded={isSuggesting}
            aria-controls={isSuggesting ? listId : undefined}
            aria-activedescendant={isSuggesting && active >= 0 ? `${listId}-${String(active)}` : undefined}
            aria-invalid={refused === 'noActivity' || refused === 'badActivity'}
            autoComplete="off"
            enterKeyHint="next"
            className={`${field}${refused === 'noActivity' || refused === 'badActivity' ? ` ${fieldRefused}` : ''}`}
          />

          {/* A press on an activity keeps the caret where it is, so choosing one does not blur the box first. */}
          {isSuggesting && (
            <ul
              id={listId}
              role="listbox"
              aria-label="Activities used before"
              onMouseDown={(event) => { event.preventDefault() }}
              className="absolute inset-x-0 top-full z-30 mt-1 flex max-h-60 flex-col gap-0.5 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
            >
              {suggestions.map((name, index) => (
                <li
                  key={name}
                  id={`${listId}-${String(index)}`}
                  role="option"
                  aria-selected={index === active}
                  onClick={() => { pick(name) }}
                  onMouseEnter={() => { setHighlighted(index) }}
                  className={`${option} ${index === active ? optionOn : optionOff}`}
                >
                  <span className="min-w-0 truncate">{name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            id={durationId}
            type="text"
            name="activity-duration"
            inputMode="text"
            value={duration}
            onChange={(event) => {
              setDuration(event.target.value)
              setRefused(null)
            }}
            onKeyDown={handleDurationKeys}
            placeholder="Minutes"
            aria-label={`How long, ${slot}`}
            aria-invalid={refused === 'noDuration' || refused === 'badDuration' || refused === 'tooLong'}
            autoComplete="off"
            enterKeyHint="done"
            className={`${field} md:w-28${refused === 'noDuration' || refused === 'badDuration' || refused === 'tooLong' ? ` ${fieldRefused}` : ''}`}
          />
          <button type="button" onClick={submit} className={primary}>
            {editing === null ? 'Add' : 'Save'}
          </button>
        </div>
      </div>

      {refused !== null && (
        <p role="alert" className="px-1 text-xs text-red-600 dark:text-red-400">
          {ACTIVITY_REFUSALS[refused]}
        </p>
      )}
    </section>
  )
}
