interface ReminderToastProps {
  /** The task whose hour has come round — the first, where several have. */
  title: string
  /** How many more are standing behind it, 0 when it is the only one. */
  more: number
  /** Goes to that task and opens it (REM-4). */
  onOpen: () => void
  onDismiss: () => void
}

/**
 * The hour a task was due at has come round and it is still to do, so the app
 * says so. A tap on it goes to that task, as the nudge and the running timer's
 * chip do: the next step is one move rather than a decision.
 *
 * Where several hours struck together the first is named and the rest counted —
 * a list of titles at the foot of the screen would be a second screen.
 */
export function ReminderToast({ title, more, onOpen, onDismiss }: ReminderToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-1 rounded-xl border border-blue-500/40 bg-neutral-900 p-1 text-sm text-white shadow-xl dark:border-blue-400/50 dark:bg-neutral-100 dark:text-neutral-900"
    >
      <button
        type="button"
        onClick={onOpen}
        title="Go to the task"
        className="min-w-0 flex-1 truncate rounded-lg py-2 pr-1 pl-3 text-left transition-colors hover:bg-white/10 active:bg-white/10 dark:hover:bg-black/5 dark:active:bg-black/5"
      >
        Due now · “{title}”
        {more > 0 && ` and ${String(more)} more`}
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
