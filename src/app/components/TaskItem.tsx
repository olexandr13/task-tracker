import { isComplete, type Task, type TaskId } from '../../core'

interface TaskItemProps {
  task: Task
  onComplete: (id: TaskId) => void
  onRemove: (id: TaskId) => void
}

export function TaskItem({ task, onComplete, onRemove }: TaskItemProps) {
  const done = isComplete(task)

  return (
    <li className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => { onComplete(task.id) }}
        disabled={done}
        aria-label={done ? `"${task.title}" is done` : `Mark "${task.title}" as done`}
        className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-neutral-300 text-sm leading-none text-white transition-colors enabled:hover:border-neutral-900 disabled:border-green-600 disabled:bg-green-600 dark:border-neutral-600 dark:enabled:hover:border-neutral-300"
      >
        {done ? '✓' : ''}
      </button>

      <span
        className={
          done
            ? 'min-w-0 flex-1 break-words text-neutral-400 line-through dark:text-neutral-600'
            : 'min-w-0 flex-1 break-words text-neutral-900 dark:text-neutral-100'
        }
      >
        {task.title}
      </span>

      <button
        type="button"
        onClick={() => { onRemove(task.id) }}
        aria-label={`Delete "${task.title}"`}
        className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        ×
      </button>
    </li>
  )
}
