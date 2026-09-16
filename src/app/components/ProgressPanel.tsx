import { summarize, type Period, type Progress, type Task } from '../../core'

interface ProgressPanelProps {
  tasks: Task[]
  /** The moment the bars are drawn for; which period a task falls in depends on it. */
  now: Date
}

const PERIODS: readonly { readonly period: Period; readonly label: string }[] = [
  { period: 'today', label: 'Today' },
  { period: 'week', label: 'Week' },
  { period: 'month', label: 'Month' },
]

/** How today, this week and this month are going, one bar each. */
export function ProgressPanel({ tasks, now }: ProgressPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      {PERIODS.map(({ period, label }) => (
        <ProgressBar key={period} label={label} progress={summarize(tasks, period, now)} />
      ))}
    </div>
  )
}

function ProgressBar({ label, progress }: { label: string; progress: Progress }) {
  const { completed, total, remaining, percent } = progress
  const empty = total === 0
  const caption = empty ? 'Nothing due' : `${String(completed)}/${String(total)} · ${describeRemaining(remaining)}`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{caption}</span>
      </div>

      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={caption}
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        >
          <div
            className="h-full rounded-full bg-green-600 transition-[width] duration-300"
            style={{ width: `${String(percent)}%` }}
          />
        </div>

        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
          {empty ? '—' : `${String(percent)}%`}
        </span>
      </div>
    </div>
  )
}

function describeRemaining(remaining: number): string {
  return remaining === 0 ? 'all done' : `${String(remaining)} left`
}
