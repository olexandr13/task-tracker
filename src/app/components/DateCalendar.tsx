import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { offsetDay, toLocalDay, type LocalDay } from '../../core'
import { calendarWeeks, monthOf, offsetMonth, startOfWeek } from '../calendarMonth'
import { describeFullDate, describeMonth } from '../dueLabels'
import { panelStep } from '../panelControls'
import { WEEKDAYS } from '../repeatLabels'
import { ChevronIcon } from './ChevronIcon'

const day =
  'mx-auto grid size-8 place-items-center rounded-full text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500'
const dayChosen = 'bg-blue-600 font-semibold text-white hover:bg-blue-700'
const dayToday = 'font-semibold text-blue-600 hover:bg-blue-600/10 dark:text-blue-400 dark:hover:bg-blue-400/10'
const dayAhead = 'text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800'
/** A day gone by, or one of the months either side: there to pick, but not what the eye is after. */
const dayFaded =
  'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/** Where a key moves the day in reach from `from`, or null for a key that does not move it. */
function moveByKey(event: KeyboardEvent, from: LocalDay): LocalDay | null {
  switch (event.key) {
    case 'ArrowLeft':
      return offsetDay(from, -1)
    case 'ArrowRight':
      return offsetDay(from, 1)
    case 'ArrowUp':
      return offsetDay(from, -7)
    case 'ArrowDown':
      return offsetDay(from, 7)
    case 'Home':
      return startOfWeek(from)
    case 'End':
      return offsetDay(startOfWeek(from), 6)
    case 'PageUp':
      return offsetMonth(from, event.shiftKey ? -12 : -1)
    case 'PageDown':
      return offsetMonth(from, event.shiftKey ? 12 : 1)
    default:
      return null
  }
}

interface DateCalendarProps {
  /** The day chosen, drawn filled; null when there is none to mark. */
  selected: LocalDay | null
  /** The day it opens on: its month is shown and its day is the one the keys start from. Today when left out. */
  opensOn?: LocalDay | null
  now: Date
  onSelect: (day: LocalDay) => void
}

/**
 * A month of days, one of them picked with a click. Weeks run Monday to Sunday,
 * as everywhere else. Today is marked, the chosen day filled, and days gone by
 * and those of the months either side faded — there to pick all the same.
 *
 * It is one stop for Tab, as a grid is: the arrow keys move a day or a week,
 * Home and End to the ends of the week, Page Up and Page Down a month (a year
 * with Shift), the month shown following along, and Enter picks.
 */
export function DateCalendar({ selected, opensOn = selected, now, onSelect }: DateCalendarProps) {
  const today = toLocalDay(now)
  // The day in reach of the keys. The month shown is always the one it falls in.
  const [active, setActive] = useState(opensOn ?? today)
  const grid = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const heading = useId()
  const month = monthOf(active)

  function focusActive() {
    grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }

  // A key moved the day: the focus goes with it once it is drawn, in the next month if it went there.
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    focusActive()
  }, [active])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // From the day with the focus, which a click may have put somewhere other than the one in reach.
    const from = (event.target as HTMLElement).dataset.day ?? active
    const to = moveByKey(event, from)
    if (to === null) return

    // The keys are the grid's alone: they are not scrolling the page or moving a row behind it.
    event.preventDefault()
    event.stopPropagation()
    if (to === active) {
      focusActive()
    } else {
      moved.current = true
      setActive(to)
    }
  }

  const tone = (shown: LocalDay) =>
    shown === selected
      ? dayChosen
      : shown === today
        ? dayToday
        : shown < today || monthOf(shown) !== month
          ? dayFaded
          : dayAhead

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pr-0.5 pb-1 pl-2">
        {/* Said again as the month changes, since the grid's own name does not announce itself. */}
        <p id={heading} aria-live="polite" className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {describeMonth(month)}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            title="Previous month"
            onClick={() => { setActive(offsetMonth(active, -1)) }}
            className={panelStep}
          >
            <ChevronIcon className="size-4 rotate-90" />
          </button>
          <button
            type="button"
            aria-label="Go to today"
            title="Go to today"
            onClick={() => { setActive(today) }}
            className={panelStep}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            title="Next month"
            onClick={() => { setActive(offsetMonth(active, 1)) }}
            className={panelStep}
          >
            <ChevronIcon className="size-4 -rotate-90" />
          </button>
        </div>
      </div>

      <div ref={grid} role="grid" aria-labelledby={heading} onKeyDown={handleKeyDown} className="flex flex-col">
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map(({ initial, name }) => (
            <span
              key={name}
              role="columnheader"
              aria-label={name}
              title={name}
              className="pb-0.5 text-center text-[11px] font-medium text-neutral-400 dark:text-neutral-500"
            >
              {initial}
            </span>
          ))}
        </div>

        {calendarWeeks(month).map((week) => (
          <div key={week[0]} role="row" className="grid grid-cols-7">
            {week.map((shown) => (
              <div key={shown} role="gridcell" aria-selected={shown === selected}>
                <button
                  type="button"
                  data-day={shown}
                  tabIndex={shown === active ? 0 : -1}
                  aria-label={describeFullDate(shown)}
                  aria-current={shown === today ? 'date' : undefined}
                  onClick={() => { onSelect(shown) }}
                  className={`${day} ${tone(shown)}`}
                >
                  {Number(shown.slice(8))}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
