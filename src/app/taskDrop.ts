import { closestCenter, pointerWithin, type CollisionDetection, type UniqueIdentifier } from '@dnd-kit/core'
import type { ListId, Placement, TaskId } from '../core'

/**
 * A list in the navigation, as a place a task can be dropped to file it there —
 * or the Inbox, with no list at all.
 */
export interface ListDrop {
  readonly kind: 'list'
  readonly listId: ListId | null
  /** What it is called, for what a screen reader hears as the task goes over it. */
  readonly name: string
}

/** The lists share one space of ids with the rows, so theirs are set apart from any task's. */
export function listDropId(listId: ListId | null): string {
  return `list-drop:${listId ?? 'inbox'}`
}

export function isListDrop(data: unknown): data is ListDrop {
  return typeof data === 'object' && data !== null && (data as { kind?: unknown }).kind === 'list'
}

/**
 * Where a dragged task is over. A list only counts with the pointer **on** it: a
 * list is a small target well away from the rows, and a task being moved among
 * the rows must never land in one by being nearer to it than to any row.
 * Anywhere else it is the row nearest the dragged one, as it has always been. A
 * drag by keyboard has no pointer, so the rows are all it reaches.
 */
export const onListOrRow: CollisionDetection = (args) => {
  const lists = args.droppableContainers.filter((target) => isListDrop(target.data.current))
  const onList = pointerWithin({ ...args, droppableContainers: lists })
  if (onList.length > 0) return onList

  const rows = args.droppableContainers.filter((target) => !isListDrop(target.data.current))
  return closestCenter({ ...args, droppableContainers: rows })
}

/** What letting go of a task comes to. */
export type TaskDrop =
  | { readonly kind: 'move'; readonly id: TaskId; readonly targetId: TaskId; readonly placement: Placement }
  | { readonly kind: 'file'; readonly id: TaskId; readonly listId: ListId | null }

/**
 * What dropping task `id` on `over` does, with the rows shown in `order`. On a
 * list it is filed there. On another row it takes that row's place: dragged down,
 * it lands below the row it was dropped on; dragged up, above it. Anywhere else,
 * nothing.
 */
export function dropOutcome(
  id: UniqueIdentifier,
  over: { readonly id: UniqueIdentifier; readonly data: unknown } | null,
  order: readonly TaskId[],
): TaskDrop | null {
  if (over === null) return null
  if (isListDrop(over.data)) return { kind: 'file', id: String(id), listId: over.data.listId }

  const from = order.indexOf(String(id))
  const to = order.indexOf(String(over.id))
  if (from === -1 || to === -1 || from === to) return null
  return { kind: 'move', id: String(id), targetId: String(over.id), placement: from < to ? 'after' : 'before' }
}
