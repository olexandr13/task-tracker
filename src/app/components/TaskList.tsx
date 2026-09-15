import type { Task, TaskId } from '../../core'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onComplete: (id: TaskId) => void
  onRemove: (id: TaskId) => void
}

export function TaskList({ tasks, onComplete, onRemove }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        Nothing here yet. Add your first task above.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onComplete={onComplete} onRemove={onRemove} />
      ))}
    </ul>
  )
}
