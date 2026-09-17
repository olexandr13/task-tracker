import type { Redemption, RedemptionId } from '../../core'
import { describePoints, describeRedeemedAt } from '../rewardLabels'
import { deleteControl } from '../rowControls'

interface RedemptionListProps {
  /** Most recent first, as `redemptionHistory` gives them. */
  redemptions: readonly Redemption[]
  now: Date
  /** Deletes the redemption, giving its points back. */
  onRemove: (id: RedemptionId) => void
}

/**
 * What points went on: each redemption's day, what it was for and how many
 * points, with a button deleting it.
 */
export function RedemptionList({ redemptions, now, onRemove }: RedemptionListProps) {
  if (redemptions.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-600">Nothing redeemed yet.</p>
  }

  function handleRemove({ id, note, points }: Redemption) {
    // The record goes for good, so it asks first.
    if (window.confirm(`Delete "${note}"? Its ${describePoints(points)} go back to the balance.`)) {
      onRemove(id)
    }
  }

  return (
    <ul className="flex flex-col gap-1">
      {redemptions.map((redemption) => (
        <li
          key={redemption.id}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white py-2 pr-1.5 pl-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <span className="w-20 shrink-0 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
            {describeRedeemedAt(redemption.redeemedAt, now)}
          </span>
          <span className="min-w-0 flex-1 break-words text-neutral-900 dark:text-neutral-100">{redemption.note}</span>
          <span
            aria-label={`${describePoints(redemption.points)} redeemed`}
            className="shrink-0 text-neutral-500 tabular-nums dark:text-neutral-400"
          >
            −{redemption.points}
          </span>
          <button
            type="button"
            onClick={() => { handleRemove(redemption) }}
            aria-label={`Delete the redemption "${redemption.note}"`}
            title="Delete redemption"
            className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
