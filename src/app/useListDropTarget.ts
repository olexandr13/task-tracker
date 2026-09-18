import { useDndContext, useDroppable } from '@dnd-kit/core'
import type { ListId } from '../core'
import { listDropId, type ListDrop } from './taskDrop'

/**
 * Makes a list in the navigation somewhere a task can be dropped to file it
 * there, or the Inbox with null. `isOver` is whether a task is over it now.
 *
 * Only a pointer reaches it. A drag by keyboard moves a row from one place in the
 * list to the next, and a list in the navigation is no such place: from the
 * keyboard a task is filed from its menu instead.
 */
export function useListDropTarget(listId: ListId | null, name: string) {
  const { activatorEvent } = useDndContext()
  const data: ListDrop = { kind: 'list', listId, name }

  return useDroppable({
    id: listDropId(listId),
    data,
    disabled: activatorEvent instanceof KeyboardEvent,
  })
}
