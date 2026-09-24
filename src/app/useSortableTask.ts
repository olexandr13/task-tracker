import { useDndContext } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { isComplete, isOverdue, type Task } from '../core'

/** The band of done tasks, the one group a row is never dragged within. */
const DONE_GROUP = 'done'

/**
 * Drag group from how the list draws the row: the overdue run or the rest,
 * urgent apart inside each since it floats above its run, and done below both.
 */
function dragGroupOf(task: Task, now: Date): string {
  if (isComplete(task, now)) return DONE_GROUP
  const run = isOverdue(task, now) ? 'overdue' : 'todo'
  return task.urgent ? `${run}:urgent` : run
}

/**
 * A row that can be dragged among the tasks of its own group — urgent overdue,
 * other overdue, urgent, or other to-do — and no further. The overdue float
 * above the rest, and urgent above the rest of their own run, so while one
 * group's row is being dragged the other groups' rows are not places it can
 * land: completing a task, marking it urgent, or a day turning overdue, is what
 * moves it between them.
 *
 * The done band is neither picked up nor dropped into: its order is when the
 * tasks were finished (`sortForDisplay`), which no drag can change, so a row
 * dragged there would only come back to where it was. A list that names a group
 * of its own draws no such band — Habits is one flat list — and its rows move
 * whether they are done or not.
 */
export function useSortableTask(task: Task, now: Date, group: string = dragGroupOf(task, now)) {
  const { active } = useDndContext()
  const inDoneBand = group === DONE_GROUP
  const otherGroupIsMoving = active !== null && active.data.current?.group !== group

  return useSortable({
    id: task.id,
    data: { group },
    disabled: { draggable: inDoneBand, droppable: inDoneBand || otherGroupIsMoving },
  })
}
