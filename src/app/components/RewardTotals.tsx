import type { PeriodPoints, RewardPeriod } from '../../core'
import { describePoints } from '../rewardLabels'

interface RewardTotalsProps {
  /** As `rewardTotals` gives them. */
  totals: Record<RewardPeriod, PeriodPoints>
}

const PERIODS: readonly { readonly period: RewardPeriod; readonly label: string }[] = [
  { period: 'today', label: 'Today' },
  { period: 'week', label: 'This week' },
  { period: 'month', label: 'This month' },
  { period: 'year', label: 'This year' },
  { period: 'all', label: 'All time' },
]

/** Points earned in each period, one tile each, with what was redeemed in it underneath when anything was. */
export function RewardTotals({ totals }: RewardTotalsProps) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {PERIODS.map(({ period, label }) => {
        const { earned, redeemed } = totals[period]
        return (
          <div
            key={period}
            className="flex flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
            <dd className="flex flex-col">
              <span
                aria-label={`${describePoints(earned)} earned`}
                className="text-xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100"
              >
                {earned}
              </span>
              {redeemed > 0 && (
                <span className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">−{redeemed} redeemed</span>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
