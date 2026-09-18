import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import type { Task } from '../../core'

interface SortableTasksProps {
  /** The tasks in the order they are shown. Each row inside calls `useSortableTask`. */
  tasks: readonly Task[]
  children: ReactNode
}

/**
 * The rows inside, as places in one order that a dragged row can take. Picking a
 * row up, and what dropping it does, belong to TaskDragAndDrop, which also holds
 * the lists in the navigation a task can be dropped on.
 */
export function SortableTasks({ tasks, children }: SortableTasksProps) {
  return (
    <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  )
}
