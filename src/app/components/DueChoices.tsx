import { useState } from 'react'
import { isPickable, type LocalDay, type PickableDays, type Repeat } from '../../core'
import { dateChoices, dayHint, refusedDayNote, type SkipChoice } from '../dateChoices'
import { panelHeading, panelIcon, panelIconOff, panelIconOn, panelIconQuiet } from '../panelControls'
import { useRefusal } from '../useRefusal'
import { DateCalendar } from './DateCalendar'
import { InfoIcon } from './InfoIcon'
import { PanelIconRow } from './PanelIconRow'

/** What the i offers: its name, and its tooltip, which is all a pointer needs of it. */
const EXPLAIN_ICONS = 'What each icon means'

/**
 * The row spelled out under itself, a line an icon (DUE-25): starting where the
 * heading starts, in the muted small type a panel's notes are in.
 */
const legend = 'flex flex-col gap-1 px-3 pt-1.5 pb-1 md:gap-0.5 md:px-2 md:pt-1 md:pb-0.5'
const legendLine = 'flex items-center gap-2 text-sm text-neutral-500 md:gap-1.5 md:text-xs dark:text-neutral-400'
/** The same glyph as the button draws, at the same size, so the eye pairs the two at once. */
const legendGlyph = 'grid shrink-0 place-items-center text-neutral-400 dark:text-neutral-500'
/** A line of the panel's own, in the muted small type its notes are in. */
const note = 'px-3 pt-1 pb-1.5 text-sm text-neutral-500 md:px-2 md:pb-1 md:text-xs dark:text-neutral-400'
/** A day the calendar turned down (DUE-27): amber, as a refused tick is, since nothing has gone wrong. */
const refusal = 'px-2 pt-1 text-xs text-amber-700 dark:text-amber-400'

interface DueChoicesProps {
  /**
   * The day the task is due: its own, or the one its rule gives it (`dueDay`).
   * It is the day marked as chosen, and the calendar opens on its month.
   */
  dueDate: LocalDay | null
  /** A one-off's own date, which Remove date takes away. Null where there is none to take. */
  scheduled: LocalDay | null
  now: Date
  /**
   * The task's rule, or null for a one-off: what a day picked here does to it,
   * which every day's tooltip says, the calendar's included.
   */
  rule: Repeat | null
  /** The days that can be picked (`pickableDays`), or null where none can (DUE-27). */
  pickable: PickableDays | null
  /** Said in place of the calendar where no day can be picked (`noDayNote`). */
  noDay?: string
  /** Offered on a repeating task with an occurrence to pass over; left out elsewhere. */
  skip?: SkipChoice
  /** Taking a habit's rest today back (HAB-31), offered while today is one. */
  unskip?: () => void
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
 * Only a day that can be picked is offered as a quick choice (DUE-27). The
 * calendar shows every day, fading those that cannot be picked, and answers a
 * click on one in place — a line under it and a shake — rather than doing
 * nothing. Where no day can be picked at all there is no calendar, and a line
 * says why instead.
 *
 * The day marked as chosen, among the quick choices and in the calendar, is the
 * day the task is due — a repeating task's being the one its rule gives it, so
 * the mark moves on with a skip (RPT-34) — and the calendar opens on its month,
 * or on today's without one.
 *
 * What hangs on the day — the hour, the repeat rule — is the caller's to place:
 * the schedule panel keeps each to a line of its own (SchedulePicker).
 *
 * An icon says nothing by itself the first time it is met, and a tooltip never
 * reaches a thumb, so the row ends with an **i** that spells every icon out
 * under the row — each beside the words its tooltip would say — for as long as
 * it is left on (DUE-25). It is a note, not a choice: it changes nothing about
 * the task and leaves the panel open, and the panel opens with it off.
 */
export function DueChoices({
  dueDate,
  scheduled,
  now,
  rule,
  pickable,
  noDay,
  skip,
  unskip,
  onChange,
  onDone,
}: DueChoicesProps) {
  const [explained, setExplained] = useState(false)
  // A day the calendar turned down, said under it with a shake (DUE-27).
  const [refusedDay, setRefusedDay] = useState<LocalDay | null>(null)
  const { refused, refuse } = useRefusal()

  function choose(day: LocalDay | null) {
    onChange(day)
    onDone()
  }

  // A day that cannot be picked is answered where it was clicked, and nothing is saved.
  function pick(day: LocalDay) {
    if (isPickable(pickable, day)) {
      choose(day)
    } else {
      setRefusedDay(day)
      refuse()
    }
  }

  const icons = dateChoices({
    due: dueDate,
    scheduled,
    now,
    rule,
    pickable,
    unskip:
      unskip === undefined
        ? undefined
        : () => {
            unskip()
            onDone()
          },
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
        {icons.length > 0 && (
          <PanelIconRow>
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
            {/* Last, past the choices, since it changes nothing about the task; quieter, since it is not one of them. */}
            <button
              type="button"
              onClick={() => { setExplained(!explained) }}
              aria-pressed={explained}
              aria-label={EXPLAIN_ICONS}
              title={EXPLAIN_ICONS}
              className={explained ? `${panelIcon} ${panelIconOn}` : `${panelIcon} ${panelIconQuiet}`}
            >
              <InfoIcon />
            </button>
          </PanelIconRow>
        )}

        {/* For the eye alone: each button says the same words to a screen reader already. */}
        {explained && icons.length > 0 && (
          <ul aria-hidden="true" className={legend}>
            {icons.map((choice) => (
              <li key={choice.label} className={legendLine}>
                <span className={legendGlyph}>{choice.icon}</span>
                {choice.hint ?? choice.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* No calendar where no day can be picked: a line says why instead (DUE-27). */}
      {pickable === null ? (
        noDay !== undefined && <p className={note}>{noDay}</p>
      ) : (
        <div
          className={`border-t border-neutral-200 px-0.5 pt-1.5 pb-1 dark:border-neutral-800${refused ? ' refusal-shake' : ''}`}
        >
          <DateCalendar
            selected={dueDate}
            now={now}
            hint={dayHint(rule)}
            canPick={(day) => isPickable(pickable, day)}
            onSelect={pick}
          />
          {refused && refusedDay !== null && (
            <p role="alert" className={refusal}>
              {refusedDayNote(pickable, refusedDay, now, skip !== undefined)}
            </p>
          )}
        </div>
      )}
    </>
  )
}
