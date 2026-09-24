import type { QuietHours } from '../../core'

interface NudgeToastProps {
  title: string
  quietHours: QuietHours
  /** Goes to the task the nudge points at (NUDGE-8). */
  onOpen: () => void
  onDismiss: () => void
}

/**
 * Nothing has been finished for the chosen span, so the app says so and names
 * the one task to pick up. A tap on it goes to that task — the whole point is
 * that the next step takes one move, not a decision.
 */
export function NudgeToast({ title, quietHours, onOpen, onDismiss }: NudgeToastProps) {
  const span = quietHours === 1 ? 'an hour' : `${quietHours} hours`

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-1 rounded-xl border border-amber-500/40 bg-neutral-900 p-1 text-sm text-white shadow-xl dark:border-amber-400/50 dark:bg-neutral-100 dark:text-neutral-900"
    >
      <button
        type="button"
        onClick={onOpen}
        title="Go to the task"
        className="min-w-0 flex-1 truncate rounded-lg py-2 pr-1 pl-3 text-left transition-colors hover:bg-white/10 active:bg-white/10 dark:hover:bg-black/5 dark:active:bg-black/5"
      >
        Nothing done in {span} · Next up: “{title}”
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
