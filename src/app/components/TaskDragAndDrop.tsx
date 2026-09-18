import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  type Over,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { getEventCoordinates } from '@dnd-kit/utilities'
import { useState, type ReactNode } from 'react'
import type { ListId, Placement, Task, TaskId } from '../../core'
import { RowMouseSensor, RowTouchSensor } from '../dragSensors'
import { dropOutcome, isListDrop, onListOrRow } from '../taskDrop'

interface TaskDragAndDropProps {
  /** The tasks shown, in the order they are shown: every row that can be picked up. */
  tasks: readonly Task[]
  onMove: (id: TaskId, targetId: TaskId, placement: Placement) => void
  /** Files a task under a list, or in the Inbox with null. */
  onFile: (id: TaskId, listId: ListId | null) => void
  children: ReactNode
}

/** How far right of the pointer the dragged task's title rides. */
const POINTER_GAP = 12

/**
 * The title rides just right of the pointer, whatever part of the row was picked
 * up, so it is always plain what is being carried and where it is going.
 */
const besideThePointer: Modifier = ({ activatorEvent, activeNodeRect, overlayNodeRect, transform }) => {
  const start = activatorEvent === null ? null : getEventCoordinates(activatorEvent)
  if (start === null || activeNodeRect === null) return transform

  return {
    ...transform,
    x: transform.x + start.x - activeNodeRect.left + POINTER_GAP,
    y: transform.y + start.y - activeNodeRect.top - (overlayNodeRect?.height ?? 0) / 2,
  }
}

/**
 * Picking a task up and putting it somewhere else: among the rows, to change its
 * place in the order, or onto a list in the navigation, to file it there. Holds
 * the rows (SortableTasks) and the navigation's lists (useListDropTarget) alike,
 * so it sits around the whole screen.
 *
 * A mouse picks a row up once it has moved a few pixels, so a click is still a
 * click. A finger has to hold for a moment first, so a swipe still scrolls the
 * page. The keyboard picks a row up from its grip with Space or Enter, and moves
 * it among the rows only.
 *
 * What moves with the pointer is the task's title, not the whole row: a row is
 * as wide as the list, and would cover the navigation it is being carried to.
 * The row itself stays in the list, faded, showing where it would land.
 */
export function TaskDragAndDrop({ tasks, onMove, onFile, children }: TaskDragAndDropProps) {
  const sensors = useSensors(
    useSensor(RowMouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(RowTouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [carried, setCarried] = useState<Task | null>(null)
  const ids = tasks.map((task) => task.id)

  function titleOf(id: UniqueIdentifier): string {
    return tasks.find((task) => task.id === id)?.title ?? 'task'
  }

  function placeOf(over: Over): string {
    const data = over.data.current
    if (isListDrop(data)) return data.listId === null ? 'the Inbox' : `the list ${data.name}`
    return `position ${String(ids.indexOf(String(over.id)) + 1)} of ${String(ids.length)}`
  }

  // The defaults read out ids, which are UUIDs; a person needs the title.
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up "${titleOf(active.id)}", position ${String(ids.indexOf(String(active.id)) + 1)} of ${String(ids.length)}.`,
    onDragOver: ({ active, over }) =>
      over === null ? `"${titleOf(active.id)}" is not over the list.` : `"${titleOf(active.id)}" is over ${placeOf(over)}.`,
    onDragEnd: ({ active, over }) =>
      over === null ? `"${titleOf(active.id)}" dropped.` : `"${titleOf(active.id)}" dropped at ${placeOf(over)}.`,
    onDragCancel: ({ active }) => `Moving "${titleOf(active.id)}" was cancelled.`,
  }

  function handleDragStart({ active }: DragStartEvent) {
    setCarried(tasks.find((task) => task.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    ignoreNextClick()
    setCarried(null)

    const drop = dropOutcome(active.id, over === null ? null : { id: over.id, data: over.data.current }, ids)
    if (drop?.kind === 'move') onMove(drop.id, drop.targetId, drop.placement)
    if (drop?.kind === 'file') onFile(drop.id, drop.listId)
  }

  function handleDragCancel() {
    ignoreNextClick()
    setCarried(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={onListOrRow}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      {/* Only as big as the title, rather than the row it was picked up from. No
          animation back to the row on a drop: filed in a list, it is not going back. */}
      <DragOverlay modifiers={[besideThePointer]} dropAnimation={null} style={{ width: 'auto', height: 'auto' }}>
        {carried !== null && (
          <div className="max-w-64 cursor-grabbing truncate rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
            {carried.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

/**
 * Letting go of a row clicks whatever is under the pointer, which would open a
 * row or go to a list's view. The click that belongs to the drop is swallowed.
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
