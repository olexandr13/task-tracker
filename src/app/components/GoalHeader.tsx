import type { Goal, GoalProgress } from '../../core'
import { GoalProgressBar } from './GoalProgressBar'
import { TargetIcon } from './TargetIcon'

interface GoalHeaderProps {
  goal: Goal
  progress: GoalProgress
}

/**
 * The head of a goal's own view (GOAL-10): which goal it is and how far it has
 * got, above the box that adds a task to it — the one thing a goal's tasks have
 * that a list's do not.
 */
export function GoalHeader({ goal, progress }: GoalHeaderProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="flex min-w-0 items-center gap-2 text-base leading-6 text-neutral-900 dark:text-neutral-100">
        <TargetIcon className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
        <span className="min-w-0 truncate">{goal.name}</span>
      </h2>
      <GoalProgressBar progress={progress} name={goal.name} />
    </div>
  )
}
