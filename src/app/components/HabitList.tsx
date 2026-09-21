import { useId, useState, type ReactNode } from 'react'
import {
  currentEntries,
  habitRate,
  habitStats,
  hasTimeGoal,
  isComplete,
  isTimeGoalReached,
  type HabitDayState,
  type HabitRate,
  type LocalDay,
  type Task,
  type TaskId,
  type TimeEntryId,
} from '../../core'
import { describeDays, describeRate, HABIT_DAY_LABELS } from '../habitLabels'
import { completionBoxOff, completionBoxOn, completionBoxReady } from '../rowControls'
import { HABIT_DAY_TONES } from '../habitTones'
import { ChevronIcon } from './ChevronIcon'
import { FlameIcon } from './FlameIcon'
import { HabitGrid } from './HabitGrid'
import { TimePicker } from './TimePicker'

interface HabitListProps {
  /** Already chosen and ordered by `habitTasks`. */
  habits: Task[]
  /** The moment the record is read for: which day is today, and whether it is done. */
  now: Date
  /** Whether each card starts open; changing it resets the cards to that default. */
  showDetails: boolean
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  /** Marks a day up to today done, or not done: what clicking a day in the grid asks for. */
  onSetDay: (id: TaskId, day: LocalDay, done: boolean) => void
  onChangeTimeGoal: (id: TaskId, minutes: number | null) => void
  onLogTime: (id: TaskId, minutes: number) => void
  onRemoveTimeEntry: (id: TaskId, entryId: TimeEntryId) => void
}

const LEGEND: readonly HabitDayState[] = ['done', 'missed', 'untracked']

/** How far back each rate looks, in days, today included, and what it is called. */
const RATE_WINDOWS: readonly (readonly [days: number, label: string])[] = [
  [7, 'Last 7 days'],
  [30, 'Last 30 days'],
  [365, 'Last year'],
]

/**
 * Every habit's record, one card each: whether today is done, how the streak
 * stands, and the days behind it. The habits are the tasks themselves, so
 * ticking one off here is ticking it off in the list, and the other way round.
 */
export function HabitList({
  habits,
  now,
  showDetails,
  onComplete,
  onUncomplete,
  onSetDay,
  onChangeTimeGoal,
  onLogTime,
  onRemoveTimeEntry,
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        No habits yet. Give a task a daily repeat and it is tracked here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Tasks that repeat every day.{' '}
        </p>

        <ul aria-label="Legend" className="flex items-center gap-3 self-end">
          {LEGEND.map((state) => (
            <li key={state} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span className={`size-3 rounded-[3px] ring-1 ring-neutral-900/5 ring-inset dark:ring-white/5 ${HABIT_DAY_TONES[state]}`} />
              {HABIT_DAY_LABELS[state]}
            </li>
          ))}
        </ul>
      </div>

      <ul className="flex flex-col gap-3">
        {habits.map((habit) => (
          <HabitCard
            key={`${habit.id}:${showDetails ? 'open' : 'folded'}`}
            habit={habit}
            now={now}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onSetDay={onSetDay}
            onChangeTimeGoal={onChangeTimeGoal}
            onLogTime={onLogTime}
            onRemoveTimeEntry={onRemoveTimeEntry}
            showDetails={showDetails}
          />
        ))}
      </ul>
    </div>
  )
}

/**
 * One habit. A list of year-long grids is a long way to scroll for a box to
 * tick, so a card starts folded to the box, the title and the streak, and a tap
 * on its line unfolds the numbers and the days. Each card folds on its own, so
 * opening one never moves the one being reached for.
 *
 * The toggle and its hit area are always available; the hit area is stretched
 * over the card's line so ticking the box or changing the time goal does not
 * unfold the card.
 *
 * A habit that asks for an amount of time has its clock on the card's line, so
 * the time is logged where the habit is ticked off.
 */
