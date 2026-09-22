import {
  DEFAULT_TODAY_BONUS,
  earningHistory,
  pointsBalance,
  redemptionHistory,
  rewardTotals,
  type Redemption,
  type RedemptionId,
  type RewardEntry,
  type RewardKey,
  type TaskId,
} from '../../core'
import { TODAY_BONUS_TITLE } from '../rewardLabels'
import { EarningList } from './EarningList'
import { RedeemForm } from './RedeemForm'
import { RedemptionList } from './RedemptionList'
import { RewardPicker } from './RewardPicker'
import { RewardTotals } from './RewardTotals'
import { StarIcon } from './StarIcon'

interface RewardsPageProps {
  entries: readonly RewardEntry[]
  redemptions: readonly Redemption[]
  /** Titles of tasks that still exist, including those in the trash. */
  taskTitles: ReadonlyMap<TaskId, string>
  /** What clearing Today earns (RWD-24), or null for no bonus. */
  todayBonus: number | null
  /** The moment the totals are counted for: which day, week, month and year it is. */
  now: Date
  onRedeem: (points: number, note: string) => void
  /** Sets what clearing Today earns from here on, or takes the bonus away with null. */
  onChangeTodayBonus: (points: number | null) => void
  onRemoveEarning: (key: RewardKey) => void
  onRemoveRedemption: (id: RedemptionId) => void
}

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'

/**
 * The points: what clearing Today is worth, how many there are to spend and a
 * way to spend them, how many were earned and redeemed in each period, what each
 * completion earned, and what points went on.
 */
export function RewardsPage({
  entries,
  redemptions,
  taskTitles,
  todayBonus,
  now,
  onRedeem,
  onChangeTodayBonus,
  onRemoveEarning,
  onRemoveRedemption,
}: RewardsPageProps) {
  const balance = pointsBalance(entries, redemptions)

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <StarIcon className="size-3.5 shrink-0" />
        Give a task a reward with its star, and every time it is done earns its points here.
      </p>

      <section
        aria-label="Bonus"
        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className={heading}>{TODAY_BONUS_TITLE}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Earned once a day, the moment everything in Today is done.
          </p>
        </div>
        <div className="w-32 shrink-0">
          <RewardPicker
            reward={todayBonus}
            startAt={DEFAULT_TODAY_BONUS}
            onChange={onChangeTodayBonus}
            label="Bonus for clearing Today"
            hint="Points for clearing Today"
            showAmount
            addLabel="Add bonus"
            noneLabel="No bonus"
          />
        </div>
      </section>

      <section
        aria-label="Balance"
        className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">{balance}</span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {Math.abs(balance) === 1 ? 'point' : 'points'} to spend
          </span>
        </p>
        <RedeemForm balance={balance} onRedeem={onRedeem} />
      </section>

      <section aria-label="Earned" className="flex flex-col gap-2">
        <h2 className={heading}>Earned</h2>
        <RewardTotals totals={rewardTotals(entries, redemptions, now)} />
        <EarningList
          entries={earningHistory(entries)}
          taskTitles={taskTitles}
          now={now}
          onRemove={onRemoveEarning}
        />
      </section>

      <section aria-label="Redeemed" className="flex flex-col gap-2">
        <h2 className={heading}>Redeemed</h2>
        <RedemptionList redemptions={redemptionHistory(redemptions)} now={now} onRemove={onRemoveRedemption} />
      </section>
    </div>
  )
}
