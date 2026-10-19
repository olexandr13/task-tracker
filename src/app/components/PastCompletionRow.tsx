import type { LocalDay, Task } from '../../core'
import { describePastCompletion } from '../completionLabels'
import { TickIcon } from './TickIcon'

interface PastCompletionRowProps {
  /** The repeating task that was done. */
  task: Task
  /** The day it was done on, before the occurrence in play. */
  day: LocalDay
  /** The moment the list is drawn for, which says how the day reads. */
  now: Date
  /** Goes to the task's own row. */
  onOpen: () => void
}

/**
 * A day a repeating task was done on before the occurrence in play, among the
 * done work under a span (TASK-75). It reads as a done row — the green box, the
 * title struck through — with the day beside the title, several days of one
 * habit being able to sit under the same heading. It is a record of that day
 * rather than the task, so nothing on it changes anything: the box is drawn,
 * not a control, an earlier day being the Habits page's to change (RPT-28,
 * HAB-16). A tap or a click anywhere on it goes to the task's own row (TIME-20).
 *
 * Its size and spacing are a resting row's, a phone's a step up (UI-47).
 */
export function PastCompletionRow({ task, day, now, onOpen }: PastCompletionRowProps) {
  const { day: when, label } = describePastCompletion(task.title, day, now)

  return (
    <li className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 md:gap-2 md:px-2.5 md:py-1.5"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-green-600 bg-green-600 text-white md:mr-0.5">
          <TickIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 text-base break-words text-neutral-400 line-through md:text-sm dark:text-neutral-600">
          {task.title}
        </span>
        <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">{when}</span>
      </button>
    </li>
  )
}
