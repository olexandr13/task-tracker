import {
  pointsBalance,
  redemptionHistory,
  rewardTotals,
  type Redemption,
  type RedemptionId,
  type RewardEntry,
} from '../../core'
import { RedeemForm } from './RedeemForm'
import { RedemptionList } from './RedemptionList'
import { RewardTotals } from './RewardTotals'
import { StarIcon } from './StarIcon'

interface RewardsPageProps {
  entries: readonly RewardEntry[]
  redemptions: readonly Redemption[]
  /** The moment the totals are counted for: which day, week, month and year it is. */
  now: Date
  onRedeem: (points: number, note: string) => void
  onRemoveRedemption: (id: RedemptionId) => void
}

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'

/**
 * The points: how many there are to spend and a way to spend them, how many were
 * earned and redeemed in each period, and what they went on.
 */
export function RewardsPage({ entries, redemptions, now, onRedeem, onRemoveRedemption }: RewardsPageProps) {
  const balance = pointsBalance(entries, redemptions)

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <StarIcon className="size-3.5 shrink-0" />
        Give a task a reward with its star, and every time it is done earns its points here.
      </p>

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
      </section>

      <section aria-label="Redeemed" className="flex flex-col gap-2">
        <h2 className={heading}>Redeemed</h2>
        <RedemptionList redemptions={redemptionHistory(redemptions)} now={now} onRemove={onRemoveRedemption} />
      </section>
    </div>
  )
}
