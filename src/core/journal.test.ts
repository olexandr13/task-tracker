import { describe, expect, it } from 'vitest'
import {
  changeJournalText,
  createJournalEntry,
  firstKeptJournalDay,
  InvalidJournalTextError,
  isJournalEntryKept,
  isJournalSection,
  isJournalText,
  journalHistory,
  journalLines,
  MAX_JOURNAL_TEXT_LENGTH,
  normalizeJournalText,
  type JournalEntry,
} from './journal'

/* JRN ids refer to wiki/journal.md. */

// Saturday 10 October 2026, nine in the evening.
const NOW = new Date(2026, 9, 10, 21, 0)
const TODAY = '2026-10-10'

function line(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'a',
    day: TODAY,
    section: 'good',
    text: 'Coffee on the terrace',
    writtenAt: '2026-10-10T18:00:00.000Z',
    ...overrides,
  }
}

describe('a line (JRN-2)', () => {
  it('is something written, squeezed onto one line', () => {
    expect(normalizeJournalText('  Sun came out\nafter   the rain ')).toBe('Sun came out after the rain')
    expect(isJournalText('   ')).toBe(false)
    expect(() => normalizeJournalText('')).toThrow(InvalidJournalTextError)
  })

  it('is no longer than a sentence or two', () => {
    expect(isJournalText('x'.repeat(MAX_JOURNAL_TEXT_LENGTH))).toBe(true)
    expect(isJournalText('x'.repeat(MAX_JOURNAL_TEXT_LENGTH + 1))).toBe(false)
  })

  it('belongs to one of the three sections', () => {
    expect(isJournalSection('gratitude')).toBe(true)
    expect(isJournalSection('regrets')).toBe(false)
  })

  it('is made for its day and section, knowing when it was written', () => {
    const made = createJournalEntry('achievements', ' Ran 5 km ', TODAY, NOW)
    expect(made).toMatchObject({ day: TODAY, section: 'achievements', text: 'Ran 5 km', writtenAt: NOW.toISOString() })
    expect(made.id).not.toBe('')
  })

  it('keeps its place when changed, and is the same line when nothing changed', () => {
    const before = line()
    expect(changeJournalText(before, ' Coffee on the terrace ')).toBe(before)
    expect(changeJournalText(before, 'Tea instead')).toEqual({ ...before, text: 'Tea instead' })
  })
})

describe('the lines of a section (JRN-3)', () => {
  it('are that day’s and that section’s, in the order they were written', () => {
    const entries = [
      line({ id: 'late', writtenAt: '2026-10-10T19:00:00.000Z' }),
      line({ id: 'early', writtenAt: '2026-10-10T08:00:00.000Z' }),
      line({ id: 'other section', section: 'gratitude' }),
      line({ id: 'other day', day: '2026-10-09' }),
    ]
    expect(journalLines(entries, TODAY, 'good').map((entry) => entry.id)).toEqual(['early', 'late'])
  })
})

describe('what is kept (JRN-8)', () => {
  it('is today and the seven days before it', () => {
    expect(firstKeptJournalDay(NOW)).toBe('2026-10-03')
    expect(isJournalEntryKept(line({ day: '2026-10-03' }), NOW)).toBe(true)
    expect(isJournalEntryKept(line({ day: '2026-10-02' }), NOW)).toBe(false)
  })
})

describe('the history (JRN-6)', () => {
  it('is the week before today, latest day first, leaving out days with nothing written', () => {
    const entries = [
      line({ id: 'today' }),
      line({ id: 'yesterday', day: '2026-10-09', section: 'gratitude' }),
      line({ id: 'a week ago', day: '2026-10-03' }),
      line({ id: 'too old', day: '2026-10-02' }),
    ]
    const history = journalHistory(entries, NOW)
    expect(history.map((day) => day.day)).toEqual(['2026-10-09', '2026-10-03'])
    expect(history[0].sections.gratitude.map((entry) => entry.id)).toEqual(['yesterday'])
    expect(history[0].sections.good).toEqual([])
  })
})
