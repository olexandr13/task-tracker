import { MIN_CHEST_POINTS } from '../../core'
import { RANGE_LEAST, RANGE_MOST } from '../chestLabels'

const end = 'flex items-baseline gap-1.5 px-3 py-1'
const label = 'text-[10px] font-semibold tracking-[0.1em] text-neutral-500 uppercase dark:text-neutral-400'
const unit = 'ml-0.5 text-xs font-normal text-neutral-500 dark:text-neutral-400'

/**
 * What a chest can give, end to end (CHST-26): **at least** 1 point, and **up
 * to** the jackpot — by default what the most valuable task finished today was
 * worth. Two numbers rather than a table of tiers and chances: what is at stake
 * is the question someone looking at a shut chest is asking, and the tiers say
 * themselves once it is open.
 *
 * One small pill over the chest, as the stakes are written over a machine,
 * rather than a pair of boxes the width of the page: two numbers are a label,
 * not a section. The most is the one that moves — up as heavier tasks are
 * finished — so it is the one marked out, in the gold the chest opens in.
 */
export function ChestRange({ jackpot, hint }: { jackpot: number; hint: string }) {
  return (
    <section aria-label="What a chest can give" className="flex flex-col items-center gap-1.5">
      <dl className="inline-flex items-center divide-x divide-neutral-200 rounded-full border border-neutral-200 bg-white text-sm shadow-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        <div className={end}>
          <dt className={label}>{RANGE_LEAST}</dt>
          <dd className="font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
            {MIN_CHEST_POINTS}
            <span className={unit}>{MIN_CHEST_POINTS === 1 ? 'point' : 'points'}</span>
          </dd>
        </div>
        <div className={end}>
          <dt className={label}>{RANGE_MOST}</dt>
          <dd className="font-semibold text-amber-700 tabular-nums dark:text-amber-300">
            {jackpot}
            <span className={unit}>{jackpot === 1 ? 'point' : 'points'}</span>
          </dd>
        </div>
      </dl>
      <p className="max-w-sm text-center text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
    </section>
  )
}
