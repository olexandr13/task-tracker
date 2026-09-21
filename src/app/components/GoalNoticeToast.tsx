interface GoalNoticeToastProps {
  title: string
  onDismiss: () => void
}

/**
 * The time goal was reached while a timer is still running. The timer is left
 * alone; this is only a notice so the owner can tick the task off when ready.
 */
export function GoalNoticeToast({ title, onDismiss }: GoalNoticeToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl bg-green-800 py-2 pr-2 pl-4 text-sm text-white shadow-xl dark:bg-green-200 dark:text-green-950"
    >
      <span className="min-w-0 truncate">Time goal reached for “{title}”</span>
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
