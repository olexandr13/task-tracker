import { useState } from 'react'
import { isLeastTasks, MAX_LEAST_TASKS, MIN_LEAST_TASKS, type CaseSettings } from '../../core'
import { describeJackpotToday, JACKPOT_HINT, JACKPOT_LABEL, LEAST_TASKS_HINT, LEAST_TASKS_LABEL } from '../caseLabels'
import { describePoints } from '../rewardLabels'

const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const step =
  'grid size-11 shrink-0 place-items-center rounded-lg text-lg leading-none text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40 md:size-8 md:text-base dark:text-neutral-300 dark:hover:bg-neutral-800'
const box =
  'w-16 min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2 py-2 text-center text-base tabular-nums text-neutral-900 focus:border-blue-500 focus:outline-none md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100'
/**
 * What Cases asks of a day (CHST-3), and what the cases pay (CHST-10) —
 * the one a setting, the other a fact: everything earned today, said here with
 * what it comes to so far, which Today’s case takes half of.
 *
 * It sits on Rules, with the period bonuses and what a point is worth, because
 * everything here is one amount for the whole account and all of it is about
 * what earns points (RWD-39). What the *cases* then does with them is on its own
 * page.
 *
 * Nothing is confirmed: every step and every number typed is saved as it is
 * made, as in the other pickers (RPT-22), and only days from here on are
 * measured against it — a case already opened keeps what it gave.
 */
export function CasesSettingsCard({
  settings,
  jackpot,
  onChange,
}: {
  settings: CaseSettings
  /** Everything earned today, so far. Today’s case pays up to half of it. */
  jackpot: number
  onChange: (settings: CaseSettings) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-neutral-900 dark:text-neutral-100">{LEAST_TASKS_LABEL}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{LEAST_TASKS_HINT}</span>
        </div>
        <LeastTasks
          tasks={settings.leastTasks}
          onChange={(leastTasks) => {
            onChange({ ...settings, leastTasks })
          }}
        />
      </div>

      <div className={`${card} flex flex-col gap-0.5 px-4 py-3`}>
        <span className="text-sm text-neutral-900 dark:text-neutral-100">{JACKPOT_LABEL}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{JACKPOT_HINT}</span>
        <span className="text-xs font-medium text-amber-700 tabular-nums dark:text-amber-300">
          {describeJackpotToday(describePoints(jackpot))}
        </span>
      </div>
    </div>
  )
}

/**
 * How many tasks a day must ask for. A stepper rather than a plain box: the
 * number is small and nudged far more often than it is typed, and the app draws
 * its own rather than borrowing the browser's.
 *
 * Saved as it is stepped and as it is typed. A number that is not one it could
 * be is not saved, and the box goes back to what is saved on leaving it, as the
 * other pickers do (RWD-6).
 */
function LeastTasks({ tasks, onChange }: { tasks: number; onChange: (tasks: number) => void }) {
  const [typed, setTyped] = useState(String(tasks))

  const [seen, setSeen] = useState(tasks)
  if (seen !== tasks && Number(typed) !== tasks) {
    setSeen(tasks)
    setTyped(String(tasks))
  }

  function nudge(by: number) {
    const next = tasks + by
    if (!isLeastTasks(next)) return
    setTyped(String(next))
    setSeen(next)
    onChange(next)
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => { nudge(-1) }}
        disabled={tasks <= MIN_LEAST_TASKS}
        aria-label="One task fewer"
        className={step}
      >
        −
      </button>
      <input
        type="number"
        name="case-least-tasks"
        inputMode="numeric"
        min={MIN_LEAST_TASKS}
        max={MAX_LEAST_TASKS}
        value={typed}
        onChange={(event) => {
          setTyped(event.target.value)
          const next = Number(event.target.value)
          if (event.target.value.trim() !== '' && isLeastTasks(next)) {
            setSeen(next)
            onChange(next)
          }
        }}
        onBlur={() => {
          if (!isLeastTasks(Number(typed))) setTyped(String(tasks))
        }}
        aria-label={LEAST_TASKS_LABEL}
        className={box}
      />
      <button
        type="button"
        onClick={() => { nudge(1) }}
        disabled={tasks >= MAX_LEAST_TASKS}
        aria-label="One task more"
        className={step}
      >
        +
      </button>
    </div>
  )
}
