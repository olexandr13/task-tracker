import type { LocalDay } from '../../core'
import { dateChoices, STARTS_REPEAT, type SkipChoice } from '../dateChoices'
import { panelHeading, panelIcon, panelIconOff, panelIconOn, panelIconRow } from '../panelControls'
import { DateCalendar } from './DateCalendar'

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
   * rather than a date of its own — which every day's tooltip says, the calendar's
   * included.
   */
  repeats: boolean
  /** Offered on a repeating task with an occurrence to pass over; left out elsewhere. */
  skip?: SkipChoice
  onChange: (day: LocalDay | null) => void
  /** Called once a choice has said everything, so the panel can close. */
  onDone: () => void
}

/**
 * Picking the day: a row of quick choices as icons — the same as a task's menu
 * has (dateChoices), less Select date, which the calendar under them stands in
 * for — and a month calendar for any other day. A choice, quick or from the
 * calendar, is saved and done in one click.
 *
 * The calendar opens on the month of the day the task is due, a repeating task's
 * being the one its rule gives it, and on today's without one. The day marked as
 * chosen is the task's own: its date, or the day its rule starts on.
 *
 * What hangs on the day — the hour, the repeat rule — is the caller's to place:
 * the schedule panel keeps each to a line of its own (SchedulePicker).
 */
export function DueChoices({ dueDate, chosen, now, repeats, skip, onChange, onDone }: DueChoicesProps) {
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
    </>
  )
}
