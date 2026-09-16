import {
  DndContext,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import type { Placement, Task, TaskId } from '../../core'
import { RowMouseSensor, RowTouchSensor } from '../dragSensors'

interface SortableTasksProps {
  /** The tasks in the order they are shown. Each row inside calls `useSortableTask`. */
  tasks: Task[]
  onMove: (id: TaskId, targetId: TaskId, placement: Placement) => void
  children: ReactNode
}

/** Rows only ever travel up or down the list. */
const alongTheList: Modifier = ({ transform }) => ({ ...transform, x: 0 })

/**
 * Lets the rows inside be put in a new order by dragging them.
 *
 * A mouse picks a row up once it has moved a few pixels, so a click is still a
 * click. A finger has to hold for a moment first, so a swipe still scrolls the
 * page. The keyboard picks a row up from its grip with Space or Enter.
 */
export function SortableTasks({ tasks, onMove, children }: SortableTasksProps) {
  const sensors = useSensors(
    useSensor(RowMouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(RowTouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = tasks.map((task) => task.id)

  function titleOf(id: UniqueIdentifier): string {
    return tasks.find((task) => task.id === id)?.title ?? 'task'
  }

  function positionOf(id: UniqueIdentifier): string {
    return `position ${String(ids.indexOf(String(id)) + 1)} of ${String(ids.length)}`
  }

  // The defaults read out ids, which are UUIDs; a person needs the title.
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up "${titleOf(active.id)}", ${positionOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over === null ? `"${titleOf(active.id)}" is not over the list.` : `"${titleOf(active.id)}" moved to ${positionOf(over.id)}.`,
    onDragEnd: ({ active, over }) =>
      over === null ? `"${titleOf(active.id)}" dropped.` : `"${titleOf(active.id)}" dropped at ${positionOf(over.id)}.`,
    onDragCancel: ({ active }) => `Moving "${titleOf(active.id)}" was cancelled.`,
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    ignoreNextClick()
    if (over === null || active.id === over.id) return

    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    // Dragged down, the row lands below the one it was dropped on; dragged up, above it.
    onMove(String(active.id), String(over.id), from < to ? 'after' : 'before')
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[alongTheList]}
      accessibility={{ announcements }}
      onDragEnd={handleDragEnd}
      onDragCancel={ignoreNextClick}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

/**
 * Letting go of a row clicks whatever is under the pointer — the row itself,
 * since it followed the pointer there — which would open it or start editing its
 * title. The click that belongs to the drop is swallowed.
 */
function ignoreNextClick() {
  function swallow(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
  }

  window.addEventListener('click', swallow, { capture: true, once: true })
  // A drop by keyboard or finger is followed by no click at all, so the trap does not wait for one.
  setTimeout(() => { window.removeEventListener('click', swallow, { capture: true }) }, 0)
}
