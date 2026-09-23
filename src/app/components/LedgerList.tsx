import type { LedgerRow, RedemptionId, RewardKey, TaskId } from '../../core'
import { describeEarnedOn, describeEarningTitle, describePoints } from '../rewardLabels'
import { deleteControl } from '../rowControls'

interface LedgerListProps {
  /** Most recent day first, as `ledgerHistory` gives them. */
  rows: readonly LedgerRow[]
  /** Titles of tasks that still exist, including those in the trash. */
  taskTitles: ReadonlyMap<TaskId, string>
  now: Date
  /** Deletes an earning, taking its points off the balance. */
  onRemoveEarning: (key: RewardKey) => void
  /** Deletes a redemption, giving its points back. */
  onRemoveRedemption: (id: RedemptionId) => void
}

/**
 * Everything that happened to the points, one run of it: each row its day, what
 * it was — a task, the bonus a period paid, or what points went on — and how
 * many points it moved, **+** earned or **−** spent (RWD-38).
 *
 * The two sides are told apart by the sign and a tint, and no more than that:
 * they belong to one story, and a list striped in two colours would read as two
 * lists again. A period's bonus is named for what it cleared rather than for a
 * task (RWD-28), and a purged task still shows — earned stays earned — as a
 * deleted one.
 *
 * The **×** on a row deletes it at once, whichever side it is; for a few seconds
 * the screen offers to undo.
 */
export function LedgerList({ rows, taskTitles, now, onRemoveEarning, onRemoveRedemption }: LedgerListProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-600">
        Nothing yet. Finish a task that has a reward, and it shows up here.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row) => {
        const earned = row.kind === 'earned'
        const title = earned ? describeEarningTitle(row.entry.taskId, taskTitles) : row.redemption.note
        const points = earned ? row.entry.points : row.redemption.points
        return (
          <li
            key={earned ? `earned/${row.entry.day}/${row.entry.taskId}` : `redeemed/${row.redemption.id}`}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white py-2 pr-1.5 pl-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="w-20 shrink-0 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
              {describeEarnedOn(row.day, now)}
            </span>
            <span className="min-w-0 flex-1 break-words text-neutral-900 dark:text-neutral-100">{title}</span>
            <span
              aria-label={`${describePoints(points)} ${earned ? 'earned' : 'redeemed'}`}
              className={`shrink-0 tabular-nums ${
                earned ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {earned ? '+' : '−'}
              {points}
            </span>
            <button
              type="button"
              onClick={() => {
                if (row.kind === 'earned') onRemoveEarning({ taskId: row.entry.taskId, day: row.entry.day })
                else onRemoveRedemption(row.redemption.id)
              }}
              aria-label={`Delete the ${earned ? 'earning' : 'redemption'} "${title}"`}
              title={earned ? 'Delete earning' : 'Delete redemption'}
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
