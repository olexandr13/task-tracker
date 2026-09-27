import type { WarmUpProgress } from '../../core'
import { describeAllowance, describeWarmUpDay } from '../warmUpLabels'
import { WarmUpIcon } from './WarmUpIcon'

/** A growing thing, not a warning: the warm-up is encouragement, not a telling-off. */
const banner =
  'flex items-start gap-2 rounded-xl border border-green-200/90 bg-green-50/90 px-3 py-2.5 dark:border-green-700/40 dark:bg-green-950/25'

const title = 'text-sm font-medium text-green-950 dark:text-green-100'

const action =
  'rounded-md border border-green-600/30 px-2 py-0.5 text-xs text-green-900/80 transition-colors hover:bg-green-100 hover:text-green-950 dark:border-green-500/40 dark:text-green-200/80 dark:hover:bg-green-900/40 dark:hover:text-green-50'

interface WarmUpPanelProps {
  /** Where the warm-up stands; nothing is drawn without one under way. */
  progress: WarmUpProgress | null
  /** Opens the warm-up's own page, where what it does is written out (MODE-10). */
  onMoreInfo: () => void
}

/**
 * The warm-up at the head of Habits: one line — which day it is on and how much
 * of that day's allowance is taken — and the way to read more (WARM-6). It sits
 * where habits are added, which is the only place the allowance is ever felt.
 * What today leaves, how the rule works and the way out are all on its own page,
 * one button away (WARM-9): the banner says where things stand and no more.
 */
export function WarmUpPanel({ progress, onMoreInfo }: WarmUpPanelProps) {
  if (progress === null) return null

  return (
    <div role="status" className={banner}>
      <WarmUpIcon className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center text-base leading-none" />

      <div className="min-w-0 flex-1">
        <p className={title}>
          Warm-up · {describeWarmUpDay(progress)}
          <span className="font-normal"> · {describeAllowance(progress)}</span>
        </p>

        <div className="mt-2">
          <button type="button" onClick={onMoreInfo} className={action}>
            More info
          </button>
        </div>
      </div>
    </div>
  )
}
