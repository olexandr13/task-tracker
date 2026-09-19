import { useEffect, useRef, useState } from 'react'
import { isLocalDay, type LocalDay } from '../../core'
import { dateChoices, type SkipChoice } from '../dateChoices'
import { panelHeading, panelIcon, panelIconOff, panelIconOn, panelIconRow } from '../panelControls'

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
  /**
   * Whether the date field is on show and opens its calendar straight away: the
   * panel was asked for to pick a date, so a click to open the calendar would be
   * one too many.
   */
  openCalendar?: boolean
}

/**
 * The date half of the schedule panel: a row of quick choices as icons — the same
 * as a task's menu has (dateChoices) — and a date field for any other day. Each
 * choice is saved as it is made. A quick choice is done; the date field is not,
 * since a date is typed a part at a time and closing on the first part would take
 * the rest away.
 *
 * The field shows a one-off's own day. With none to show — no day yet, or a
 * repeating task's, which is the rule's — it is left out until Select date brings
 * it up, empty, with its calendar open.
 */
export function DueChoices({ dueDate, now, repeats, skip, onChange, onDone, openCalendar = false }: DueChoicesProps) {
  const field = useRef<HTMLInputElement>(null)
  const [picking, setPicking] = useState(openCalendar)
  const ownDay = repeats ? null : dueDate

  // The field is only there to open once it is drawn, after the click that asked for it.
  useEffect(() => {
    if (picking) openPicker()
  }, [picking])

  function openPicker() {
    field.current?.focus()
    try {
      field.current?.showPicker()
    } catch {
      // Not every browser has a calendar to open this way, or lets it open
      // unasked; the field is still there to click.
    }
  }

  function selectDate() {
    if (field.current === null) setPicking(true)
    else openPicker()
  }

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
    onSelectDate: selectDate,
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

      {(ownDay !== null || picking) && (
        <label className="flex items-center gap-2 border-t border-neutral-200 px-2 pt-1.5 pb-1 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          On
          <input
            ref={field}
            type="date"
            value={ownDay ?? ''}
            onChange={(event) => {
              const { value } = event.target
              // Cleared with the field's own control is taking the day away;
              // anything half-typed is not a day yet and waits.
              if (value === '') onChange(null)
              else if (isLocalDay(value)) onChange(value)
            }}
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 dark:[color-scheme:dark]"
          />
        </label>
      )}
    </>
  )
}
