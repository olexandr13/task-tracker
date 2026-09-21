import { elapsedSeconds } from '../../core'
import { describeElapsedClock } from '../durationLabels'

interface RunningTimerChipProps {
  title: string
  startedAt: string
  clock: Date
  onStop: () => void
}

/**
 * A always-on reminder that a timer is running somewhere: the task's title,
 * the live clock, and Stop — so closing the panel or scrolling away cannot
 * hide it on web or phone.
 */
export function RunningTimerChip({ title, startedAt, clock, onStop }: RunningTimerChipProps) {
  const elapsed = describeElapsedClock(elapsedSeconds(startedAt, clock))
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl border border-blue-500/40 bg-neutral-900 py-2 pr-2 pl-4 text-sm text-white shadow-xl dark:border-blue-400/40 dark:bg-neutral-100 dark:text-neutral-900"
    >
      <span className="task-timer-running min-w-0 truncate">
        Timer on “{title}” · {elapsed}
      </span>
      <button
        type="button"
        onClick={onStop}
        className="shrink-0 rounded-lg px-2 py-1 font-medium text-red-300 transition-colors hover:bg-white/10 dark:text-red-600 dark:hover:bg-black/5"
      >
        Stop
      </button>
    </div>
  )
}
