import type { PendingCheckIn } from '../../core'
import { describeCheckInQuestion, describeOthersNotLogged } from '../checkInLabels'

interface CheckInToastProps {
  checkIn: PendingCheckIn
  /** Opens the activity log on the hour asked about (CHECKIN-4). */
  onLog: () => void
  onDismiss: () => void
}

/**
 * The hour that just ended, asked about: what was done in it. "Log it" opens the
 * activity log on that hour, so answering is one move; the × puts it away until
 * the next hour asks. It goes by itself once the hour is logged, anywhere.
 */
export function CheckInToast({ checkIn, onLog, onDismiss }: CheckInToastProps) {
  const others = describeOthersNotLogged(checkIn.others)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-1 rounded-xl border border-sky-500/40 bg-neutral-900 p-1 text-sm text-white shadow-xl dark:border-sky-400/50 dark:bg-neutral-100 dark:text-neutral-900"
    >
      <span aria-hidden="true" className="pl-2 text-base leading-none">
        ⏰
      </span>
      <span className="flex min-w-0 flex-1 flex-col py-1 pr-1 pl-1.5">
        <span className="truncate">{describeCheckInQuestion(checkIn.slot)}</span>
        {others !== null && <span className="truncate text-xs text-neutral-400 dark:text-neutral-500">{others}</span>}
      </span>
      <button
        type="button"
        onClick={onLog}
        className="shrink-0 rounded-lg px-2 py-1 font-medium text-blue-400 transition-colors hover:bg-white/10 dark:text-blue-600 dark:hover:bg-black/5"
      >
        Log it
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-neutral-400 transition-colors hover:bg-white/10 hover:text-white dark:text-neutral-500 dark:hover:bg-black/5 dark:hover:text-neutral-900"
      >
        ×
      </button>
    </div>
  )
}
