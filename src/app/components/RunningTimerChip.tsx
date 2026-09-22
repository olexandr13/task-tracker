import { elapsedSeconds } from '../../core'
import { describeElapsedClock } from '../durationLabels'

interface RunningTimerChipProps {
  title: string
  startedAt: string
  clock: Date
  /** Goes to the task the timer is running on (TIME-20). */
  onOpen: () => void
  onStop: () => void
}

/**
 * A always-on reminder that a timer is running somewhere: the task's title,
 * the live clock, and Stop — so closing the panel or scrolling away cannot
 * hide it on web or phone. A tap on the title and clock goes to the task.
 */
export function RunningTimerChip({ title, startedAt, clock, onOpen, onStop }: RunningTimerChipProps) {
  const elapsed = describeElapsedClock(elapsedSeconds(startedAt, clock))
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-1 rounded-xl border border-blue-500/40 bg-neutral-900 p-1 text-sm text-white shadow-xl dark:border-blue-400/40 dark:bg-neutral-100 dark:text-neutral-900"
    >
      <button
        type="button"
        onClick={onOpen}
        title="Go to the task"
        className="task-timer-running min-w-0 flex-1 truncate rounded-lg py-2 pr-1 pl-3 text-left transition-colors hover:bg-white/10 active:bg-white/10 dark:hover:bg-black/5 dark:active:bg-black/5"
      >
        Timer on “{title}” · {elapsed}
      </button>
      <button
        type="button"
        onClick={onStop}
        className="shrink-0 rounded-lg px-3 py-2 font-medium text-red-300 transition-colors hover:bg-white/10 dark:text-red-600 dark:hover:bg-black/5"
      >
        Stop
      </button>
    </div>
  )
}
