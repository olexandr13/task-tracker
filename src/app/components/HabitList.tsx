import type { ReactNode } from 'react'
import {
  habitRate,
  habitStats,
  isComplete,
  type HabitDayState,
  type HabitRate,
  type LocalDay,
  type Task,
  type TaskId,
} from '../../core'
import { describeDays, describeRate, HABIT_DAY_LABELS } from '../habitLabels'
import { completionBoxOff, completionBoxOn } from '../rowControls'
import { HABIT_DAY_TONES } from '../habitTones'
import { FlameIcon } from './FlameIcon'
import { HabitGrid } from './HabitGrid'

interface HabitListProps {
  /** Already chosen and ordered by `habitTasks`. */
  habits: Task[]
  /** The moment the record is read for: which day is today, and whether it is done. */
  now: Date
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  /** Marks a day up to today done, or not done: what clicking a day in the grid asks for. */
  onSetDay: (id: TaskId, day: LocalDay, done: boolean) => void
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
export function HabitList({ habits, now, onComplete, onUncomplete, onSetDay }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        No habits yet. Give a task a daily repeat and it is tracked here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Tasks that repeat every day. Click a day to mark it done, or to take it back.
        </p>

        <ul aria-label="Legend" className="flex items-center gap-3">
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
            key={habit.id}
            habit={habit}
            now={now}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onSetDay={onSetDay}
          />
        ))}
      </ul>
    </div>
  )
}

function HabitCard({ habit, now, onComplete, onUncomplete, onSetDay }: { habit: Task } & Omit<HabitListProps, 'habits'>) {
  const done = isComplete(habit, now)
  const { currentStreak, bestStreak } = habitStats(habit, now)

  return (
    <li className="@container flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => { if (done) onUncomplete(habit.id); else onComplete(habit.id) }}
          aria-pressed={done}
          aria-label={done ? `Mark "${habit.title}" as not done today` : `Mark "${habit.title}" as done today`}
          className={done ? completionBoxOn : completionBoxOff}
        >
          ✓
        </button>

        <h2 className="min-w-0 truncate text-sm font-medium">{habit.title}</h2>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 @xs:grid-cols-3 @lg:grid-cols-5">
        <Stat label="Current streak">
          <span className="flex items-center gap-1">
            <FlameIcon
              className={
                currentStreak > 0
                  ? 'size-4 shrink-0 text-orange-500'
                  : 'size-4 shrink-0 text-neutral-300 dark:text-neutral-600'
              }
            />
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
    </li>
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
