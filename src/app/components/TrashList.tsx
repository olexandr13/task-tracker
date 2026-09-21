import type { Task, TaskId } from '../../core'
import { deleteControl } from '../rowControls'
import { TrashIcon } from './TrashIcon'

interface TrashListProps {
  /** Already filtered and ordered by `trashedTasks`: newest deletion first. */
  tasks: Task[]
  onRestore: (id: TaskId) => void
  onPurge: (id: TaskId) => void
  onEmpty: () => void
}

const action = 'shrink-0 rounded-lg px-2 py-1 text-xs transition-colors'

/**
 * What has been deleted and has not yet been cleared out. Everything here is
 * still recoverable, so the only irreversible controls are the two that say so.
 */
export function TrashList({ tasks, onRestore, onPurge, onEmpty }: TrashListProps) {
  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        The trash is empty. Deleted tasks wait here for a day.
      </p>
    )
  }

  function handleEmpty() {
    // The one action here that cannot be undone from the screen it happens on,
    // so it is the one that asks first.
    if (window.confirm('Delete everything in the trash for good?')) {
      onEmpty()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Deleted tasks are kept for a day.</p>
        <button
          type="button"
          onClick={handleEmpty}
          className={`${action} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`}
        >
          Empty trash
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <TrashIcon className="size-4 shrink-0 text-neutral-300 dark:text-neutral-600" />

            <p className="min-w-0 flex-1 truncate text-neutral-500 dark:text-neutral-400">{task.title}</p>

            <button
              type="button"
              onClick={() => { onRestore(task.id) }}
              className={`${action} text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100`}
            >
              Restore
            </button>

            <button
              type="button"
              onClick={() => { onPurge(task.id) }}
              aria-label={`Delete "${task.title}" for good`}
              title="Delete for good"
              className={`shrink-0 rounded-lg px-2 py-1 text-lg leading-none ${deleteControl}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
