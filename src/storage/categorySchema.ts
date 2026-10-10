import { isCategoryName, isSessionSeconds, isTagName, isTimeComment, type Category, type TimeEntry } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a Balance category (BAL-1). Its own version, apart from
 * the tags': a category names its tags rather than pointing at their records,
 * as a task does (../core/balance), so the two never reach into each other.
 * Bump this whenever the shape below changes, and upgrade on reading.
 *
 * Version 1 had no time logged straight to the category (BAL-14): a category
 * saved then is read as having none.
 */
export const CATEGORY_SCHEMA_VERSION = 2

export interface StoredCategory {
  version: number
  category: Category
}

export function toStoredCategory(category: Category): StoredCategory {
  return { version: CATEGORY_SCHEMA_VERSION, category }
}

/** A session logged straight to a category, or null when anything in it is not what it should be. */
function readTimeEntry(data: unknown): TimeEntry | null {
  if (!isRecord(data)) return null

  const { id, seconds, loggedAt, comment } = data
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof seconds !== 'number' ||
    !isSessionSeconds(seconds) ||
    typeof loggedAt !== 'string' ||
    Number.isNaN(Date.parse(loggedAt)) ||
    !(comment === null || (typeof comment === 'string' && isTimeComment(comment)))
  ) {
    return null
  }
  return { id, seconds, loggedAt, comment }
}

/** The sessions a version 2 category holds, or null when any of them cannot be trusted. */
function readTimeLog(data: unknown): TimeEntry[] | null {
  if (!Array.isArray(data)) return null

  const read: TimeEntry[] = []
  for (const saved of data) {
    const entry = readTimeEntry(saved)
    if (entry === null) return null
    read.push(entry)
  }
  return read
}

/**
 * A saved category in today's shape, upgraded from the one before it, or null
 * when it can't be trusted — an unknown version, or anything in it that is not
 * what it should be. A category that cannot be read is left unread rather than
 * deleted, as a list is.
 */
export function readCategory(data: unknown): Category | null {
  if (!isRecord(data) || (data.version !== CATEGORY_SCHEMA_VERSION && data.version !== 1) || !isRecord(data.category)) {
    return null
  }

  const { id, name, tags, createdAt } = data.category
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof name !== 'string' ||
    !isCategoryName(name) ||
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === 'string' && isTagName(tag)) ||
    typeof createdAt !== 'string' ||
    Number.isNaN(new Date(createdAt).getTime())
  ) {
    return null
  }

  const timeLog = data.version === 1 ? [] : readTimeLog(data.category.timeLog)
  if (timeLog === null) return null

  return { id, name, tags: tags as string[], timeLog, createdAt }
}
