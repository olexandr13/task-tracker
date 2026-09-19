import { isTagName, type Tag } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a kept tag. Its own version, apart from the tasks' and the
 * lists': a task carries its tags by name, so the two never reach into each
 * other. Bump this whenever the shape below changes, and upgrade on reading.
 */
export const TAG_SCHEMA_VERSION = 1

export interface StoredTag {
  version: number
  tag: Tag
}

export function toStoredTag(tag: Tag): StoredTag {
  return { version: TAG_SCHEMA_VERSION, tag }
}

/**
 * A saved tag in today's shape, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be. A tag that cannot be
 * read is left unread rather than deleted, as a task is.
 */
export function readTag(data: unknown): Tag | null {
  if (!isRecord(data) || data.version !== TAG_SCHEMA_VERSION || !isRecord(data.tag)) return null

  const { id, name, createdAt } = data.tag
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof name !== 'string' ||
    !isTagName(name) ||
    typeof createdAt !== 'string' ||
    Number.isNaN(new Date(createdAt).getTime())
  ) {
    return null
  }

  return { id, name, createdAt }
}
