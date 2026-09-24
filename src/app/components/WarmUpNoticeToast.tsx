import type { WarmUpProgress } from '../../core'
import { describeHeldBack } from '../warmUpLabels'

interface WarmUpNoticeToastProps {
  /** The warm-up as it stood when the habit was held back. */
  progress: WarmUpProgress
  onDismiss: () => void
}

/**
 * A habit was held back by the warm-up (WARM-8). Said out loud where the
 * change was asked for, since a refusal without a word reads as a fault.
 */
export function WarmUpNoticeToast({ progress, onDismiss }: WarmUpNoticeToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl bg-green-800 py-2 pr-2 pl-4 text-sm text-white shadow-xl dark:bg-green-200 dark:text-green-950"
    >
      <span className="min-w-0">{describeHeldBack(progress)}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-green-200/80 transition-colors hover:bg-white/10 hover:text-white dark:text-green-800 dark:hover:bg-black/5 dark:hover:text-green-950"
      >
        ×
      </button>
    </div>
  )
}
