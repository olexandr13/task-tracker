import type { LocalDay, Placement, Repeat, SubtaskId, Task, TaskId } from '../../core'
import { SortableTasks } from './SortableTasks'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  /** The moment the list is drawn for; a repeating task is only done for its current occurrence. */
  now: Date
  /** What an empty list says, pointing at the box above it. */
  emptyMessage: string
  onMove: (id: TaskId, targetId: TaskId, placement: Placement) => void
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  onRename: (id: TaskId, title: string) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  onChangeRepeat: (id: TaskId, repeat: Repeat | null) => void
  onRemove: (id: TaskId) => void
  onAddSubtask: (id: TaskId, index: number, title: string) => void
  onSetSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  onRenameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  onRemoveSubtask: (id: TaskId, subtaskId: SubtaskId) => void
}

export function TaskList({
  tasks,
  now,
  emptyMessage,
  onMove,
  onComplete,
  onUncomplete,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onChangeRepeat,
  onRemove,
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

  return (
    <ul className="flex flex-col gap-1">
      <SortableTasks tasks={tasks} onMove={onMove}>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            now={now}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onRename={onRename}
            onChangeDescription={onChangeDescription}
            onChangeDueDate={onChangeDueDate}
            onChangeRepeat={onChangeRepeat}
            onRemove={onRemove}
            onAddSubtask={onAddSubtask}
            onSetSubtaskDone={onSetSubtaskDone}
            onRenameSubtask={onRenameSubtask}
            onRemoveSubtask={onRemoveSubtask}
          />
        ))}
      </SortableTasks>
    </ul>
  )
}
