import { describe, expect, it } from 'vitest'
import { describeExport, describeImport, describeRecordCounts } from './backupLabels'

/* How a backup reads on screen. BAK ids refer to wiki/backup.md. */

const NONE = { tasks: 0, lists: 0, tags: 0, prizes: 0, completions: 0, redemptions: 0 }

describe('counting what a file holds', () => {
  it('names each kind there is, and leaves out the ones there are none of', () => {
    expect(describeRecordCounts({ tasks: 12, lists: 2, tags: 3, prizes: 4, completions: 30, redemptions: 1 })).toBe(
      '12 tasks, 2 lists, 3 tags, 4 prizes, 30 completions and 1 redemption',
    )
    expect(describeRecordCounts({ ...NONE, prizes: 1 })).toBe('1 prize')
    expect(describeRecordCounts({ ...NONE, tags: 1 })).toBe('1 tag')
    expect(describeRecordCounts({ ...NONE, tasks: 1, completions: 4 })).toBe('1 task and 4 completions')
    expect(describeRecordCounts({ ...NONE, lists: 3 })).toBe('3 lists')
    expect(describeRecordCounts(NONE)).toBeNull()
  })
})

describe('what an export says (BAK-1)', () => {
  it('says what went into the file', () => {
    expect(describeExport({ ...NONE, tasks: 2, lists: 1 })).toBe('Exported 2 tasks and 1 list.')
  })

  it('says so when there was nothing to put in it', () => {
    expect(describeExport(NONE)).toBe('Exported an empty account: there is nothing in it yet.')
  })
})

describe('what an import says (BAK-10)', () => {
  it('says what it added', () => {
    expect(describeImport({ added: { ...NONE, tasks: 3 }, alreadyHere: 0 }, 0)).toBe('Imported 3 tasks.')
  })

  it('says how much was already here', () => {
    expect(describeImport({ added: { ...NONE, tasks: 3 }, alreadyHere: 5 }, 0)).toBe(
      'Imported 3 tasks. 5 records were already here and are left as they are.',
    )
    expect(describeImport({ added: NONE, alreadyHere: 1 }, 0)).toBe(
      'Nothing new to import. 1 record was already here and is left as it is.',
    )
  })

  it('says how much of the file could not be read', () => {
    expect(describeImport({ added: { ...NONE, lists: 1 }, alreadyHere: 0 }, 2)).toBe(
      'Imported 1 list. 2 records in the file couldn’t be read and were left out.',
    )
    expect(describeImport({ added: NONE, alreadyHere: 0 }, 1)).toBe(
      'Nothing new to import. 1 record in the file couldn’t be read and was left out.',
    )
  })
})
