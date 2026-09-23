import {
  ledgerHistory,
  type Redemption,
  type RedemptionId,
  type RewardEntry,
  type RewardKey,
  type TaskId,
} from '../../core'
import { LedgerList } from './LedgerList'

interface RewardsHistoryPageProps {
  entries: readonly RewardEntry[]
  redemptions: readonly Redemption[]
  /** Titles of tasks that still exist, including those in the trash. */
  taskTitles: ReadonlyMap<TaskId, string>
  now: Date
  onRemoveEarning: (key: RewardKey) => void
  onRemoveRedemption: (id: RedemptionId) => void
}

/**
 * Where every point came from and where it went, in **one run**: what was
 * earned and what was spent together, most recent first, each row signed
 * (RWD-38). Two lists, one for each side, would mean reading both and holding
 * the days side by side to see what a week actually came to.
 *
 * It is a page of its own rather than the foot of how the points stand: a year
 * of days is a long page, and how you are doing should not be behind it.
 */
export function RewardsHistoryPage({
  entries,
  redemptions,
  taskTitles,
  now,
  onRemoveEarning,
  onRemoveRedemption,
}: RewardsHistoryPageProps) {
  return (
    <section aria-label="History" className="flex flex-col gap-2">
      <LedgerList
        rows={ledgerHistory(entries, redemptions)}
        taskTitles={taskTitles}
        now={now}
        onRemoveEarning={onRemoveEarning}
        onRemoveRedemption={onRemoveRedemption}
      />
    </section>
  )
}
