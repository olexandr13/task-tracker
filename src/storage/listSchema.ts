import { isListName, type List } from '../core'

/**
 * The saved shape of a list. Its own version, apart from the tasks' and the
 * points': a list and a task have no reason to change shape together, and a
 * task names its list by id, so neither reaches into the other. Bump this
 * whenever the shape below changes, and upgrade on reading.
 */
export const LIST_SCHEMA_VERSION = 1

export interface StoredList {
  version: number
  list: List
}

export function toStoredList(list: List): StoredList {
  return { version: LIST_SCHEMA_VERSION, list }
}

/**
 * A saved list in today's shape, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be. A list that cannot
 * be read is left unread rather than deleted, as a task is.
 */
export function readList(data: unknown): List | null {
  if (!isRecord(data) || data.version !== LIST_SCHEMA_VERSION || !isRecord(data.list)) return null

  const { id, name, createdAt, order } = data.list
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof name !== 'string' ||
    !isListName(name) ||
    typeof createdAt !== 'string' ||
    Number.isNaN(new Date(createdAt).getTime()) ||
    typeof order !== 'number' ||
    !Number.isFinite(order)
  ) {
    return null
  }

  return { id, name, createdAt, order }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
