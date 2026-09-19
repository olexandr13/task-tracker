import { useDndContext } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { isComplete, type Task } from '../core'

/**
 * A row that can be dragged among the tasks of its own group — to-do or done —
 * and no further. Done tasks sink below the rest whatever order they are given,
 * so while one group's row is being dragged the other group's rows are not
 * places it can land: completing a task is what moves it between the two.
 *
 * A list that divides its done tasks further — by when they were finished —
 * names the group itself, since no drag changes when a task was finished either.
 */
export function useSortableTask(task: Task, now: Date, group: string = isComplete(task, now) ? 'done' : 'todo') {
  const { active } = useDndContext()
  const otherGroupIsMoving = active !== null && active.data.current?.group !== group

  return useSortable({
    id: task.id,
    data: { group },
    disabled: { draggable: false, droppable: otherGroupIsMoving },
  })
}
