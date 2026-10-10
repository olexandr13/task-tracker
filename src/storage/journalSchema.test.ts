// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createJournalEntry, type JournalEntry } from '../core'
import { journalChangesBetween } from './journalRepository'
import {
  JOURNAL_SCHEMA_VERSION,
  readJournalDay,
  readJournalEntry,
  toStoredJournalDays,
  toStoredJournalEntry,
} from './journalSchema'
import { clearGuestJournal, createLocalJournalRepository, loadGuestJournal } from './localJournalRepository'

/* Keeping the journal. JRN ids refer to wiki/journal.md, STORE ids to wiki/storage.md. */

const AT = new Date('2026-10-10T18:00:00.000Z')
const SUNNY = { ...createJournalEntry('good', 'Sun came out', '2026-10-10', AT), id: 'sunny' }
const RAN = { ...createJournalEntry('achievements', 'Ran 5 km', '2026-10-10', AT), id: 'ran' }
const THANKS = { ...createJournalEntry('gratitude', 'A friend called', '2026-10-02', AT), id: 'thanks' }

describe('a saved day (STORE-60)', () => {
  it('holds a field per line, keyed by its id, and reads back as written', () => {
    const [day] = toStoredJournalDays([SUNNY, RAN])

    expect(day).toEqual({
      version: JOURNAL_SCHEMA_VERSION,
      day: '2026-10-10',
      entries: {
        sunny: { section: 'good', text: 'Sun came out', writtenAt: AT.toISOString() },
        ran: { section: 'achievements', text: 'Ran 5 km', writtenAt: AT.toISOString() },
      },
    })
    expect(readJournalDay(day)).toEqual([SUNNY, RAN])
  })

  it('reads a day whose every line was taken out as nothing written', () => {
    expect(readJournalDay({ version: JOURNAL_SCHEMA_VERSION, day: '2026-10-10' })).toEqual([])
  })

  it('does not trust a day in an unknown version, or with a line that is not one (STORE-7)', () => {
    const [day] = toStoredJournalDays([SUNNY])
    expect(readJournalDay({ ...day, version: JOURNAL_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readJournalDay({ ...day, entries: { x: { section: 'regrets', text: 'No', writtenAt: AT.toISOString() } } })).toBeNull()
    expect(readJournalDay({ ...day, entries: { x: { section: 'good', text: '  ', writtenAt: AT.toISOString() } } })).toBeNull()
    expect(readJournalDay({ ...day, day: '2026-02-30' })).toBeNull()
  })

  it('reads a guest’s line back, and refuses one that is not one', () => {
    expect(readJournalEntry(toStoredJournalEntry(SUNNY))).toEqual(SUNNY)
    expect(readJournalEntry({ version: JOURNAL_SCHEMA_VERSION, entry: { ...SUNNY, writtenAt: 'soon' } })).toBeNull()
  })
})

describe('what a change writes (STORE-60)', () => {
  it('is only the lines added or changed, and the ones taken out', () => {
    const changed: JournalEntry = { ...RAN, text: 'Ran 10 km' }

    expect(journalChangesBetween([SUNNY, RAN], [SUNNY, changed])).toEqual({ saved: [changed], removed: [] })
    expect(journalChangesBetween([SUNNY, RAN], [RAN])).toEqual({ saved: [], removed: [SUNNY] })
  })
})

describe('the guest’s journal (STORE-37)', () => {
  afterEach(() => {
    clearGuestJournal()
    localStorage.clear()
  })

  it('keeps lines across a fresh repository, and takes out one removed', async () => {
    await createLocalJournalRepository().save({ saved: [SUNNY, RAN], removed: [] })
    await createLocalJournalRepository().save({ saved: [], removed: [SUNNY] })

    expect(loadGuestJournal()).toEqual([RAN])
  })

  it('lets go of every day before the one it is told (JRN-8)', async () => {
    await createLocalJournalRepository().save({ saved: [SUNNY, THANKS], removed: [] })
    await createLocalJournalRepository().forgetBefore('2026-10-03')

    expect(loadGuestJournal()).toEqual([SUNNY])
  })
})
