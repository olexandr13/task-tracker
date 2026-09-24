import type { LocalDay, LocalTime } from '../../core'
import { dateChoices, STARTS_REPEAT, type SkipChoice } from '../dateChoices'
import { panelHeading, panelIcon, panelIconOff, panelIconOn, panelIconRow } from '../panelControls'
import { DateCalendar } from './DateCalendar'
import { DueTimeChoices } from './DueTimeChoices'

interface DueChoicesProps {
  /** The day the task is due: its own, or the one its rule gives it. The calendar opens there. */
  dueDate: LocalDay | null
  /**
   * The day the task carries itself — a one-off's date, or the day a repeating
   * task's rule starts on (`scheduledDay`). It is the day marked as chosen.
   */
  chosen: LocalDay | null
  now: Date
  /**
   * Whether the task repeats, so a day picked here is the day its rule starts on
   * rather than a date of its own — which a note above the choices says, with
   * every day's tooltip, the calendar's included.
   */
  repeats: boolean
  /** Offered on a repeating task with an occurrence to pass over; left out elsewhere. */
  skip?: SkipChoice
  onChange: (day: LocalDay | null) => void
  /** The hour the task is due at, where it is due at one. */
  dueTime: LocalTime | null
  /** The hour picked, or taken away. Unlike a day, it leaves the panel open (DUE-20). */
  onChangeTime: (time: LocalTime | null) => void
  /** Called once a choice has said everything, so the panel can close. */
  onDone: () => void
}

/**
 * The date half of the schedule panel: a row of quick choices as icons — the same
 * as a task's menu has (dateChoices), less Select date, which the calendar under
 * them stands in for — and a month calendar for any other day. A choice, quick
 * or from the calendar, is saved and done in one click.
 *
 * The calendar opens on the month of the day the task is due, a repeating task's
 * being the one its rule gives it, and on today's without one. The day marked as
 * chosen is the task's own: its date, or the day its rule starts on.
 *
 * Under it is the hour the task is due at, which hangs on that day — so it is
 * offered once there is a day to hang it on, and unlike a day it does not close
 * the panel, an hour usually being picked in the same breath as the day.
 */
export function DueChoices({ dueDate, chosen, now, repeats, skip, onChange, dueTime, onChangeTime, onDone }: DueChoicesProps) {
  function choose(day: LocalDay | null) {
    onChange(day)
    onDone()
  }

  const icons = dateChoices({
    chosen,
    now,
    repeats,
    skip:
      skip === undefined
        ? undefined
        : {
            to: skip.to,
            onSkip: () => {
              skip.onSkip()
              onDone()
            },
          },
    onChange: choose,
  })

  return (
    <>
      {/* Said before the choices, since any of them is a day the repeat starts on. */}
      {repeats && (
        <p className="border-b border-neutral-200 px-2 pt-1 pb-1.5 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          Picking a day starts the repeat on it. The repeat itself stays as it is.
        </p>
      )}

      <div role="group" aria-label="Date" className="flex flex-col">
        {/* The group's name is its label already; this is the same word for the eye. */}
        <p aria-hidden="true" className={`${panelHeading} pb-0.5`}>
          Date
        </p>
        <div className={panelIconRow}>
          {icons.map((choice) => (
            <button
              key={choice.label}
              type="button"
              aria-label={choice.label}
              aria-pressed={choice.checked}
              title={choice.hint ?? choice.label}
              onClick={choice.onSelect}
              className={choice.checked === true ? `${panelIcon} ${panelIconOn}` : `${panelIcon} ${panelIconOff}`}
            >
              {choice.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-200 px-0.5 pt-1.5 pb-1 dark:border-neutral-800">
        <DateCalendar
          selected={chosen}
          opensOn={dueDate}
          now={now}
          hint={repeats ? STARTS_REPEAT : undefined}
          onSelect={choose}
        />
      </div>

      {/* Under the day, which is what an hour hangs on: a repeating task's days
          come from its rule, so it has one to offer hours against from the start. */}
      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <DueTimeChoices dueTime={dueTime} now={now} hasDay={repeats || dueDate !== null} onChange={onChangeTime} />
      </div>
    </>
  )
}
