import { describe, expect, it } from 'vitest'
import { JOURNAL_SECTIONS } from '../core'
import {
  arrangeJournalSections,
  DEFAULT_JOURNAL_LAYOUT,
  foldJournalSection,
  isJournalSectionFolded,
  moveJournalSection,
} from './journalLayoutRepository'
import { JOURNAL_LAYOUT_SCHEMA_VERSION, readJournalLayout, toStoredJournalLayout } from './journalLayoutSchema'

/* The journal's layout and reading it back (JRN-11, JRN-12 in wiki/journal.md, STORE-70 in wiki/storage.md). */

const moved = ['thoughts', 'insights', 'good', 'achievements', 'gratitude', 'improve'] as const

describe('readJournalLayout', () => {
  it('reads back what was saved', () => {
    const layout = { order: moved, folded: ['gratitude', 'good'] as const }

    expect(readJournalLayout(toStoredJournalLayout(layout))).toEqual(layout)
    expect(readJournalLayout(toStoredJournalLayout(DEFAULT_JOURNAL_LAYOUT))).toEqual(DEFAULT_JOURNAL_LAYOUT)
  })

  it('reads past a section the journal no longer has, and puts one it never mentions last', () => {
    const saved = {
      version: JOURNAL_LAYOUT_SCHEMA_VERSION,
      order: ['thoughts', 'gone', 'insights', 'good', 'achievements', 'gratitude'],
      folded: ['gone', 'good', 'good'],
    }

    expect(readJournalLayout(saved)).toEqual({
      order: ['thoughts', 'insights', 'good', 'achievements', 'gratitude', 'improve'],
      folded: ['good'],
    })
  })

  it('does not trust a version it does not know', () => {
    expect(readJournalLayout({ ...toStoredJournalLayout(DEFAULT_JOURNAL_LAYOUT), version: JOURNAL_LAYOUT_SCHEMA_VERSION + 1 })).toBeNull()
  })

  it('does not trust a layout that is not shaped as it should be', () => {
    expect(readJournalLayout(null)).toBeNull()
    expect(readJournalLayout({ version: JOURNAL_LAYOUT_SCHEMA_VERSION, order: [] })).toBeNull()
    expect(readJournalLayout({ version: JOURNAL_LAYOUT_SCHEMA_VERSION, order: 'good', folded: [] })).toBeNull()
    expect(readJournalLayout({ version: JOURNAL_LAYOUT_SCHEMA_VERSION, order: [], folded: [1] })).toBeNull()
  })
})

describe('arrangeJournalSections', () => {
  it('keeps every section once, in the order given', () => {
    expect(arrangeJournalSections(['improve', 'improve', 'insights'])).toEqual([
      'improve',
      'insights',
      'good',
      'achievements',
      'gratitude',
      'thoughts',
    ])
    expect(arrangeJournalSections([])).toEqual(JOURNAL_SECTIONS)
  })
})

describe('moveJournalSection (JRN-11)', () => {
  it('puts the section where the one it was dropped on is, going up or down', () => {
    expect(moveJournalSection(DEFAULT_JOURNAL_LAYOUT, 'thoughts', 'insights').order).toEqual(moved)
    expect(moveJournalSection(DEFAULT_JOURNAL_LAYOUT, 'insights', 'achievements').order).toEqual([
      'good',
      'achievements',
      'insights',
      'gratitude',
      'improve',
      'thoughts',
    ])
  })

  it('hands back the very same layout when nothing moves', () => {
    expect(moveJournalSection(DEFAULT_JOURNAL_LAYOUT, 'good', 'good')).toBe(DEFAULT_JOURNAL_LAYOUT)
  })

  it('leaves what is folded alone', () => {
    const layout = { order: JOURNAL_SECTIONS, folded: ['good'] as const }

    expect(moveJournalSection(layout, 'good', 'thoughts').folded).toEqual(['good'])
  })
})

describe('foldJournalSection (JRN-12)', () => {
  it('folds a section and brings it back', () => {
    const folded = foldJournalSection(DEFAULT_JOURNAL_LAYOUT, 'gratitude', true)

    expect(isJournalSectionFolded(folded, 'gratitude')).toBe(true)
    expect(isJournalSectionFolded(folded, 'good')).toBe(false)
    expect(isJournalSectionFolded(foldJournalSection(folded, 'gratitude', false), 'gratitude')).toBe(false)
  })

  it('hands back the very same layout when the section is already that way', () => {
    expect(foldJournalSection(DEFAULT_JOURNAL_LAYOUT, 'good', false)).toBe(DEFAULT_JOURNAL_LAYOUT)
  })
})
