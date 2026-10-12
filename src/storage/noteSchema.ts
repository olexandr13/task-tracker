import { isBlankNoteText, type Note } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a note (NOTE-1). Its own version, apart from everything
 * else's; bump it whenever the shape below changes, and upgrade on reading
 * (STORE-5).
 *
 * - 1: what is written, when it was first written and when it last changed.
 */
export const NOTE_SCHEMA_VERSION = 1

export interface StoredNote {
  version: number
  note: Note
}

export function toStoredNote(note: Note): StoredNote {
  return { version: NOTE_SCHEMA_VERSION, note }
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

/**
 * A saved note in today's shape, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be. A note that cannot
 * be read is left unread rather than deleted (STORE-7).
 */
export function readNote(data: unknown): Note | null {
  if (!isRecord(data) || data.version !== NOTE_SCHEMA_VERSION || !isRecord(data.note)) return null

  const { id, text, createdAt, updatedAt } = data.note
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof text !== 'string' ||
    isBlankNoteText(text) ||
    !isTime(createdAt) ||
    !isTime(updatedAt)
  ) {
    return null
  }
  return { id, text, createdAt, updatedAt }
}
