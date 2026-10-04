import type { WarmUpProgress } from '../../core'
import { describeAllowance, describeWarmUpDayShort } from '../warmUpLabels'
import { WarmUpIcon } from './WarmUpIcon'

/** A growing thing, not a warning: the warm-up is encouragement, not a telling-off. */
const banner =
  'flex items-center gap-2 rounded-xl border border-green-200/90 bg-green-50/90 px-3 py-2.5 dark:border-green-700/40 dark:bg-green-950/25'

const title = 'min-w-0 flex-1 text-sm font-medium tabular-nums text-green-950 dark:text-green-100'

const action =
  'shrink-0 rounded-md border border-green-600/30 px-2 py-0.5 text-xs text-green-900/80 transition-colors hover:bg-green-100 hover:text-green-950 dark:border-green-500/40 dark:text-green-200/80 dark:hover:bg-green-900/40 dark:hover:text-green-50'

interface WarmUpPanelProps {
  /** Where the warm-up stands; nothing is drawn without one under way. */
  progress: WarmUpProgress | null
  /** Opens the warm-up's own page, where what it does is written out (MODE-10). */
  onMoreInfo: () => void
}

/**
 * The warm-up at the head of Habits, in one line: which day it is on and how
 * many habits there are over how many the day allows, with the way to read more
 * beside it (WARM-6). It sits where habits are added, which is the only place
 * the allowance is ever felt. It says nothing about what today leaves — that is
 * the notice's to say, when a habit is actually held back (WARM-8) — and offers
 * no way out, the switch on Modes being that (WARM-9). While it is paused the line
 * says so, the allowance being the one it froze on (WARM-11).
 */
export function WarmUpPanel({ progress, onMoreInfo }: WarmUpPanelProps) {
  if (progress === null) return null

  return (
    <div role="status" className={banner}>
      <WarmUpIcon />
      <p className={title}>
        Warm-up · {describeWarmUpDayShort(progress)}
        {progress.paused && ' · Paused'}
        <span className="font-normal"> · {describeAllowance(progress)}</span>
      </p>
      <button type="button" onClick={onMoreInfo} className={action}>
        More info
      </button>
    </div>
  )
}
