import { useId, type ChangeEvent } from 'react'
import { isLocalTime, type LocalTime } from '../../core'
import { describeTimeOfDay } from '../dueLabels'
import { panelHeading } from '../panelControls'

/** The hours offered at a click, being the ones most days are shaped around. */
const QUICK_TIMES: readonly { readonly time: LocalTime; readonly label: string }[] = [
  { time: '09:00', label: 'Morning' },
  { time: '12:00', label: 'Midday' },
  { time: '18:00', label: 'Evening' },
]

/**
 * A quick hour. Filled rather than bare, so on a phone — where nothing hovers —
 * it still reads as a button and not as a label.
 */
const chip =
  'grid h-10 min-w-0 place-items-center rounded-xl bg-neutral-100 px-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 md:h-7 md:rounded-lg md:text-xs dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-neutral-100'

const chipOn = 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400'

const field =
  'min-w-0 rounded-xl border border-neutral-300 bg-transparent px-3 py-2 text-base text-neutral-900 tabular-nums focus:border-blue-500 focus:outline-none md:rounded-lg md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100'

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
   * Called once a choice leaves nothing further to choose here, so a panel
   * showing the hours on their own can hand the panel back. Left out where the
   * hours sit under the day already, there being nowhere to go (DUE-20).
   */
  onDone?: () => void
}

/**
 * The time half of the schedule panel: three quick hours, a clock field for any
 * other, and a way to take the hour back off. Setting one is what asks the app
 * to say something when it comes round (REM-1).
 *
 * Nothing here closes the panel: where the hours sit under the day (DUE-20) an
 * hour is picked in the same breath as the day, and closing out from under that
 * would mean opening the panel again to finish the thought. Where they are a
 * view of their own, picking one hands that view back (onDone) — the day is
 * what was left behind, not the panel.
 */
export function DueTimeChoices({ dueTime, now, hasDay, named = true, onChange, onDone }: DueTimeChoicesProps) {
  const ids = useId()
  const heading = `${ids}-time`

  function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
    // The field reads empty both when it is cleared and while it is half-typed —
    // an hour entered with the minutes still to come — and neither is an hour, so
    // both leave the task without one until the pair is complete. The browser
    // keeps what has been typed meanwhile, so entering an hour is uninterrupted.
    const typed = event.target.value
    if (typed === '') {
      onChange(null)
      return
    }
    // Browsers hand back `HH:MM` or `HH:MM:SS`; seconds are past what an hour means here.
    const time = typed.slice(0, 5)
    if (isLocalTime(time)) onChange(time)
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
                onClick={() => {
                  onChange(time)
                  onDone?.()
                }}
                aria-label={`${label}, ${describeTimeOfDay(time, now)}`}
                aria-pressed={time === dueTime}
                className={time === dueTime ? `${chip} ${chipOn}` : chip}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 md:gap-1">
            <input
              type="time"
              value={dueTime ?? ''}
              onChange={handleFieldChange}
              aria-label="Time of day"
              title="The time of day the task is due. Empty for no time."
              className={`${field} w-full flex-1`}
            />
            {dueTime !== null && (
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  onDone?.()
                }}
                className={chip}
              >
                Remove time
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
