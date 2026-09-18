import {
  isComplete,
  type List,
  type ListId,
  type LocalDay,
  type Repeat,
  type SubtaskId,
  type Task,
  type TaskId,
} from '../../core'
import { SortableTasks } from './SortableTasks'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  /** The moment the list is drawn for; a repeating task is only done for its current occurrence. */
  now: Date
  /** Every tag in use, for a row to offer. */
  knownTags: readonly string[]
  /** Every list there is, for a row to file its task under. */
  lists: readonly List[]
  /** What an empty list says, pointing at the box above it. */
  emptyMessage: string
  /** What the list says above its tasks once every one of them is done. */
  allDoneMessage: string
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  onRename: (id: TaskId, title: string) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  onChangeRepeat: (id: TaskId, repeat: Repeat | null) => void
  onChangeReward: (id: TaskId, reward: number | null) => void
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
  emptyMessage,
  allDoneMessage,
  onComplete,
  onUncomplete,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onChangeRepeat,
  onChangeReward,
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

  return (
    <>
      {allDone && (
        <p className="pt-4 pb-6 text-center text-green-700/70 dark:text-green-500/55">{allDoneMessage}</p>
      )}
      <ul className="flex flex-col gap-1">
        <SortableTasks tasks={tasks}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              now={now}
              knownTags={knownTags}
              lists={lists}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onRename={onRename}
              onChangeDescription={onChangeDescription}
              onChangeDueDate={onChangeDueDate}
              onChangeRepeat={onChangeRepeat}
              onChangeReward={onChangeReward}
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
          ))}
        </SortableTasks>
      </ul>
    </>
  )
}
