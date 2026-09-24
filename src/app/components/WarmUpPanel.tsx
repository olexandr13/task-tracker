import type { WarmUpProgress } from '../../core'
import { describeAllowance, describeRemaining, describeWarmUpDay } from '../warmUpLabels'
import { WarmUpIcon } from './WarmUpIcon'

/** A growing thing, not a warning: the warm-up is encouragement, not a telling-off. */
const banner =
  'flex items-center gap-2 rounded-xl border border-green-200/90 bg-green-50/90 px-3 py-2.5 dark:border-green-700/40 dark:bg-green-950/25'

const title = 'text-sm font-medium text-green-950 dark:text-green-100'
const hint = 'text-xs text-green-900/70 dark:text-green-200/65'

const action =
  'rounded-md border border-green-600/30 px-2 py-0.5 text-xs text-green-900/80 transition-colors hover:bg-green-100 hover:text-green-950 dark:border-green-500/40 dark:text-green-200/80 dark:hover:bg-green-900/40 dark:hover:text-green-50'

interface WarmUpPanelProps {
  /** Where the warm-up stands; nothing is drawn without one under way. */
  progress: WarmUpProgress | null
  /** Opens the warm-up's own page, where what it does is written out (MODE-10). */
  onMoreInfo: () => void
  /** Ends the warm-up at once (WARM-9). */
  onEnd: () => void
}

/**
 * The warm-up at the head of Habits: which day it is on, how much of that day's
 * allowance is taken, the way to read more, and the way out (WARM-6). It sits
 * where habits are added, which is the only place the allowance is ever felt.
 */
export function WarmUpPanel({ progress, onMoreInfo, onEnd }: WarmUpPanelProps) {
  if (progress === null) return null

  return (
    <div role="status" className={banner}>
      <WarmUpIcon />

      <div className="min-w-0 flex-1">
        <p className={title}>
          Warm-up · {describeWarmUpDay(progress)}
          <span className="font-normal"> · {describeAllowance(progress)}</span>
        </p>
        <p className={hint}>{describeRemaining(progress)}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <button type="button" onClick={onMoreInfo} className={action}>
          More info
        </button>
        <button type="button" onClick={onEnd} className={action}>
          End warm-up
        </button>
      </div>
    </div>
  )
}
