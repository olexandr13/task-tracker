/**
 * Where a task sits in the list.
 *
 * Each task carries a number of its own rather than taking its place from where
 * it happens to fall in an array. Moving a task then rewrites that one task — it
 * takes a number between its new neighbours — so records from two devices could
 * still be merged one by one, the same reason ids are UUIDs. Numbers are handed
 * out with gaps, so there is room to move into.
 *
 * The number is only half of what the screen shows: overdue tasks float to the
 * top, urgent next, and done ones sink to the bottom (`sortForDisplay`), each
 * band keeping this order inside it.
 */

import { isOverdue } from './due'
import { isComplete, type Task, type TaskId } from './task'

/** The gap left between neighbours whenever numbers are handed out. */
export const ORDER_STEP = 1024

/** Which side of the target a moved task lands on. */
export type Placement = 'before' | 'after'

/**
 * Lower numbers first. Ties, which only a merge could produce, fall back to age
 * and then id, so the order is never left to chance.
 */
export function compareOrder(a: Task, b: Task): number {
  if (a.order !== b.order) return a.order - b.order
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
  if (a.id === b.id) return 0
  return a.id < b.id ? -1 : 1
}

/** Returns a new list in order; the one passed in is never modified. */
export function sortByOrder(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(compareOrder)
}

/**
 * The order a list draws: the overdue still to do first — the run a list heads
 * with **Overdue** (`splitOverdue`) — then the rest still to do, then done.
 * Urgent floats to the top inside each of the two open runs, so an overdue task
 * marked urgent leads the overdue rather than leaving its run. Within each band
 * the stored order is kept. Sort is stable, so completing one, marking one
 * urgent, or a day turning overdue does not shuffle the others inside their
 * band.
 *
 * Returns a new list; the one passed in is never modified.
 */
export function sortForDisplay(tasks: readonly Task[], now: Date = new Date()): Task[] {
  return sortByOrder(tasks).sort((a, b) => {
    const aDone = isComplete(a, now)
    const bDone = isComplete(b, now)
    if (aDone !== bDone) return Number(aDone) - Number(bDone)
    if (aDone) return 0

    const aOverdue = isOverdue(a, now)
    const bOverdue = isOverdue(b, now)
    if (aOverdue !== bOverdue) return Number(bOverdue) - Number(aOverdue)

    if (a.urgent !== b.urgent) return Number(b.urgent) - Number(a.urgent)

    return 0
  })
}

/**
 * Adds a task at the end of the list. Trashed tasks count when finding the end,
 * so one restored later never lands on the number of a task added while it was
 * away.
 */
export function appendTask(tasks: readonly Task[], task: Task): Task[] {
  const order = tasks.length === 0 ? 0 : Math.max(...tasks.map((existing) => existing.order)) + ORDER_STEP

  return [...tasks, { ...task, order }]
}

/**
 * Adds a task just before or just after another — where a copy of a task goes.
 * The same as adding it at the end and moving it there, so it takes a number
 * between its neighbours by the same rule a move does. A target that is not in
 * the list leaves the task at the end.
 *
 * Returns a new list; the one passed in is never modified.
 */
export function insertTask(tasks: readonly Task[], task: Task, targetId: TaskId, placement: Placement): Task[] {
  return moveTask(appendTask(tasks, task), task.id, targetId, placement)
}

/**
 * Moves a task to just before or just after another. Only the moved task
 * changes — unless its new neighbours' numbers have grown too close to split,
 * in which case the whole list is numbered afresh, once, in its new order.
 *
 * Neighbours are found across every task, done and trashed ones included, so
 * the task lands next to its target in any view that shows the two of them.
 *
 * Returns a new list; the one passed in is never modified.
 */
export function moveTask(tasks: readonly Task[], id: TaskId, targetId: TaskId, placement: Placement): Task[] {
  const moving = tasks.find((task) => task.id === id)
  const rest = sortByOrder(tasks.filter((task) => task.id !== id))
  const at = rest.findIndex((task) => task.id === targetId)
  if (moving === undefined || at === -1) {
    return [...tasks]
  }

  const index = placement === 'before' ? at : at + 1
  const previous = index > 0 ? rest[index - 1] : undefined
  const next = index < rest.length ? rest[index] : undefined

  const alreadyThere =
    (previous === undefined || compareOrder(previous, moving) < 0) &&
    (next === undefined || compareOrder(moving, next) < 0)
  if (alreadyThere) {
    return [...tasks]
  }

  const order = between(previous?.order, next?.order)
  if (order !== null) {
    return tasks.map((task) => (task === moving ? { ...task, order } : task))
  }

  return renumber(tasks, [...rest.slice(0, index), moving, ...rest.slice(index)])
}

/** A number strictly between the two, or null when halving has run out. */
function between(low: number | undefined, high: number | undefined): number | null {
  if (low === undefined) return (high ?? 0) - ORDER_STEP
  if (high === undefined) return low + ORDER_STEP

  const middle = low + (high - low) / 2
  // A number equal to either neighbour would tie with it rather than sit between.
  return low < middle && middle < high ? middle : null
}

/** Hands out fresh, evenly spaced numbers in the given sequence, touching only tasks whose number changes. */
function renumber(tasks: readonly Task[], sequence: readonly Task[]): Task[] {
  const orders = new Map(sequence.map((task, index) => [task.id, index * ORDER_STEP]))

  return tasks.map((task) => {
    const order = orders.get(task.id) ?? task.order
    return order === task.order ? task : { ...task, order }
  })
}
