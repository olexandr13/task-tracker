import { isJournalSection } from '../core'
import { arrangeJournalSections, type JournalLayout } from './journalLayoutRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of the journal's layout (STORE-70). Its own version, apart
 * from everything else's. Bump this whenever the shape below changes, and
 * upgrade on reading. A section added later is not a change of shape: an order
 * that never mentions it puts it last, and it starts open.
 */
export const JOURNAL_LAYOUT_SCHEMA_VERSION = 1

export interface StoredJournalLayout {
  version: number
  order: string[]
  folded: string[]
}

export function toStoredJournalLayout(layout: JournalLayout): StoredJournalLayout {
  return { version: JOURNAL_LAYOUT_SCHEMA_VERSION, order: [...layout.order], folded: [...layout.folded] }
}

function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * A saved layout, or null when it can't be trusted — an unknown version, or an
 * order or folds that are not lists of names. A section the journal no longer
 * has is read past.
 */
export function readJournalLayout(data: unknown): JournalLayout | null {
  if (!isRecord(data) || data.version !== JOURNAL_LAYOUT_SCHEMA_VERSION) return null
  if (!isTextList(data.order) || !isTextList(data.folded)) return null

  return {
    order: arrangeJournalSections(data.order),
    folded: [...new Set(data.folded)].filter(isJournalSection),
  }
}
