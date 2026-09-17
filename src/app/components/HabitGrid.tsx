import { useRef, useState, type KeyboardEvent } from 'react'
import { habitWeeks, toLocalDay, type LocalDay, type Task } from '../../core'
import { describeHabitDay, monthStartedBy } from '../habitLabels'
import { HABIT_DAY_TONES } from '../habitTones'

/** A year of weeks is drawn; how many of them show depends on the room there is. */
const WEEKS = 52

/**
 * Which weeks show, by how many weeks back they are. A day is at least 12px and
 * a gap 3px, after 24px of weekday names, so N weeks need 15N + 24px: each step
 * joins once its card has that much room, however wide the screen around it,
 * and the days stretch to fill whatever is left over. Written out whole so the
 * stylesheet finds every one of them.
 */
const STEPS: readonly (readonly [weeks: number, column: string])[] = [
  [14, 'contents'],
  [18, 'hidden @min-[294px]:contents'],
  [22, 'hidden @min-[354px]:contents'],
  [26, 'hidden @min-[414px]:contents'],
  [30, 'hidden @min-[474px]:contents'],
  [34, 'hidden @min-[534px]:contents'],
  [39, 'hidden @min-[609px]:contents'],
  [44, 'hidden @min-[684px]:contents'],
  [48, 'hidden @min-[744px]:contents'],
  [WEEKS, 'hidden @min-[804px]:contents'],
]

function weekColumn(weeksBack: number): string {
  return STEPS.find(([weeks]) => weeksBack < weeks)?.[1] ?? 'hidden'
}

/** Rows run Monday to Sunday; every other one is named, as a calendar margin would. */
const WEEKDAY_NAMES = ['Mon', '', 'Wed', '', 'Fri', '', '']

const margin = 'text-[9px] leading-3 text-neutral-400 dark:text-neutral-500'

const dayButton =
  'aspect-square cursor-pointer rounded-[3px] outline-offset-1 transition-shadow hover:ring-2 hover:ring-neutral-500/60 focus-visible:outline-2 focus-visible:outline-blue-500'

/** Arrow keys walk the grid: across a week to the same weekday, or up and down within it. */
const MOVES: Record<string, readonly [weeks: number, days: number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

interface HabitGridProps {
  task: Task
  now: Date
  onSetDay: (day: LocalDay, done: boolean) => void
}

/**
 * A habit's days, a column per week and a row per weekday, most recent week on
 * the right. Each day says what it was when pointed at, and clicking a day up to
 * today marks it done or takes it back.
 *
 * One grid holds the weekday names and every day, filled column by column, so
 * the names stay level with the days however large the room makes them.
 *
 * The days are one stop for Tab, not a year of them: Tab lands on today, or on
 * the day last moved to, and the arrow keys walk from there. A day the card has
 * no room to show cannot take focus, so walking stops at the oldest week on show.
 */
export function HabitGrid({ task, now, onSetDay }: HabitGridProps) {
  const weeks = habitWeeks(task, WEEKS, now)
  const done = weeks.flat().filter((entry) => entry.state === 'done').length
  const today = toLocalDay(now)

  const [current, setCurrent] = useState<LocalDay | null>(null)
  const buttons = useRef(new Map<LocalDay, HTMLButtonElement>())
  const stop = current ?? today

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, column: number, row: number) {
    const move = MOVES[event.key] as (typeof MOVES)[string] | undefined
    if (move === undefined) return
    event.preventDefault()

    const [across, down] = move
    const target = weeks.at(column + across)?.at(row + down)
    if (column + across < 0 || row + down < 0 || target === undefined || target.state === 'future') return

    const button = buttons.current.get(target.day)
    button?.focus()
    // A hidden week refuses focus, and the walk stays where it was.
    if (button !== undefined && document.activeElement === button) setCurrent(target.day)
  }

  return (
    <div className="@container">
      <div
        role="group"
        aria-label={`Last ${String(WEEKS)} weeks: done on ${String(done)} ${done === 1 ? 'day' : 'days'}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setCurrent(null)
        }}
        className="grid grid-flow-col grid-cols-[1.5rem] grid-rows-[auto_repeat(7,auto)] auto-cols-[minmax(0,1fr)] gap-[3px]"
      >
        <span />
        {WEEKDAY_NAMES.map((name, row) => (
          <span key={row} aria-hidden="true" className={`${margin} self-center`}>
            {name}
          </span>
        ))}

        {weeks.map((week, column) => (
          <div key={week[0].day} className={weekColumn(WEEKS - 1 - column)}>
            {/* No width of its own, so a month's name never widens its week. */}
            <span aria-hidden="true" className={`${margin} h-3.5 w-0 overflow-visible whitespace-nowrap`}>
              {monthStartedBy(week[0].day)}
            </span>

            {week.map(({ day, state }, row) =>
              state === 'future' ? (
                <span key={day} className="aspect-square" />
              ) : (
                <button
                  key={day}
                  ref={(button) => {
                    if (button === null) buttons.current.delete(day)
                    else buttons.current.set(day, button)
                  }}
                  type="button"
                  tabIndex={day === stop ? 0 : -1}
                  aria-pressed={state === 'done'}
                  aria-label={describeHabitDay(day, state)}
                  title={describeHabitDay(day, state)}
                  onClick={() => { onSetDay(day, state !== 'done') }}
                  onFocus={() => { setCurrent(day) }}
                  onKeyDown={(event) => { handleKeyDown(event, column, row) }}
                  className={`${dayButton} ${HABIT_DAY_TONES[state]}`}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
