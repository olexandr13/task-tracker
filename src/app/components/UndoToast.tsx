import type { UndoPending } from '../useUndoToast'
import { undoMessage } from '../useUndoToast'
import { UndoIcon } from './UndoIcon'

interface UndoToastProps {
  pending: UndoPending
  onUndo: () => void
  onDismiss: () => void
}

/**
 * The few seconds after a deletion, a completion or a redemption in which it can
 * be taken straight back. A deletion names what went and a redemption what the
 * points went on; a completion is only the arrow, with no words — the tick
 * itself already said what was done.
 */
export function UndoToast({ pending, onUndo, onDismiss }: UndoToastProps) {
  if (pending.kind === 'completion') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto rounded-xl bg-neutral-900 p-1.5 text-white shadow-xl dark:bg-neutral-100 dark:text-neutral-900"
      >
        <button
          type="button"
          onClick={onUndo}
          aria-label="Undo"
          title="Undo"
          className="flex size-9 items-center justify-center rounded-lg text-blue-400 transition-colors hover:bg-white/10 dark:text-blue-600 dark:hover:bg-black/5"
        >
          <UndoIcon className="size-5" />
        </button>
      </div>
    )
  }

  return (
    // Placed by the screen, with anything else it has to say (TasksScreen).
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl bg-neutral-900 py-2 pr-2 pl-4 text-sm text-white shadow-xl dark:bg-neutral-100 dark:text-neutral-900"
    >
      <span className="min-w-0 truncate">{undoMessage(pending)}</span>

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
