import {
  groupByCompletion,
  isComplete,
  type CompletionSpan,
  type CompletionSpans,
  type List,
  type ListId,
  type LocalDay,
  type Repeat,
  type SubtaskId,
  type Task,
  type TaskId,
  type TimeEntryId,
} from '../../core'
import { COMPLETION_SPAN_LABELS } from '../completionLabels'
import { SortableTasks } from './SortableTasks'
import { TaskItem } from './TaskItem'

/** A phone leaves room between rows so a tap aimed at one does not catch the next. */
const rows = 'flex flex-col gap-2 md:gap-1'

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
   * The spans the done tasks are divided into by when they were finished, each
   * under a heading, or null for one run of them. The tasks are then given in that
   * order too: to do, then done today, yesterday and so on (`groupByCompletion`).
   */
  doneSpans?: CompletionSpans | null
  /** What an empty list says, pointing at the box above it. */
  emptyMessage: string
  /** What the list says above its tasks once every one of them is done. */
  allDoneMessage: string
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  onRename: (id: TaskId, title: string) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  onSkipOccurrence: (id: TaskId) => void
  onChangeRepeat: (id: TaskId, repeat: Repeat | null) => void
  onChangeReward: (id: TaskId, reward: number | null) => void
  onChangeUrgent: (id: TaskId, urgent: boolean) => void
  onChangeTimeGoal: (id: TaskId, minutes: number | null) => void
  onLogTime: (id: TaskId, minutes: number) => void
  onRemoveTimeEntry: (id: TaskId, entryId: TimeEntryId) => void
  onChangeList: (id: TaskId, listId: ListId | null) => void
  onAddTag: (id: TaskId, name: string) => void
  onRemoveTag: (id: TaskId, name: string) => void
  onRemove: (id: TaskId) => void
  onDuplicate: (id: TaskId) => void
  onAddSubtask: (id: TaskId, index: number, title: string) => void
  onSetSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  onRenameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  onRemoveSubtask: (id: TaskId, subtaskId: SubtaskId) => void
}

export function TaskList({
  tasks,
  now,
  knownTags,
  lists,
  showDetails = false,
  doneSpans = null,
  emptyMessage,
  allDoneMessage,
  onComplete,
  onUncomplete,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onSkipOccurrence,
  onChangeRepeat,
  onChangeReward,
  onChangeUrgent,
  onChangeTimeGoal,
  onLogTime,
  onRemoveTimeEntry,
  onChangeList,
  onAddTag,
  onRemoveTag,
  onRemove,
  onDuplicate,
  onAddSubtask,
  onSetSubtaskDone,
  onRenameSubtask,
  onRemoveSubtask,
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
        dragGroup={span === undefined ? undefined : `done:${span}`}
        onComplete={onComplete}
        onUncomplete={onUncomplete}
        onRename={onRename}
        onChangeDescription={onChangeDescription}
        onChangeDueDate={onChangeDueDate}
        onSkipOccurrence={onSkipOccurrence}
        onChangeRepeat={onChangeRepeat}
        onChangeReward={onChangeReward}
        onChangeUrgent={onChangeUrgent}
        onChangeTimeGoal={onChangeTimeGoal}
        onLogTime={onLogTime}
        onRemoveTimeEntry={onRemoveTimeEntry}
        onChangeList={onChangeList}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onAddSubtask={onAddSubtask}
        onSetSubtaskDone={onSetSubtaskDone}
        onRenameSubtask={onRenameSubtask}
        onRemoveSubtask={onRemoveSubtask}
      />
    )
  }

  return (
    <>
      {allDone && (
        <p className="pt-4 pb-6 text-center text-green-700/70 dark:text-green-500/55">{allDoneMessage}</p>
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
