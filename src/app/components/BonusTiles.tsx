import { bonusEarned, BONUS_PERIODS, type PeriodBonuses, type RewardEntry } from '../../core'
import { PERIOD_NAMES } from '../rewardLabels'

interface BonusTilesProps {
  /** What clearing each period earns (RWD-24, RWD-29). */
  bonuses: PeriodBonuses
  /** What the ledger holds, for whether each period has paid out yet. */
  entries: readonly RewardEntry[]
  /** Which day, week and month it is. */
  now: Date
}

const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'

/**
 * Where each period's bonus stands, three at a glance side by side — one row
 * reads as one rule with three amounts: `+5 earned`, `+20 all done = earned`,
 * or `— no bonus` (RWD-20). Shown on how the points stand and on Rules (RWD-39),
 * so the page that sets the amounts says what they have come to as well.
 */
export function BonusTiles({ bonuses, entries, now }: BonusTilesProps) {
  return (
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
  )
}
