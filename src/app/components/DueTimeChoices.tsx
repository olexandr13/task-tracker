import { useId, useState } from 'react'
import type { LocalTime } from '../../core'
import { describeTimeOfDay } from '../dueLabels'
import { panelChip as chip, panelHeading } from '../panelControls'
import { useRefusal } from '../useRefusal'
import { ClockDial } from './ClockDial'

/** The hours offered at a click, being the ones most days are shaped around. */
const QUICK_TIMES: readonly { readonly time: LocalTime; readonly label: string }[] = [
  { time: '09:00', label: 'Morning' },
  { time: '12:00', label: 'Midday' },
  { time: '18:00', label: 'Evening' },
]

const chipOn = 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400'

/** Set: the one button here that saves, so filled with the app's blue, a chip's size. */
const setButton =
  'grid h-10 min-w-0 place-items-center rounded-xl bg-blue-600 px-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 md:h-7 md:rounded-lg md:text-xs dark:bg-blue-500 dark:hover:bg-blue-400'

/** Set with nothing on the face (refused in place): amber, as a refused day is, since nothing has gone wrong. */
const refusal = 'px-2 text-xs text-amber-700 dark:text-amber-400'

interface DueTimeChoicesProps {
  /** The hour the task is due at, or null for one due on the day with no hour to it. */
  dueTime: LocalTime | null
  now: Date
  /**
   * Whether the task has a day for an hour to fall on — a date, or a repeat rule.
   * Without one there is nothing to set an hour against, so the row says what to
   * do about it rather than offering hours that would go nowhere.
   */
  hasDay: boolean
  /**
   * Whether the group names itself above its hours. Off where what opened it
   * already carries the name, as the schedule panel's Time row does.
   */
  named?: boolean
  onChange: (time: LocalTime | null) => void
  /**
   * Called once a choice leaves nothing further to choose here — a quick hour,
   * Set or Clear — so a panel showing the hours on their own can hand the panel
   * back. Left out where the hours sit under the day already, there being
   * nowhere to go (DUE-20).
   */
  onDone?: () => void
}

/**
 * The time half of the schedule panel: three quick hours, a clock face for any
 * other (DUE-24), and **Clear** and **Set** under it. Setting one is what asks
 * the app to say something when it comes round (REM-1).
 *
 * A quick hour is saved at a click, there being nothing more to say. The face
 * and its readout are worked at leisure instead — the hand dragged round, the
 * hour typed — and only Set saves what they show, so the row does not move
 * about under the panel at every minute the hand passes (DUE-10). Leaving
 * without Set leaves the hour as it was. Clear takes the hour off.
 *
 * Nothing here closes the panel of its own accord: where the hours sit under the
 * day (DUE-20) an hour is picked in the same breath as the day, and closing out
 * from under that would mean opening the panel again to finish the thought.
 * Where they are a view of their own, a quick hour, Set and Clear hand that view
 * back (onDone). The day is what was left behind, not the panel.
 */
export function DueTimeChoices({ dueTime, now, hasDay, named = true, onChange, onDone }: DueTimeChoicesProps) {
  const ids = useId()
  const heading = `${ids}-time`
  // What the face shows, kept until Set. It starts from the hour saved, and starts
  // again from it whenever that changes from outside — another device, say.
  const [draft, setDraft] = useState(dueTime)
  const [saved, setSaved] = useState(dueTime)
  if (saved !== dueTime) {
    setSaved(dueTime)
    setDraft(dueTime)
  }
  const { refused, refuse } = useRefusal()

  function save(time: LocalTime | null) {
    setDraft(time)
    if (time !== dueTime) onChange(time)
    onDone?.()
  }

  /** Set with the face still empty has nothing to save: it says so, where it was pressed. */
  function handleSet() {
    if (draft === null) refuse()
    else save(draft)
  }

  return (
    <div role="group" aria-labelledby={heading} className="flex flex-col gap-1 pt-0.5">
      {/* The group's name is its label already; this is the same word for the eye. Hidden
          where the row or the link that opened the group is already showing it. */}
      <p id={heading} className={named ? `${panelHeading} pb-0.5` : 'sr-only'}>
        Time
      </p>

      {!hasDay ? (
        <p className="px-3 pb-1 text-xs text-neutral-500 md:px-2 dark:text-neutral-400">
          Pick a day above, and you can set a time on it.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 px-1 pb-1 md:gap-1">
          <div className="grid grid-cols-3 gap-1.5 md:gap-1">
            {QUICK_TIMES.map(({ time, label }) => (
              <button
                key={time}
                type="button"
                onClick={() => { save(time) }}
                aria-label={`${label}, ${describeTimeOfDay(time)}`}
                aria-pressed={time === dueTime}
                className={time === dueTime ? `${chip} ${chipOn}` : chip}
              >
                {label}
              </button>
            ))}
          </div>

          <ClockDial value={draft} now={now} onChange={setDraft} onSubmit={handleSet} />

          <div className={`grid grid-cols-2 gap-1.5 md:gap-1${refused ? ' refusal-shake' : ''}`}>
            <button type="button" onClick={() => { save(null) }} title="Take the time off the task" className={chip}>
              Clear
            </button>
            <button type="button" onClick={handleSet} title="Save the time on the face" className={setButton}>
              Set
            </button>
          </div>
          {refused && draft === null && (
            <p role="alert" className={refusal}>
              Pick an hour on the face, or type one, then Set.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
