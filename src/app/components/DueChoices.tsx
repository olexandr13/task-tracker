import type { LocalDay } from '../../core'
import { dateChoices, type SkipChoice } from '../dateChoices'
import { panelHeading, panelIcon, panelIconOff, panelIconOn, panelIconRow } from '../panelControls'
import { DateCalendar } from './DateCalendar'

interface DueChoicesProps {
  dueDate: LocalDay | null
  now: Date
  /**
   * Whether the task repeats, so `dueDate` is the day its rule gives it rather
   * than one of its own: nothing is marked as chosen, there is no Remove date,
   * and a note says that a day picked here ends the repeat.
   */
  repeats: boolean
  /** Offered on a repeating task with an occurrence to pass over; left out elsewhere. */
  skip?: SkipChoice
  onChange: (dueDate: LocalDay | null) => void
  /** Called once a choice has said everything, so the panel can close. */
  onDone: () => void
}

/**
 * The date half of the schedule panel: a row of quick choices as icons — the same
 * as a task's menu has (dateChoices), less Select date, which the calendar under
 * them stands in for — and a month calendar for any other day. A choice, quick
 * or from the calendar, is saved and done in one click.
 *
 * The calendar opens on the month of the task's day, a repeating task's being the
 * rule's, and on today's without one. Only a one-off's own day is marked chosen.
 */
export function DueChoices({ dueDate, now, repeats, skip, onChange, onDone }: DueChoicesProps) {
  function choose(day: LocalDay | null) {
    onChange(day)
    onDone()
  }

  const icons = dateChoices({
    dueDate,
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
      {/* Said before the choices, since any of them ends the rule. */}
      {repeats && (
        <p className="border-b border-neutral-200 px-2 pt-1 pb-1.5 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          Picking a day ends the repeat.
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
        <DateCalendar selected={repeats ? null : dueDate} opensOn={dueDate} now={now} onSelect={choose} />
      </div>
    </>
  )
}
