import { isCategoryName, isTagName, type Category } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a Balance category (BAL-1). Its own version, apart from
 * the tags': a category names its tags rather than pointing at their records,
 * as a task does (../core/balance), so the two never reach into each other.
 * Bump this whenever the shape below changes, and upgrade on reading.
 */
export const CATEGORY_SCHEMA_VERSION = 1

export interface StoredCategory {
  version: number
  category: Category
}

export function toStoredCategory(category: Category): StoredCategory {
  return { version: CATEGORY_SCHEMA_VERSION, category }
}

/**
 * A saved category, or null when it can't be trusted — an unknown version, or
 * anything in it that is not what it should be. A category that cannot be read
 * is left unread rather than deleted, as a list is.
 */
export function readCategory(data: unknown): Category | null {
  if (!isRecord(data) || data.version !== CATEGORY_SCHEMA_VERSION || !isRecord(data.category)) return null

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

  return { id, name, tags: tags as string[], createdAt }
}
