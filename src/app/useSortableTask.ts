import { useDndContext } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { isComplete, isOverdue, type Task } from '../core'

/**
 * Drag group from how the list draws the row: the overdue run or the rest,
 * urgent apart inside each since it floats above its run, and done below both.
 */
function dragGroupOf(task: Task, now: Date): string {
  if (isComplete(task, now)) return 'done'
  const run = isOverdue(task, now) ? 'overdue' : 'todo'
  return task.urgent ? `${run}:urgent` : run
}

/**
 * A row that can be dragged among the tasks of its own group — urgent overdue,
 * other overdue, urgent, other to-do, or done — and no further. The overdue
 * float above the rest, urgent above the rest of their own run, and done sink
 * below whatever order they are given, so while one group's row is being dragged
 * the other groups' rows are not places it can land: completing a task, marking
 * it urgent, or a day turning overdue, is what moves it between them.
 *
 * A list that divides its done tasks further — by when they were finished —
 * names the group itself, since no drag changes when a task was finished either.
 */
export function useSortableTask(task: Task, now: Date, group: string = dragGroupOf(task, now)) {
  const { active } = useDndContext()
  const otherGroupIsMoving = active !== null && active.data.current?.group !== group

  return useSortable({
    id: task.id,
    data: { group },
    disabled: { draggable: false, droppable: otherGroupIsMoving },
  })
}
