import { isTodayBonus, type RewardEntry, type RewardKey, type TaskId } from '../../core'
import { describeEarnedOn, describePoints, TODAY_BONUS_TITLE } from '../rewardLabels'
import { deleteControl } from '../rowControls'

interface EarningListProps {
  /** Most recent day first, as `earningHistory` gives them. */
  entries: readonly RewardEntry[]
  /** Titles of tasks that still exist, including those in the trash. */
  taskTitles: ReadonlyMap<TaskId, string>
  now: Date
  /** Deletes the earning, taking its points off the balance. */
  onRemove: (key: RewardKey) => void
}

/**
 * What completions earned: each entry's day, the task's title and how many
 * points, with a button deleting it. A day's bonus is named for what earned it
 * rather than for a task (RWD-27). A purged task still shows — earned stays
 * earned until the row is removed — as a deleted one. Deleting asks nothing:
 * the screen offers to undo for a few seconds.
 */
export function EarningList({ entries, taskTitles, now, onRemove }: EarningListProps) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-600">Nothing earned yet.</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {entries.map((entry) => {
        const title = titleOf(entry.taskId, taskTitles)
        return (
          <li
            key={`${entry.day}/${entry.taskId}`}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white py-2 pr-1.5 pl-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="w-20 shrink-0 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
              {describeEarnedOn(entry.day, now)}
            </span>
            <span className="min-w-0 flex-1 break-words text-neutral-900 dark:text-neutral-100">{title}</span>
            <span
              aria-label={`${describePoints(entry.points)} earned`}
              className="shrink-0 text-neutral-500 tabular-nums dark:text-neutral-400"
            >
              +{entry.points}
            </span>
            <button
              type="button"
              onClick={() => { onRemove({ taskId: entry.taskId, day: entry.day }) }}
              aria-label={`Delete the earning for "${title}"`}
              title="Delete earning"
              className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
            >
              ×
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function titleOf(taskId: TaskId, taskTitles: ReadonlyMap<TaskId, string>): string {
  if (isTodayBonus(taskId)) return TODAY_BONUS_TITLE
  return taskTitles.get(taskId) ?? 'Deleted task'
}
