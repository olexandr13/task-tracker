import {
  affordablePrizes,
  bonusEarned,
  BONUS_PERIODS,
  nextPrize,
  pointsBalance,
  pointsShort,
  prizesOfKind,
  rewardTotals,
  type PeriodBonuses,
  type PointValue,
  type Prize,
  type Redemption,
  type RewardEntry,
} from '../../core'
import { describeMoney, describePoints, PERIOD_NAMES } from '../rewardLabels'
import { VIEW_LABELS } from '../view'
import { GiftIcon } from './GiftIcon'
import { RewardTotals } from './RewardTotals'
import { StarIcon } from './StarIcon'
import { TrophyIcon } from './TrophyIcon'

interface RewardsPageProps {
  entries: readonly RewardEntry[]
  redemptions: readonly Redemption[]
  /** Both lists of what points are spent on (RWD-40), for what the balance reaches. */
  prizes: readonly Prize[]
  /** What clearing each period earns (RWD-24, RWD-29). */
  bonuses: PeriodBonuses
  /** What one point is worth, or null while nothing says (RWD-31). */
  pointValue: PointValue | null
  /** The moment the totals are counted for: which day, week, month and year it is. */
  now: Date
  onOpenPrizes: () => void
  onOpenWishlist: () => void
  /** Opens the rules, to set what a period is worth. */
  onOpenRules: () => void
}

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const link =
  'rounded-lg text-sm text-blue-600 underline-offset-2 transition-colors hover:underline dark:text-blue-400'
const note = 'text-xs text-neutral-500 dark:text-neutral-400'

/**
 * How the points stand, which is what Rewards opens on: the balance and what it
 * comes to in money, what each period has earned, what finishing a whole period
 * pays on top and whether it has paid out yet, and what the balance reaches on
 * each of the two lists (RWD-30).
 *
 * Nothing is spent here and nothing is set here: spending is the prizes' and the
 * wishlist's (RWD-36), the rows behind the totals are the history's (RWD-38),
 * and the amounts are the rules' (RWD-39). This page is the answer to "where am I?".
 */
export function RewardsPage({
  entries,
  redemptions,
  prizes,
  bonuses,
  pointValue,
  now,
  onOpenPrizes,
  onOpenWishlist,
  onOpenRules,
}: RewardsPageProps) {
  const balance = pointsBalance(entries, redemptions)
  const worth = describeMoney(balance, pointValue)
  const withinReach = affordablePrizes(prizesOfKind(prizes, 'prize'), balance)
  const wishes = prizesOfKind(prizes, 'wish')
  const saving = nextPrize(wishes, balance) ?? nextPrize(prizesOfKind(prizes, 'prize'), balance)

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <StarIcon className="size-3.5 shrink-0" />
        Give a task a reward with its star, and every time it is done earns its points here.
      </p>

      <section aria-label="Balance" className={`${card} flex flex-col gap-1 px-4 py-3.5`}>
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">{balance}</span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {Math.abs(balance) === 1 ? 'point' : 'points'} to spend
          </span>
        </p>
        {worth !== null && (
          <p className="text-sm text-neutral-500 tabular-nums dark:text-neutral-400">worth {worth}</p>
        )}
      </section>

      <section aria-label="Earned" className="flex flex-col gap-2">
        <h2 className={heading}>Earned</h2>
        <RewardTotals totals={rewardTotals(entries, redemptions, now)} />
      </section>

      <section aria-label="Bonuses" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={heading}>Finish everything, earn extra</h2>
          <button type="button" onClick={onOpenRules} className={link}>
            {bonuses.today === null && bonuses.week === null && bonuses.month === null ? 'Set a bonus' : 'Change'}
          </button>
        </div>
        <p className={note}>
          An extra bonus on top of what the tasks themselves earn, paid once everything in the period is done.
        </p>
        {/* Three at a glance, side by side: one row reads as one rule with three amounts. */}
        <dl className="grid grid-cols-3 gap-2">
          {BONUS_PERIODS.map((period) => {
            const bonus = bonuses[period]
            const given = bonusEarned(entries, period, now)
            return (
              <div key={period} className={`${card} flex flex-col gap-0.5 px-3 py-2.5`}>
                <dt className="text-xs text-neutral-500 dark:text-neutral-400">{PERIOD_NAMES[period]}</dt>
                <dd className="flex flex-col">
                  <span
                    className={`text-xl font-semibold tabular-nums ${
                      bonus === null
                        ? 'text-neutral-300 dark:text-neutral-600'
                        : given !== null
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    {bonus === null ? '—' : `+${bonus}`}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {bonus === null ? 'no bonus' : given !== null ? 'earned' : 'all done = earned'}
                  </span>
                </dd>
              </div>
            )
          })}
        </dl>
      </section>

      <section aria-label="Spending" className="grid gap-2 sm:grid-cols-2">
        <div className={`${card} flex flex-col gap-1.5 px-4 py-3.5`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={`${heading} flex items-center gap-2`}>
              <GiftIcon className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
              {VIEW_LABELS['rewards/prizes']}
            </h2>
            <button type="button" onClick={onOpenPrizes} className={link}>
              {withinReach.length > 0 ? 'Spend points' : 'Open'}
            </button>
          </div>
          <p className="text-sm text-neutral-900 dark:text-neutral-100">
            {prizesOfKind(prizes, 'prize').length === 0
              ? 'Nothing to spend points on yet.'
              : withinReach.length === 0
                ? 'Nothing within reach yet.'
                : `Within reach: ${withinReach.map((prize) => prize.name).join(', ')}`}
          </p>
          <p className={note}>Small things, as often as you can afford them.</p>
        </div>

        <div className={`${card} flex flex-col gap-1.5 px-4 py-3.5`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={`${heading} flex items-center gap-2`}>
              <TrophyIcon className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
              {VIEW_LABELS['rewards/wishlist']}
            </h2>
            <button type="button" onClick={onOpenWishlist} className={link}>
              {wishes.length === 0 ? 'Add a wish' : 'Open'}
            </button>
          </div>
          <p className="text-sm text-neutral-900 dark:text-neutral-100">
            {saving === null
              ? wishes.length === 0
                ? 'Nothing wished for yet.'
                : 'Everything on it is within reach.'
              : `Saving up for ${saving.name}: ${describePoints(pointsShort(saving, balance))} to go.`}
          </p>
          <p className={note}>The big ones, bought once.</p>
        </div>
      </section>
    </div>
  )
}
