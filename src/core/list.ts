/**
 * Lists: the place a task is filed under.
 *
 * A list is **a record of its own**, and a task is in **one** of them or in
 * none. Being a record is what lets a list outlive its tasks — an empty list is
 * still somewhere to put the next thing — and, since a task names it by id
 * where a tag (./tag) is carried by name, lets it be renamed without every task
 * in it having to be rewritten. Being one
 * at a time is what makes a list a place rather than another label: tags say
 * what a task is about, a list says where it lives.
 *
 * A task in no list is in the **Inbox**, which is not a record and never needs
 * making: it is the absence of a list, so there is always somewhere a task can
 * be without a decision having been made about it.
 *
 * Not the lists written inside a description — those are ./descriptionLists.
 */

import { isComplete, type Task } from './task'

export type ListId = string

export interface List {
  readonly id: ListId
  /**
   * What it is called, as it was written. Unlike a tag, a name here may hold
   * spaces and punctuation: a list is a place with a name, and "Reading list"
   * is a fair thing to call one.
   */
  readonly name: string
  /** ISO 8601 timestamp. */
  readonly createdAt: string
  /**
   * Where it sits among the lists: lower comes first. Its own number rather
   * than its place in an array, for the reason a task has one — so records from
   * two devices merge one by one. See ./order.
   */
  readonly order: number
}

/** The gap left between neighbours, as tasks have one (./order). */
const LIST_ORDER_STEP = 1024

/** As long a name as a list is given room for on screen. */
export const MAX_LIST_NAME_LENGTH = 40

export class InvalidListNameError extends Error {
  constructor(name: string) {
    super(`"${name}" is not a list name: a list needs a name, on one line, of at most ${String(MAX_LIST_NAME_LENGTH)} characters.`)
    this.name = 'InvalidListNameError'
  }
}

/**
 * Whether `name` can name a list: something other than space, on one line, and
 * short enough to read. Anything else is allowed — the address names a list by
 * its id, never by its name, so no character has to be kept free.
 */
export function isListName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_LIST_NAME_LENGTH && !/[\r\n]/u.test(trimmed)
}

/** The stored form of a list name: trimmed, with the spaces inside it squeezed to one. */
export function normalizeListName(name: string): string {
  const trimmed = name.trim().replace(/\s+/gu, ' ')
  if (!isListName(trimmed)) {
    throw new InvalidListNameError(name)
  }

  return trimmed
}

/** Whether two names are the same list's. Case does not make another list, as with tags. */
export function sameListName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/**
 * A list of the given name. Its place among the others is the caller's to give:
 * `appendList` is what puts it at the end.
 */
export function createList(name: string, now: Date = new Date()): List {
  return {
    id: crypto.randomUUID(),
    name: normalizeListName(name),
    createdAt: now.toISOString(),
    order: 0,
  }
}

/** Renames a list. Nothing about its tasks changes: they are in it by its id. */
export function renameList(list: List, name: string): List {
  const renamed = normalizeListName(name)
  return renamed === list.name ? list : { ...list, name: renamed }
}

/** Adds a list at the end of the ones there are. Returns a new array. */
export function appendList(lists: readonly List[], list: List): List[] {
  const order = lists.length === 0 ? 0 : Math.max(...lists.map((existing) => existing.order)) + LIST_ORDER_STEP

  return [...lists, { ...list, order }]
}

/**
 * The lists in the order they are shown: their own, then age, then id, so two
 * merged devices never leave it to chance. Returns a new array.
 */
export function sortLists(lists: readonly List[]): List[] {
  return [...lists].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
    if (a.id === b.id) return 0
    return a.id < b.id ? -1 : 1
  })
}

export function findList(lists: readonly List[], id: ListId): List | null {
  return lists.find((list) => list.id === id) ?? null
}

/** Whether any list is called this already, whatever its case — `except` aside, which is its own. */
export function isNameTaken(lists: readonly List[], name: string, except: ListId | null = null): boolean {
  const trimmed = name.trim().replace(/\s+/gu, ' ')
  return lists.some((list) => list.id !== except && sameListName(list.name, trimmed))
}

/**
 * The list the task is in, or null for the Inbox.
 *
 * A task naming a list that is not among `lists` reads as being in the Inbox: a
 * list deleted on another device leaves its tasks somewhere real rather than
 * nowhere, so nothing is ever out of reach of every view at once.
 */
export function listOf(task: Task, lists: readonly List[]): List | null {
  return task.listId === null ? null : findList(lists, task.listId)
}

/** Whether the task is in this very list. */
export function isInList(task: Task, id: ListId): boolean {
  return task.listId === id
}

/** Whether the task is in no list: filed nowhere, or in a list that is gone. */
export function isInInbox(task: Task, lists: readonly List[]): boolean {
  return listOf(task, lists) === null
}

/**
 * Moves the task to a list, or to the Inbox with null. Nothing else about it
 * changes: a task is the same task wherever it is filed.
 *
 * Returns a new task; the one passed in is never modified.
 */
export function moveToList(task: Task, id: ListId | null): Task {
  return task.listId === id ? task : { ...task, listId: id }
}

/**
 * Empties a list: every task in it goes back to the Inbox, tasks in the trash
 * too, so restoring one never files it under a list that has gone. The tasks
 * themselves stay. Tasks elsewhere are handed back as they were.
 *
 * Returns a new array; the one passed in is never modified.
 */
export function clearList(tasks: readonly Task[], id: ListId): Task[] {
  return tasks.map((task) => (isInList(task, id) ? moveToList(task, null) : task))
}

export interface ListSummary {
  readonly list: List
  /** How many of the tasks in it are still to do. */
  readonly open: number
}

/**
 * Every list, in the order they are shown, with how many of its tasks are still
 * to do as of `now` — a repeating one for its current occurrence. Pass live
 * tasks: what is in the trash is not what a list is holding.
 */
export function summarizeLists(
  lists: readonly List[],
  tasks: readonly Task[],
  now: Date = new Date(),
): ListSummary[] {
  return sortLists(lists).map((list) => ({
    list,
    open: tasks.filter((task) => isInList(task, list.id) && !isComplete(task, now)).length,
  }))
}

/** How many tasks in the Inbox are still to do, counted as `summarizeLists` counts a list's. */
export function countInboxOpen(tasks: readonly Task[], lists: readonly List[], now: Date = new Date()): number {
  return tasks.filter((task) => isInInbox(task, lists) && !isComplete(task, now)).length
}
