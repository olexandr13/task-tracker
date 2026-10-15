import { goalPercent, isGoalReached, type GoalProgress } from '../../core'
import { describeGoalPercent, describeGoalProgress } from '../goalLabels'

interface GoalProgressBarProps {
  progress: GoalProgress
  /** The goal's name, which the bar is named after for a screen reader. */
  name: string
}

/**
 * How far a goal has got (GOAL-7): a bar, how many of its tasks are done, and
 * the share as a percent. Drawn as the period bars are (./ProgressPanel), so a bar reads
 * the same wherever it is; a goal every task of which is done keeps it full
 * and says so in green (GOAL-7), and one no task serves yet says so rather than
 * 0% (GOAL-8).
 */
export function GoalProgressBar({ progress, name }: GoalProgressBarProps) {
  const percent = goalPercent(progress) ?? 0
  const caption = describeGoalProgress(progress)
  const reached = isGoalReached(progress)

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={`Progress of "${name}"`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${caption}, ${describeGoalPercent(progress)}`}
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
      >
        <div
          className="h-full rounded-full bg-green-600 transition-[width] duration-300"
          style={{ width: `${String(percent)}%` }}
        />
      </div>

      <span
        aria-hidden="true"
        className={`shrink-0 text-xs tabular-nums ${reached ? 'font-medium text-green-700 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'}`}
      >
        {caption} · {describeGoalPercent(progress)}
      </span>
    </div>
  )
}
