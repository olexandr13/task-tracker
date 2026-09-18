interface UndoToastProps {
  /** The title of the task just deleted. */
  title: string
  onUndo: () => void
  onDismiss: () => void
}

/**
 * The few seconds after a deletion in which it can be taken straight back.
 * Letting it lapse loses nothing — the task is in the trash either way.
 */
export function UndoToast({ title, onUndo, onDismiss }: UndoToastProps) {
  return (
    // Placed by the screen, with anything else it has to say (TasksScreen).
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl bg-neutral-900 py-2 pr-2 pl-4 text-sm text-white shadow-xl dark:bg-neutral-100 dark:text-neutral-900"
    >
      <span className="min-w-0 truncate">Deleted “{title}”</span>

      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 rounded-lg px-2 py-1 font-medium text-blue-400 transition-colors hover:bg-white/10 dark:text-blue-600 dark:hover:bg-black/5"
      >
        Undo
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