function HabitCard({
  habit,
  now,
  showDetails,
  onComplete,
  onUncomplete,
  onSetDay,
  onChangeTimeGoal,
  onLogTime,
  onRemoveTimeEntry,
}: { habit: Task } & Omit<HabitListProps, 'habits'>) {
  const done = isComplete(habit, now)
  const timed = hasTimeGoal(habit)
  const ready = !done && isTimeGoalReached(habit, now)
  const { currentStreak, bestStreak } = habitStats(habit, now)
  const [isOpen, setIsOpen] = useState(() => showDetails)
  const recordId = useId()

  return (
    <li className="flex flex-col rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative flex items-center gap-2.5 px-4 py-3.5">
        {/* Above the toggle's hit area, so ticking off never unfolds the card. */}
        <button
          type="button"
          onClick={() => { if (done) onUncomplete(habit.id); else onComplete(habit.id) }}
          aria-pressed={done}
          aria-label={
            done
              ? `Mark "${habit.title}" as not done today`
              : ready
                ? `Mark "${habit.title}" as done today: its time goal is reached`
                : `Mark "${habit.title}" as done today`
          }
          title={ready ? 'Time goal reached: ready to tick off' : undefined}
          className={`relative z-10 ${done ? completionBoxOn : ready ? completionBoxReady : completionBoxOff}`}
        >
          ✓
        </button>

        <h2 className="min-w-0 truncate text-sm font-medium">{habit.title}</h2>

        {!isOpen && (
          <span
            className={`${timed ? '' : 'ml-auto'} flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums`}
          >
            <Flame streak={currentStreak} />
            <span className="sr-only">Current streak: </span>
            {String(currentStreak)}
          </span>
        )}

        <div className="relative z-20 ml-auto flex shrink-0 items-center gap-2.5">
          {timed && (
            <div className="shrink-0">
              <TimePicker
                goal={habit.timeGoal}
                sessions={currentEntries(habit.timeLog, habit.repeat, now)}
                now={now}
                onLog={(minutes) => { onLogTime(habit.id, minutes) }}
                onRemove={(entryId) => { onRemoveTimeEntry(habit.id, entryId) }}
                onChangeGoal={(minutes) => { onChangeTimeGoal(habit.id, minutes) }}
                label={`Time for "${habit.title}"`}
                showAmount
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => { setIsOpen(!isOpen) }}
            aria-expanded={isOpen}
            aria-controls={recordId}
            aria-label={`Record of "${habit.title}"`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-neutral-400 outline-offset-2 after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-neutral-500"
          >
            <ChevronIcon className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div
        id={recordId}
        className={`${isOpen ? 'flex' : 'hidden'} @container flex-col gap-4 px-4 pt-0.5 pb-3.5`}
      >
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 @xs:grid-cols-3 @lg:grid-cols-5">
          <Stat label="Current streak">
            <span className="flex items-center gap-1">
              <Flame streak={currentStreak} />
              {describeDays(currentStreak)}
            </span>
          </Stat>
          <Stat label="Best streak">{describeDays(bestStreak)}</Stat>
          {RATE_WINDOWS.map(([days, label]) => (
            <Stat key={days} label={label}>
              <Rate rate={habitRate(habit, days, now)} />
            </Stat>
          ))}
        </dl>

        <HabitGrid task={habit} now={now} onSetDay={(day, dayDone) => { onSetDay(habit.id, day, dayDone) }} />
      </div>
    </li>
  )
}

/** Lit while there is a streak (HAB-5). */
function Flame({ streak }: { streak: number }) {
  return (
    <FlameIcon
      className={streak > 0 ? 'size-4 shrink-0 text-orange-500' : 'size-4 shrink-0 text-neutral-300 dark:text-neutral-600'}
    />
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="text-base font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{children}</dd>
    </div>
  )
}

/** "84%", with the days behind it beside it in a quieter voice: "25/30". */
function Rate({ rate }: { rate: HabitRate }) {
  return (
    <>
      {describeRate(rate)}
      {rate.days > 0 && (
        <span className="ml-1.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
          {String(rate.done)}/{String(rate.days)}
        </span>
      )}
    </>
  )
}
