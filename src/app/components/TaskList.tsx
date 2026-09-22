import {
  groupByCompletion,
  isComplete,
  type CompletionSpan,
  type CompletionSpans,
  type List,
  type Task,
  type TaskId,
} from '../../core'
import { COMPLETION_SPAN_LABELS } from '../completionLabels'
import { CelebrateIcon } from './CelebrateIcon'
import { SortableTasks } from './SortableTasks'
import { TaskItem } from './TaskItem'
import type { TaskActions } from '../taskActions'
import type { TaskTimer } from '../useTaskTimer'

/** A phone leaves room between rows so a tap aimed at one does not catch the next. */
const rows = 'flex flex-col gap-1.5 md:gap-1'

/**
 * Older done work fades further back: yesterday still near full, last week and
 * last month progressively softer. Today and earlier stay at full strength.
 */
function doneSpanClass(span: CompletionSpan): string {
  switch (span) {
    case 'yesterday':
      return 'opacity-80'
    case 'last7Days':
      return 'opacity-60'
    case 'last30Days':
      return 'opacity-40'
    default:
      return ''
  }
}

interface TaskListProps {
  tasks: Task[]
  /** The moment the list is drawn for; a repeating task is only done for its current occurrence. */
  now: Date
  /** Every tag there is, for a row to offer. */
  knownTags: readonly string[]
  /** Every list there is, for a row to file its task under. */
  lists: readonly List[]
  /** Whether every row spells out what its controls hold, not only the woken one. */
  showDetails?: boolean
  /**
   * The open task Procrastination mode is focusing on. Every other row is dimmed;
   * null leaves the list at full strength unless `dimAll` is set.
   */
  focusId?: TaskId | null
  /**
   * Dim every row — Procrastination mode is on but idle after Rest, so nothing is
   * selected yet (JUST-5).
   */
  dimAll?: boolean
  /**
   * The spans the done tasks are divided into by when they were finished, each
   * under a heading, or null for one run of them. The tasks are then given in that
   * order too: to do, then done today, yesterday and so on (`groupByCompletion`).
   */
  doneSpans?: CompletionSpans | null
  /** What an empty list says, pointing at the box above it. */
  emptyMessage: string
  /** What the list says above its tasks once every one of them is done. */
  allDoneMessage: string
  /** What a row can do to its task. */
  actions: TaskActions
  timer?: Pick<TaskTimer, 'clock' | 'start' | 'stop' | 'isRunningFor' | 'state'>
  /** The task being gone to (TIME-20): its row is brought into view and opened. */
  revealId?: TaskId | null
  /** Its row has been brought into view and opened. */
  onRevealed?: () => void
}

export function TaskList({
  tasks,
  now,
  knownTags,
  lists,
  showDetails = false,
  focusId = null,
  dimAll = false,
  doneSpans = null,
  emptyMessage,
  allDoneMessage,
  actions,
  timer,
  revealId = null,
  onRevealed,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        {emptyMessage}
      </p>
    )
  }

  const allDone = tasks.every((task) => isComplete(task, now))

  /** A row; one under a span is dragged among that span's rows alone. */
  function row(task: Task, span?: CompletionSpan) {
    return (
      <TaskItem
        key={task.id}
        task={task}
        now={now}
        knownTags={knownTags}
        lists={lists}
        showDetails={showDetails}
        dimmed={dimAll || (focusId !== null && focusId !== task.id)}
        emphasized={!dimAll && focusId !== null && focusId === task.id}
        dragGroup={span === undefined ? undefined : `done:${span}`}
        actions={actions}
        timer={timer}
        revealed={revealId === task.id}
        onRevealed={onRevealed}
      />
    )
  }

  return (
    <>
      {allDone && (
        <div
          role="status"
          className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-green-300/70 bg-green-50 px-4 py-3 dark:border-green-500/35 dark:bg-green-950/50"
        >
          <CelebrateIcon className="size-5 text-amber-500 dark:text-amber-300" />
          <p className="text-sm font-medium text-green-900 dark:text-green-100">{allDoneMessage}</p>
        </div>
      )}
      {doneSpans !== null ? (
        <div className="flex flex-col gap-3">
          <SortableTasks tasks={tasks}>
            {groupByCompletion(tasks, doneSpans, now).map(({ span, tasks: group }) =>
              span === null ? (
                <ul key="todo" className={rows}>
                  {group.map((task) => row(task))}
                </ul>
              ) : (
                <section
                  key={span}
                  aria-label={COMPLETION_SPAN_LABELS[span]}
                  className={['flex flex-col gap-1.5', doneSpanClass(span)].filter(Boolean).join(' ')}
                >
                  <h2 className="flex items-baseline gap-2 px-1 text-xs font-medium text-neutral-400 dark:text-neutral-500">
                    {COMPLETION_SPAN_LABELS[span]}
                    <span className="font-normal text-neutral-300 tabular-nums dark:text-neutral-600">{group.length}</span>
                  </h2>
                  <ul className={rows}>{group.map((task) => row(task, span))}</ul>
                </section>
              ),
            )}
          </SortableTasks>
        </div>
      ) : (
        <ul className={rows}>
          <SortableTasks tasks={tasks}>{tasks.map((task) => row(task))}</SortableTasks>
        </ul>
      )}
    </>
  )
}
