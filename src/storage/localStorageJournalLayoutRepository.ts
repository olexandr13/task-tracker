import { DEFAULT_JOURNAL_LAYOUT, type JournalLayoutRepository } from './journalLayoutRepository'
import { readJournalLayout, toStoredJournalLayout } from './journalLayoutSchema'
import { createLocalStorageSetting } from './localStorageSetting'

/** The journal's layout, in this browser's `localStorage` (STORE-70). */
export const localStorageJournalLayoutRepository: JournalLayoutRepository = createLocalStorageSetting({
  key: 'task-tracker/journal-layout',
  read: readJournalLayout,
  write: toStoredJournalLayout,
  fallback: DEFAULT_JOURNAL_LAYOUT,
})
